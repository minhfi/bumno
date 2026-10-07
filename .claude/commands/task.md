---
description: Intake a Jira ticket, classify its lane, and run it through /fix or the /feature workflow
argument-hint: <JIRA-KEY>
---

Take this Jira ticket and deliver it:

$ARGUMENTS

`/task` is an intake step, not a separate workflow. Follow the **Guardrails** and **Jira tickets** rules in `CLAUDE.md`.

## 1. Fetch the ticket

- Read it via the Atlassian MCP: summary, description, acceptance criteria, attachments, linked Figma URLs, linked tickets.
- If the Atlassian MCP is not connected or not authorized, stop and tell the user. Do not guess the ticket's content.
- Jira is read-only: never comment, transition, or edit the ticket unless the user asks.

## 2. Resolve the target repo(s)

- Pick the repo(s) in `workspace/` from the ticket's component, labels, or description (use the `explorer` subagent if the code must be checked). A ticket may need the frontend repo, the backend repo, or both. Ask the user if it is unclear.
- A ticket that needs both repos is never Lane 0/1 — route it to the delivery workflow.

## 3. Acceptance criteria

- If the ticket has none, or they are vague, draft them from the description, mark each `[PROPOSED]`, and ask the user to confirm before going further.

## 4. Classify and route

State the lane and the reason in one line, then continue:

- **Lane 0/1** (no behavior change, or a local bug ≤ ~3 files in one repo with no new requirement and no schema / migration, API contract, or auth change) → follow `.claude/commands/fix.md` from step 2, with the ticket as the input.
- **Anything bigger** → run the delivery workflow in `CLAUDE.md` from Phase 1:
  - Use the ticket as the starting point of the Grill: invoke `grill-me`, but only ask about what the ticket leaves open.
  - A Figma link in the ticket is the UI source (see Design rules).
  - Fill the plan's **Ticket** field.

## 5. Use the key everywhere

- Branch: `fix/<KEY>-<slug>` or `feature/<KEY>-<slug>`.
- Plan file (bigger lanes): `docs/plans/YYYY-MM-DD-<KEY>-<slug>.md`.
- Commits: `<type>(<scope>): <KEY> <summary>`, e.g. `feat(orders): ABC-123 add status filter`.
- Report: start with the ticket key and summary.
