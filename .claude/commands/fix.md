---
description: Quick Lane 0/1 fix (typo, copy, config, small local bug) without a plan file
argument-hint: <describe the fix or bug>
---

Fix this without the full delivery workflow:

$ARGUMENTS

Follow the **Guardrails** in `CLAUDE.md`. No plan file in `docs/plans/`.

## 1. Intake

- Resolve the target repo in `workspace/`; ask if unclear. All edits, commands, and git run inside it (`cd workspace/<repo> && ...`, not `git -C`).
- Read the repo's own docs (`CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`) and the code involved. Use the `explorer` subagent for broader lookups.
- If the expected behavior is unclear, draft acceptance criteria marked `[PROPOSED]` and ask the user to confirm before changing behavior.

## 2. Confirm lane

State the lane and the reason in one line:

- **Lane 0** — no behavior change (typo, copy text, comment, config value).
- **Lane 1** — wrong behavior with a local cause, ≤ ~3 files, no new requirement.
- Bigger (new requirement, many modules, design change, or any change to a DB schema / migration, an API contract, or auth / permissions) → stop and recommend `/feature`, saying why. If a fix grows past its lane mid-way, stop and tell the user before switching.

## 3. Prepare the repo

- The working tree must be clean — if it is not, stop and ask the user (never stash, commit, or discard their changes yourself).
- Create a branch `fix/<slug>` from the branch currently checked out (do not switch to `main`/`master`).
- Record the baseline — run `test-runner` once and note pre-existing failures:
  - **Lane 0:** lint, typecheck, and build.
  - **Lane 1:** lint, typecheck, unit / integration, and build; backend repo also API / integration.

## 4. Fix

**Lane 0:** make the edit, then run `test-runner` with lint, typecheck, and build — no new failures compared to the baseline.

**Lane 1:**
1. Use `diagnosing-bugs`: reproduce the bug and find the root cause, not the symptom.
2. Write a regression test that fails because of the bug (frontend: `vitest` + `frontend-testing`, or the repo's runner; backend: the repo's runner, an API / integration test against a local / test DB when the bug is in an endpoint). If it truly cannot be automated, write `[manual]` reproduction and verification steps instead.
3. Make the minimal fix. Do not refactor unrelated code; follow `docs/standards.md` and the repo's own standards.
4. Verify with `test-runner` (lint, typecheck, unit / integration, build): the new test passes and there are no new failures compared to the baseline. For a UI bug, also check it in the running app with `agent-browser`; for a backend bug, also run the repo's API / integration tests.

## 5. Commit and report

- Commit on the fix branch with `git-commit` (e.g. `fix(cart): handle empty items`). Do not push or open a PR unless the user asks.
- Report in chat: lane, root cause (Lane 1), branch, files changed, test evidence per layer, baseline failures (if any), and `[manual]` steps still pending.
