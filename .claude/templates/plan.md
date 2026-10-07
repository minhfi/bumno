# <Feature name>

- **Status:** Draft | Approved | In progress | Done
- **Date:** YYYY-MM-DD
- **Ticket:** `<JIRA-KEY>` — <summary> (or "none")
- **Target repo:** `workspace/<repo>` (existing | new app)
- **Stack (new app only):**
- **Base branch:** `<branch checked out in the repo when Phase 3 starts>`
- **Feature branch:** `feature/<slug>`

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

## Data & API

Endpoints, request/response types, state management, error handling.

## UI states

- Loading:
- Empty:
- Error:
- Success:

## Files

| File | Change |
|---|---|
| | create / modify |

## Tasks

_Include writing the tests from the Test plan (unit / integration, Playwright scripts) — Phase 4 only runs them._
_Mark tasks that can't be tested automatically `[manual]` and list their steps: preconditions, steps, expected result._

- [ ] 1.
- [ ] 2.

## Acceptance criteria

- [ ]

## Test plan

| Layer | Skill / tool | Cases |
|---|---|---|
| Unit / integration | `vitest` | |
| UI flow | `agent-browser` / `webapp-testing` | |
| UI audit | `web-design-guidelines` | |
| Lint / typecheck / build | repo scripts | |

## Risks & open questions

-

## Test results

### Baseline

_Filled in Phase 3 before any change: failures in lint / typecheck / unit that already exist on the base branch (or "none")._

### Phase 4

_Filled in after Phase 4. Pass = no new failures compared to the baseline._

## Review

_Filled in after Phase 5: findings per axis (Standards / Spec) and how each was handled._
