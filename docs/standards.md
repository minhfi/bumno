# Coding Standards

Applies to every repo in `workspace/`. A repo's own documented standards (e.g. `CONTRIBUTING.md`) take precedence where they conflict.
Used by Phase 3 (Implement) and by the Standards axis of `code-review` in Phase 5.

## General

- Read relevant existing code before making changes.
- Follow existing architecture, patterns, and naming.
- Do not modify unrelated code; keep diffs minimal and focused.
- Keep solutions simple, explicit, and maintainable.
- Avoid unnecessary abstractions and new dependencies.
- No debug logs left in code.
- Code compiles and passes lint, typecheck, and build.

## Frontend

Scope: React, TypeScript, JavaScript, HTML/CSS, API integration.

### TypeScript

- Strict typing; avoid `any` unless unavoidable (justify briefly).
- Define clear types for props, API responses, and shared models.
- Prefer type narrowing/guards over assertions.
- Do not silence errors with unsafe casts.

### React

- Functional components and hooks.
- Keep components focused; extract reusable logic.
- Avoid unnecessary re-renders (optimize only when needed).
- Handle UI states explicitly: loading, error, empty, success.
- Always clean up effects/subscriptions.

### State & Data

- Follow the repo's existing state management (React Query, Redux, etc.); do not introduce new patterns without agreement.
- Centralize API calls via existing clients/adapters.
- Validate and handle API errors, timeouts, and edge cases.

### Styling & UX

- Follow the existing design system and conventions.
- Keep responsive behavior intact.
- No magic values where tokens/variables exist.
- Accessibility basics: semantic HTML, labels, keyboard support, visible focus.

### Security & Performance

- No unsafe HTML rendering (XSS).
- No sensitive data in client code.
- Follow existing auth/token handling strictly.
- Avoid heavy dependencies; mind bundle size and render performance.

### Testing

- Test user-visible behavior with user-centric queries (role, label, text).
- Cover normal and edge cases; add a regression test for every bug fixed.

## Backend

Scope: any backend stack (API services, workers, databases). Rules are stack-agnostic; use the repo's own framework idioms to apply them.

### API design

- Follow the repo's existing style (REST / RPC / GraphQL), URL and field naming, and versioning.
- Correct status codes; one consistent error format across endpoints (use the repo's existing one).
- Paginate list endpoints; never return unbounded collections.
- Keep changes backward compatible for existing clients; breaking changes need a new version or an agreed migration path.
- The API contract in the plan is the source of truth; code and docs (OpenAPI / schema files, if the repo has them) match it.

### Validation & errors

- Validate and normalize all input at the boundary (body, query, params, headers); never trust the client.
- Return clear, client-safe error messages; never leak stack traces, SQL, or internal details.
- Handle expected failures explicitly (not found, conflict, forbidden); do not swallow errors.

### Data

- Schema changes only through the repo's migration tool; migrations are reversible (or document why not) and safe on existing data.
- Use transactions for multi-step writes that must succeed or fail together.
- Avoid N+1 queries; add indexes for new query patterns.
- Keep business logic out of controllers / handlers; follow the repo's layering (e.g. service / repository).

### Security

- Enforce authentication and authorization on every endpoint, checked server-side, including ownership of the resource.
- Parameterized queries or the ORM only; never build SQL or commands by string concatenation.
- Secrets only in env / config, never in code or commits; add new keys to the repo's example config without real values.
- Never log secrets, tokens, passwords, or personal data.

### Reliability & performance

- Timeouts on every outbound call (HTTP, DB, queues); retry only idempotent operations.
- Make write endpoints and jobs that may be retried idempotent.
- Structured logs at meaningful points (with request / correlation ID if the repo has one); no noisy debug logs.

### Testing

- Integration test for every new or changed endpoint: success, validation error, unauthorized / forbidden, not found, and relevant edge cases.
- Tests run against a local / test database, never a shared or remote one; each test sets up and cleans up its own data.
- Unit test non-trivial business logic; add a regression test for every bug fixed.
