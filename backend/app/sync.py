#!/usr/bin/env python3
"""
Hevy -> Garmin Connect strength workout sync.

    python sync.py auth      # one-time: log in locally, print the GARMINTOKENS secret
    python sync.py list      # print your Hevy routines + ids, to fill in config.yml
    python sync.py plan      # resolve everything, print the table, touch nothing
    python sync.py run       # build and upload to Garmin Connect

`run` is what the GitHub Actions button calls. It is unattended by design: if an
exercise can't be mapped confidently and isn't in config.yml `overrides`, the run
FAILS rather than quietly logging a squat as a lunge.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys
from pathlib import Path

import requests
import yaml

from matcher import match
from garminconnect import Garmin, exercises as gex
from garminconnect.workout import StrengthWorkout, WorkoutSegment, create_strength_set

HEVY = "https://api.hevyapp.com/v1"
STRENGTH = {"sportTypeId": 5, "sportTypeKey": "strength_training"}
CONFIG = Path(os.environ.get("SYNC_CONFIG", "config.yml"))
TOKENSTORE = Path("~/.garminconnect").expanduser()
WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


# --------------------------------------------------------------------------- #
# config
# --------------------------------------------------------------------------- #
def load_config() -> dict:
    if not CONFIG.exists():
        sys.exit(f"{CONFIG} not found.")
    cfg = yaml.safe_load(CONFIG.read_text()) or {}
    # A key that exists but has every entry commented out parses as None, not {}
    cfg["routines"] = cfg.get("routines") or []
    cfg["overrides"] = cfg.get("overrides") or {}
    cfg["defaults"] = cfg.get("defaults") or {}
    cfg["defaults"].setdefault("rest_seconds", 90)
    cfg["defaults"].setdefault("min_confidence", 0.85)
    if not cfg["routines"]:
        sys.exit(f"No routines listed in {CONFIG}.")
    return cfg


def hevy_key() -> str:
    key = os.environ.get("HEVY_API_KEY")
    if not key:
        sys.exit("HEVY_API_KEY is not set (hevy.com/settings?developer).")
    return key


# --------------------------------------------------------------------------- #
# hevy
# --------------------------------------------------------------------------- #
def fetch_routines(key: str) -> list[dict]:
    out, page = [], 1
    while True:
        r = requests.get(
            f"{HEVY}/routines",
            headers={"api-key": key},
            params={"page": page, "pageSize": 10},
            timeout=30,
        )
        r.raise_for_status()
        batch = r.json().get("routines", [])
        if not batch:
            return out
        out.extend(batch)
        page += 1


def select(routines: list[dict], wanted: list) -> list[tuple[dict, dict]]:
    """Pair each config entry with its Hevy routine, preserving config order."""
    picked, missing = [], []
    for entry in wanted:
        spec = entry if isinstance(entry, dict) else {"match": entry}
        needle = str(spec.get("id") or spec.get("match") or "").lower()
        hit = next((r for r in routines if r.get("id", "").lower() == needle), None)
        if hit is None:
            hit = next((r for r in routines if needle in r["title"].lower()), None)
        if hit is None:
            missing.append(needle)
        else:
            picked.append((hit, spec))
    if missing:
        sys.exit(
            "No Hevy routine matched: "
            + ", ".join(repr(m) for m in missing)
            + "\nRun `python sync.py list` and update config.yml."
        )
    return picked


def blocks_from(routine: dict, cfg: dict) -> list[dict]:
    """Collapse Hevy's per-set rows into one Garmin 'N sets' block per exercise."""
    out = []
    for ex in routine.get("exercises", []):
        sets = [s for s in ex.get("sets", []) if s.get("type") != "warmup"]
        sets = sets or ex.get("sets", [])

        # Garmin holds one rep/weight target for the whole block, so take the
        # top set and keep its reps and weight together — maxing each field
        # independently invents a set you never programmed (8 reps at your 6RM).
        weighted = [s for s in sets if s.get("weight_kg")]
        top = max(weighted, key=lambda s: s["weight_kg"]) if weighted else None
        reps = [s["reps"] for s in sets if s.get("reps")]

        out.append(
            {
                "hevy_name": ex["title"],
                "sets": len(sets) or 1,
                "reps": (top or {}).get("reps") or (max(reps) if reps else 10),
                "weight_kg": round(top["weight_kg"], 1) if top else None,
                "rest_seconds": float(
                    ex.get("rest_seconds") or cfg["defaults"]["rest_seconds"]
                ),
                # Hevy timed holds (planks, dead hangs) have no reps. Garmin's
                # strength step is rep-based, so these land as a 1-rep set.
                "timed": bool(
                    any(s.get("duration_seconds") for s in sets) and not reps
                ),
            }
        )
    return out


# --------------------------------------------------------------------------- #
# exercise mapping
# --------------------------------------------------------------------------- #
def resolve(blocks: list[dict], cfg: dict) -> list[str]:
    """Fill in category/exercise on each block. Returns a list of problems."""
    overrides = {k.lower(): v for k, v in cfg["overrides"].items()}
    floor = cfg["defaults"]["min_confidence"]
    valid = set(gex.CATEGORIES)
    pairs = {(e["category"], e["exercise"]) for e in gex.EXERCISES}
    problems = []

    for b in blocks:
        ov = overrides.get(b["hevy_name"].lower())
        if ov:
            b["category"] = ov["category"]
            b["exercise"] = ov.get("exercise", "")
            b["source"] = "override"
            if b["category"] not in valid:
                problems.append(
                    f"{b['hevy_name']}: override category {b['category']!r} "
                    "is not one of Garmin's 47 categories"
                )
            elif b["exercise"] and (b["category"], b["exercise"]) not in pairs:
                problems.append(
                    f"{b['hevy_name']}: {b['exercise']!r} is not filed under "
                    f"{b['category']} — Garmin will drop it"
                )
            continue

        best = match(b["hevy_name"], top=1)[0]
        b["category"] = best["category"]
        b["exercise"] = best["exercise"]
        b["garmin_name"] = best["name"]
        b["score"] = best["score"]
        b["source"] = "auto"
        if best["score"] < floor:
            problems.append(
                f"{b['hevy_name']}: low confidence ({best['score']:.2f}), best guess "
                f"{best['name']!r} [{best['category']}] — add it to `overrides`"
            )
    return problems


# --------------------------------------------------------------------------- #
# garmin
# --------------------------------------------------------------------------- #
def build(title: str, blocks: list[dict]) -> StrengthWorkout:
    steps, order = [], 1
    for b in blocks:
        steps.append(
            create_strength_set(
                b["category"],
                step_order=order,
                sets=int(b["sets"]),
                reps=int(b["reps"]),
                rest_seconds=float(b["rest_seconds"]),
                exercise_name=b.get("exercise") or "",
                weight_kg=b.get("weight_kg"),
            )
        )
        order += 3  # repeat group + inner exercise step + inner rest step
    return StrengthWorkout(
        workoutName=title[:80],
        estimatedDurationInSecs=0,
        workoutSegments=[
            WorkoutSegment(segmentOrder=1, sportType=STRENGTH, workoutSteps=steps)
        ],
    )


def connect() -> Garmin:
    """Token-first login.

    Garmin's SSO endpoint sits behind Cloudflare and returns 403 to datacenter
    IPs, so a CI runner cannot log in with email + password. It can, however,
    resume a session from tokens minted on your laptop. Order of preference:
    cached token dir (freshest), then the GARMINTOKENS secret, then credentials.
    """
    client = Garmin(
        os.environ.get("GARMIN_EMAIL"),
        os.environ.get("GARMIN_PASSWORD"),
        prompt_mfa=lambda: input("Garmin MFA code: "),
    )
    stores = [str(TOKENSTORE) if TOKENSTORE.exists() else None,
              os.environ.get("GARMINTOKENS")]
    for store in [s for s in stores if s]:
        try:
            client.login(store)
            return client
        except Exception as exc:  # noqa: BLE001 - try the next source
            print(f"token source failed ({type(exc).__name__}), trying next")
    client.login()  # last resort: email + password, interactive only
    return client


def next_date(weekday: str) -> str:
    """Next occurrence of e.g. 'mon', today included."""
    today = dt.date.today()
    delta = (WEEKDAYS.index(weekday.lower()[:3]) - today.weekday()) % 7
    return (today + dt.timedelta(days=delta)).isoformat()


# --------------------------------------------------------------------------- #
# commands
# --------------------------------------------------------------------------- #
def cmd_auth(_args) -> None:
    client = connect()
    TOKENSTORE.mkdir(parents=True, exist_ok=True)
    client.client.dump(str(TOKENSTORE))
    blob = client.client.dumps()
    print("\nLogin OK. Tokens cached at ~/.garminconnect\n")
    print("Add this as the repo secret GARMINTOKENS "
          "(Settings -> Secrets and variables -> Actions):\n")
    print(blob)


def cmd_list(_args) -> None:
    for r in fetch_routines(hevy_key()):
        print(f"{r['id']}  {len(r.get('exercises', [])):>2} ex  {r['title']}")


def render(cfg: dict) -> tuple[list[tuple[str, list[dict], dict]], list[str]]:
    routines = fetch_routines(hevy_key())
    plan, problems = [], []
    for routine, spec in select(routines, cfg["routines"]):
        blocks = blocks_from(routine, cfg)
        problems += resolve(blocks, cfg)
        title = spec.get("name") or routine["title"]
        plan.append((title, blocks, spec))
    return plan, problems


def table(plan) -> str:
    lines = []
    for title, blocks, _ in plan:
        lines.append(f"\n### {title}")
        lines.append("| Hevy | Garmin category | Sets x Reps | Weight | Rest |")
        lines.append("|---|---|---|---|---|")
        for b in blocks:
            mark = " *" if b["source"] == "override" else ""
            w = f"{b['weight_kg']} kg" if b["weight_kg"] else "bodyweight"
            reps = "hold" if b.get("timed") else f"{b['sets']} x {b['reps']}"
            lines.append(
                f"| {b['hevy_name']} | `{b['category']}`{mark} | "
                f"{reps} | {w} | {int(b['rest_seconds'])}s |"
            )
    return "\n".join(lines)


def cmd_plan(_args) -> None:
    cfg = load_config()
    plan, problems = render(cfg)
    print(table(plan))
    if problems:
        print("\nUnresolved:")
        for p in problems:
            print(f"  - {p}")
        sys.exit(1)
    print(f"\nOK — {len(plan)} workouts ready.")


def cmd_run(args) -> None:
    cfg = load_config()
    plan, problems = render(cfg)

    summary = Path(os.environ.get("GITHUB_STEP_SUMMARY", os.devnull))
    with summary.open("a") as fh:
        fh.write(f"# Hevy -> Garmin — {dt.date.today()}\n")
        fh.write(table(plan) + "\n")
        if problems:
            fh.write("\n## Unresolved\n" + "\n".join(f"- {p}" for p in problems) + "\n")

    if problems:
        for p in problems:
            print(f"::error::{p}")
        sys.exit("Refusing to upload with unresolved exercises.")

    if args.dry_run:
        print(table(plan))
        print(f"\n[dry-run] {len(plan)} workouts, nothing uploaded.")
        return

    client = connect()
    existing = {w["workoutName"]: w["workoutId"] for w in client.get_workouts(limit=200)}

    for title, blocks, spec in plan:
        if title in existing and args.replace:
            client.delete_workout(existing[title])
        res = client.upload_strength_workout(build(title, blocks))
        wid = res["workoutId"]
        print(f"uploaded  {title}  (id {wid})")
        if spec.get("day"):
            client.schedule_workout(wid, next_date(spec["day"]))
            print(f"scheduled {title} -> {next_date(spec['day'])}")

    # Persist any refreshed tokens so the next run doesn't need the secret.
    TOKENSTORE.mkdir(parents=True, exist_ok=True)
    client.client.dump(str(TOKENSTORE))


def main() -> None:
    p = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("auth").set_defaults(func=cmd_auth)
    sub.add_parser("list").set_defaults(func=cmd_list)
    sub.add_parser("plan").set_defaults(func=cmd_plan)
    r = sub.add_parser("run")
    r.add_argument("--dry-run", action="store_true")
    r.add_argument("--no-replace", dest="replace", action="store_false",
                   help="keep existing Garmin workouts with the same name")
    r.set_defaults(func=cmd_run)
    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
