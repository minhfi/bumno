---
name: frontend-testing
description: Guides unit and integration tests for frontend using user-centric queries and stable assertions. Use when writing or fixing tests, specs, mocks, MSW, Vitest, Jest, React Testing Library, Cypress, Playwright, coverage, snapshots, or test-driven changes in the UI.
---

# Frontend testing

## Priorities

- Test behavior users care about, not implementation details (avoid brittle tests on internal state or private methods unless necessary).
- Prefer queries that reflect how users find elements: `getByRole`, `getByLabelText`, `getByText`; use `data-testid` only as a last resort.

## React Testing Library

- Use `userEvent` over `fireEvent` when available for realistic interaction.
- Wrap async updates in `await findBy*` or `waitFor` when the UI settles after actions.
- Clean up: unmount or rely on test isolation per project setup.

## Structure

- Arrange–act–assert; one main behavior per test when practical.
- Name tests after behavior (“submits form with valid data”) not after code structure.

## Coverage

- Cover happy path, important edge cases, and error/empty/loading states when they affect UX.
- Mock network at the boundary the project uses (MSW, fetch mock, adapter); keep mocks minimal and realistic.
