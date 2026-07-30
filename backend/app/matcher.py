"""Fuzzy-map free-text exercise names (e.g. Hevy) onto Garmin's exercise catalog."""
import re, unicodedata
from garminconnect import exercises as gex

SYN = {
    "db": "dumbbell", "bb": "barbell", "kb": "kettlebell", "ez": "barbell",
    "bicep": "biceps", "tricep": "triceps", "abs": "abdominal",
    "pulldown": "pull down", "pushdown": "press down", "pressdown": "press down",
    "pushup": "push up", "pullup": "pull up", "chinup": "chin up", "situp": "sit up",
    "skullcrusher": "lying triceps extension", "skullcrushers": "lying triceps extension",
    "rdl": "romanian deadlift", "ohp": "overhead press", "flye": "fly", "flyes": "fly",
    "flys": "fly", "raises": "raise", "curls": "curl", "rows": "row", "presses": "press",
    "extensions": "extension", "squats": "squat", "lunges": "lunge", "crunches": "crunch",
}
# equipment / setup words: nice to match, but never disqualifying
EQUIP = {"barbell", "dumbbell", "cable", "machine", "smith", "bodyweight", "band",
         "plate", "bar", "grip", "rope", "handle", "vbar", "straight", "wide", "close",
         "neutral", "underhand", "overhand", "pronated", "supinated", "seated", "standing",
         "lying", "bench", "floor", "hanging", "captains", "chair", "assisted", "weighted"}
STOP = {"the", "a", "and", "with", "on", "in", "of", "to", "or", "per", "each", "side"}

def _norm(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = s.lower().replace("-", " ")
    s = re.sub(r"[()\[\]/,\.:+&]", " ", s)
    out = []
    for t in s.split():
        out.extend(SYN.get(t, t).split())
    return [t for t in out if t not in STOP]

def _split(tokens):
    ts = set(tokens)
    return ts - EQUIP, ts & EQUIP     # (core, equip)

_CAND = [(e, *_split(_norm(e["name"]))) for e in gex.EXERCISES]

def _dice(a, b):
    return 2 * len(a & b) / (len(a) + len(b)) if (a or b) else 0.0

def _score(qc, qe, cc, ce):
    core = _dice(qc, cc)
    equip = _dice(qe, ce)
    extra_core = len(cc - qc)          # candidate is MORE specific than asked
    miss_core = len(qc - cc)           # candidate is MISSING something asked for
    exact = 0.30 if (qc == cc and qc) else 0.0
    brevity = -0.02 * len(cc | ce)     # break ties toward the plainest variant
    return core + equip * 0.25 + exact + brevity - 0.22 * extra_core - 0.18 * miss_core

def match(name, top=3):
    """Return the top Garmin catalog entries for a free-text exercise name."""
    qc, qe = _split(_norm(name))
    ranked = sorted(
        ((_score(qc, qe, cc, ce), e) for e, cc, ce in _CAND), key=lambda x: -x[0]
    )
    return [{"score": round(s, 3), **e} for s, e in ranked[:top]]
