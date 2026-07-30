# Claude instructions

## README updates

Keep `README.md` up to date whenever any of the following change:

- **Wizard steps** — if a step is added, removed, renamed, or its behaviour changes meaningfully (e.g. new persistence behaviour, new MFA flow, new skip logic)
- **Credential / session storage** — if what is stored in `localStorage`, what prefix is used (`hg:`), or the storage semantics change
- **Setup or run commands** — if `dev/setup.sh`, `dev/run.sh`, flags, or the default port change
- **Dev workflow** — if the backend or frontend start commands, test commands, or port numbers change
- **Why local-only rationale** — if the technical reason for running locally changes

Do **not** update the README for:
- Internal refactors that have no user-visible effect (e.g. renaming enums, moving files)
- Skeleton/milestone placeholders being filled in (update when the feature ships, not when the skeleton is added)
- Bug fixes that don't change documented behaviour
