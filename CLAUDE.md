# Simple Delivery Template

An AI delivery workflow: **Grill → Plan → Approve → Implement → Test → Review → Report**.

- Code repos live in `workspace/<repo>/` (each keeps its own git history; ignored by this template's git).
  - Frontend and backend are separate repos. A feature may touch one or both (see **Multi-repo features**).
  - Run git for a repo from inside it (`cd workspace/<repo> && git status`), not with `git -C` — the pre-allowed commands in `.claude/settings.json` only match `git <subcommand> ...`.
- Plans live in `docs/plans/YYYY-MM-DD-<slug>.md` (this template's root, not inside the code repo).
- Plan template: `.claude/templates/plan.md`.
- Coding standards for every target repo: `docs/standards.md` (the repo's own documented standards take precedence).
- Setup for a new machine: see `README.md`.

## Precedence

This file and `docs/standards.md` override the user's global `~/.claude/CLAUDE.md` wherever they overlap or conflict. In particular:
- **Approval:** follow this file's approval gate. An approved plan covers every file and change it lists — do not ask again per file or per new code, even though the global rules say to.
  - `/fix` has no plan: invoking it (directly or routed from `/task`) approves every change within its lane, including the regression test. Ask again only when the fix grows past its lane.
- **Coding standards:** use `docs/standards.md` (or the target repo's own documented standards, which take precedence over it), not the global Frontend rules.

## When this workflow applies

Run the workflow below whenever the user describes a feature, an app, or a change they want built — or invokes `/feature`.
Skip it for questions and explanations.

| Command | Use for |
|---|---|
| `/fix <description>` | Lane 0 (typo, copy, config — no behavior change) and Lane 1 (local bug, ≤ ~3 files, no new requirement). No plan file (`.claude/commands/fix.md`). |
| `/feature <description>` | Anything bigger — this workflow. |
| `/task <JIRA-KEY>` | Intake a Jira ticket, classify its lane, then route it to `/fix` or this workflow (`.claude/commands/task.md`). |

### Jira tickets

When work comes from a Jira ticket, use its key everywhere:
- Branch: `fix/<KEY>-<slug>` or `feature/<KEY>-<slug>`.
- Plan file: `docs/plans/YYYY-MM-DD-<KEY>-<slug>.md`, with the plan's **Ticket** field filled.
- Commits: `<type>(<scope>): <KEY> <summary>`.
- Jira is read-only: never comment, transition, or edit a ticket unless the user asks.

## Resuming work

At the start of a session, if a plan in `docs/plans/` has `Status: Approved` or `In progress`, ask the user whether to continue it.
When continuing, read the plan, then resume from the first unticked task.

## Phase 1 — Grill (requirements)

- Invoke the `grill-me` skill and interview the user until the design tree is empty.
- Before asking, look up facts yourself: target repo(s) in `workspace/`, stack, existing components, design system, API routes, data model, test setup.
  - Delegate lookups to the `explorer` subagent; spawn several in parallel when the questions cover separate areas (e.g. one per repo). Keep asking questions that don't depend on a running lookup.
- Must settle at minimum: goal & users, scope / non-scope, target repo(s) (existing or new app; frontend, backend, or both), UI source (see Design rules), data & API contracts, states (loading / empty / error / success), edge cases, acceptance criteria, how it will be tested.
  - Acceptance criteria: never invent them silently (see Guardrails).
- **Backend work:** also settle the API contract (method, path, auth, request, response, error codes), data model and migrations, authorization rules, validation, background jobs / events (if any), new config / env, and backward compatibility for existing clients.
- **New app:** also settle the stack and the app name.
  - Frontend: framework, styling, package manager, test runner.
  - Backend: language, framework, database, ORM / migration tool, test runner.
- Do not write code in this phase.

## Phase 2 — Plan

- Write the plan to `docs/plans/YYYY-MM-DD-<slug>.md` using `.claude/templates/plan.md`.
- **Design pass (when the feature has UI):** do it now, not in Phase 3, so design decisions are part of what the user approves. Follow the Design rules table below:
  - No UI source → run `frontend-design`'s planning pass and record palette (hex), typefaces and their roles, layout (ASCII wireframe), and principles in the plan's **Design** section.
  - Figma → read it via Figma MCP and record frame links, tokens, and components to build.
  - Existing components → list the components and tokens to reuse.
- **Backend pass (when the feature has backend work):** also do it now. Record in the plan's **Backend** section: every endpoint (method, path, auth, request, response, errors), schema changes and their migrations (with rollback), jobs / events, and new config / env. This contract is what both repos build to.
- Summarize it in chat and **STOP**. Ask: "Approve this plan?"
- **Approval gate:** never write implementation code (no scaffolding, no edits in `workspace/`) while the plan is `Draft`.
  - Change requests are not approval. When the user asks for plan changes, update only the plan file, show what changed, and ask "Approve this plan?" again. Repeat as many rounds as needed.
  - Only an explicit approval (e.g. "approve", "ok", "go") opens the gate.
  - "Approve + a change" in the same message (e.g. "approve, but change X") also opens the gate: apply the change to the plan, briefly show what changed, then start Phase 3 without asking again.
- Once approved, set the plan's `Status` to `Approved` and start Phase 3.
  - Before starting, suggest the user `/clear` (or open a new session, optionally switching to Sonnet) and resume from the plan — the grilling history is no longer needed and resending it every turn is costly. Continue in this session only if they decline.
- An approved plan counts as approval for every file and change it lists — do not ask again per file. Only ask again for changes outside the plan (and update the plan first).

## Phase 3 — Implement

1. **Prepare the repo** (each repo in the plan)
   - Existing repo: make sure the working tree is clean — if it is not, stop and ask the user (never stash, commit, or discard their changes yourself). Then create a branch `feature/<slug>` from the branch currently checked out (that is the base branch — do not switch to `main`/`master`). Record it in the plan.
   - New app: scaffold it into `workspace/<app>` with the stack's official generator, `git init`, make an initial commit on `main`, then branch `feature/<slug>`.
   - Existing repo: record the **baseline** — run `test-runner` once with lint, typecheck, unit / integration, and build (backend repo: also API / integration) and write any failures to the plan's **Test results → Baseline** (see Guardrails).
2. Set the plan's `Status` to `In progress`.
3. Implement only what the approved plan covers. Follow the repo's existing architecture, patterns, and naming (and `docs/standards.md`); read relevant code first.
   - Write the tests from the plan's **Test plan** here too (unit / integration, backend API / integration tests, and scripted E2E — in the repo's own Playwright setup if it has one, otherwise Python Playwright scripts via `webapp-testing`), as tasks in the plan. Phase 4 only runs them — `test-runner` never writes tests.
4. If something in the plan turns out wrong or blocked, stop and ask — update the plan before deviating. This includes design: build to the approved **Design** section; changing palette, type, or layout is a deviation. Likewise for the backend: changing an endpoint, a response shape, or the schema is a deviation.
5. Tick off tasks in the plan as they are done.

### Multi-repo features

When a plan covers both a frontend and a backend repo:
- One plan for both, listing each repo with its own base branch in the plan's **Repos** table. Use the same `feature/<slug>` branch name in both.
- Build the backend first, then the frontend. The plan's **Backend** contract is the single source of truth; the frontend's API types and client follow it.
- If the contract must change mid-way, stop, update the plan, and get approval before changing either repo.
- Baseline, tests, commits, and review run per repo.

### Backend rules

- Follow the backend repo's own stack, layering, and conventions (and `docs/standards.md` → **Backend**).
- Change the schema only through the repo's migration tool; every migration has a rollback (or a note on why it cannot).
- Never run migrations, seeds, or destructive commands against any database other than a local / test one.

### Design rules (pick by UI source)

| UI source | Skill(s) |
|---|---|
| No UI design, no Figma, no existing components | `frontend-design` — direction planned in Phase 2, built here |
| Figma link provided | Read the design via Figma MCP (`get_design_context`, `get_screenshot`), implement it, then audit with `web-design-guidelines` |
| Existing components / design system in the repo | Reuse them (`frontend-design-system`), then audit with `web-design-guidelines` |

Supporting skills when relevant: `frontend-react-typescript`, `frontend-api-integration`, `frontend-accessibility`, `vercel-react-best-practices`, `vercel-composition-patterns`, `next-best-practices`.

## Phase 4 — Test

Run every layer that applies; record results in the plan's **Test results** section.

| Layer | Skill / tool |
|---|---|
| Unit / integration | `vitest` + `frontend-testing` (or the repo's existing runner) |
| UI flow / E2E (interactive) | `agent-browser` — navigate, click, fill, screenshot the real app |
| UI flow / E2E (scripted, repeatable) | The repo's own Playwright setup if it has one; otherwise `webapp-testing` — Python Playwright scripts |
| Next.js runtime check | `next-dev-loop` — only for Next.js 16.3+ with Turbopack; on older versions skip it (record `skipped (Next < 16.3)`) and rely on the `agent-browser` E2E layer. Do not upgrade Next.js unless the plan says so. |
| UI quality audit | `web-design-guidelines` on changed UI files |
| Backend API / integration | The backend repo's test runner, against a real local / test database (the repo's own test DB setup or service config) |
| Migration | Apply all migrations on a clean local / test database, then roll back the new ones and re-apply |
| Contract (FE ↔ BE) | Frontend API types / client match the backend's actual responses for every endpoint in the plan (generated schema diff, contract tests, or a request per endpoint against the running backend) |
| Full-stack E2E | `agent-browser` / `webapp-testing` with the backend and frontend both running locally |

- Also run each repo's lint, typecheck, and build.
- If a backend layer needs a service the repo can't start locally (e.g. no test DB setup), report it as `skipped (reason)` and turn it into a `[manual]` task — do not point tests at a shared or remote database.

**Run layers in subagents** so long command output stays out of the main context:

| Group | Subagent | Layers | When |
|---|---|---|---|
| A | `test-runner` (one per repo) | lint, typecheck, unit / integration; backend repo also API / integration and migration | in parallel with B and C |
| B | `test-runner` | UI flow / E2E (incl. `next-dev-loop` for Next.js 16.3+); full-stack E2E and contract when both repos changed | in parallel with A and C — except when B runs the backend (full-stack E2E / contract): then after the backend repo's A finishes |
| C | general-purpose (`sonnet`) | `web-design-guidelines` on changed UI files | in parallel with A and B |
| D | `test-runner` (one per repo) | build | after B finishes (`next build` and `next dev` share `.next/`) |

- Give each subagent the repo path(s), its layers, and (for B and C) the acceptance criteria and changed files from the plan. For B with both repos, also pass the **Backend** contract and how to start each app.
- The backend's API / integration tests and migration check (A) reset and roll back the local / test database, so they must not run while B uses the running backend on that database.
- Backend-only feature: skip B's UI layers and C; run the contract check against the plan's **Backend** section.
- Only the main session writes the plan's **Test results** section.
- **agent-browser tips:** set a named session (`export AGENT_BROWSER_SESSION=<slug>-e2e`) and close it when done. `find ... --name` matches substrings case-insensitively (e.g. `"Completed"` also hits "Clear completed") — always add `--exact`. Its browser may default to dark mode; set the color scheme explicitly when screenshotting each theme.
- **If a test fails:** fix it in the main session with `diagnosing-bugs` (build a failing feedback loop first, then fix), re-run the affected groups and then D, and report honestly. Never mark the phase done with new failures compared to the baseline (see Guardrails).

## Phase 5 — Review

- Commit the work on the feature branch with `git-commit` (only after Phase 4 passes), in each repo.
- Run the `code-review` skill inside each target repo:
  - **Fixed point:** that repo's base branch recorded in the plan.
  - **Spec:** the plan file in `docs/plans/` (pass its absolute path).
  - **Standards:** this template's `docs/standards.md` plus the target repo's own docs (e.g. `CONTRIBUTING.md`).
- Show findings to the user. Fix the ones they accept, re-run only the Phase 4 groups the fixes affect (then D, the build), and commit again.

## Phase 6 — Report

Summarize in chat: what was built, branch name per repo, files changed per repo, migrations added, test results (pass/fail per layer), review findings and how they were handled, and any follow-ups. Set the plan's `Status` to `Done`.
Do not push or open a PR unless the user asks.

## Guardrails

Apply to both `/feature` and `/fix`.

- **Baseline failures:** checks that already fail before any change are the baseline (plan's **Test results → Baseline**, or the `/fix` report). They are not regressions and are not fixed unless the plan or fix covers them. A check passes when it introduces **no new** failures compared to the baseline.
- **Stuck:** if the same task or check still fails after **2** fix attempts, stop. Write a short blocker note (what was tried, the error output, hypotheses) and ask the user. Do not try a third variation.
- **Tests stay honest:** never skip (`.skip` / `.only`), weaken, or delete tests to get green.
- **Missing acceptance criteria:** do not invent them silently. Draft them from what is known, mark each `[PROPOSED]`, and ask the user to confirm before planning (`/feature`) or changing behavior (`/fix`).
- **Can't be tested automatically:** mark the task `[manual]` in the plan with concrete steps (preconditions, steps, expected result). If you can perform it yourself (e.g. with `agent-browser`), do it and record the result. If it needs something you lack (a real device, a third-party account), hand the steps to the user and leave the task unticked until they confirm.
