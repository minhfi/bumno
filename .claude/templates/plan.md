# <Feature name>

- **Status:** Draft | Approved | In progress | Done
- **Date:** YYYY-MM-DD
- **Ticket:** `<JIRA-KEY>` — <summary> (or "none")
- **Stack (new app only):** FE: … / BE: …

### Repos

_One row per repo. Base branch = the branch checked out in that repo when Phase 3 starts. Same feature branch name in every repo. Multi-repo order: backend first, then frontend._

| Repo | Role | Existing / new | Base branch | Feature branch |
|---|---|---|---|---|
| `workspace/<repo>` | FE / BE | existing / new app | `<base>` | `feature/<slug>` |

## Goal

What problem this solves and for whom.

## Scope

**In scope**
-

**Out of scope**
-

## Decisions (from grilling)

| Question | Decision |
|---|---|
| | |

## Design

- **UI source:** None | Figma (<link>) | Existing components
- **Design skill:** `frontend-design` (none) | Figma MCP (Figma) | `frontend-design-system` (existing components)
- **Audit:** `web-design-guidelines` (Figma / existing components)
- **Direction / notes:**

_Filled in Phase 2 — this is what gets approved. For no UI source:_

- **Palette:** name — `#hex` (light) / `#hex` (dark), 4–6 colors
- **Type:** typeface(s) and role of each
- **Layout:**

  ```
  ASCII wireframe
  ```

- **Principles:** the one memorable element; what stays quiet

## Backend

_Remove if the feature has no backend work. Filled in Phase 2 — this contract is what gets approved and what both repos build to._

### Endpoints

| Method | Path | Auth / permission | Request | Response | Errors |
|---|---|---|---|---|---|
| | | | | | `400` …, `401`, `403`, `404` |

### Data model & migrations

- Schema changes (tables / columns / indexes):
- Migration(s) and rollback:
- Effect on existing data:

### Jobs / events

-

### Config / env

- New keys (added to the repo's example config, no real values):

### Backward compatibility

- Existing clients affected:

## Data & API (frontend)

How the frontend consumes the API: types, client / adapter, state management, error handling.

## UI states

- Loading:
- Empty:
- Error:
- Success:

## Files

| Repo | File | Change |
|---|---|---|
| | | create / modify |

## Tasks

_Include writing the tests from the Test plan (unit / integration, backend API / integration, Playwright scripts) — Phase 4 only runs them._
_Group by repo; backend tasks first when both repos change._
_Mark tasks that can't be tested automatically `[manual]` and list their steps: preconditions, steps, expected result._

**Backend — `workspace/<repo>`**
- [ ] 1.

**Frontend — `workspace/<repo>`**
- [ ] 1.

## Acceptance criteria

- [ ]

## Test plan

| Repo | Layer | Skill / tool | Cases |
|---|---|---|---|
| FE | Unit / integration | `vitest` | |
| FE | UI flow | `agent-browser` / `webapp-testing` | |
| FE | UI audit | `web-design-guidelines` | |
| BE | Unit | repo test runner | |
| BE | API / integration | repo test runner + local / test DB | |
| BE | Migration | repo migration tool (up / down / up) | |
| FE + BE | Contract | schema diff / contract tests / request per endpoint | |
| FE + BE | Full-stack E2E | `agent-browser` / `webapp-testing`, both apps running | |
| each | Lint / typecheck / build | repo scripts | |

## Risks & open questions

-

## Test results

### Baseline

_Filled in Phase 3 before any change, per repo: failures in lint / typecheck / unit / integration that already exist on the base branch (or "none")._

### Phase 4

_Filled in after Phase 4, per repo. Pass = no new failures compared to the baseline._

## Review

_Filled in after Phase 5, per repo: findings per axis (Standards / Spec) and how each was handled._
