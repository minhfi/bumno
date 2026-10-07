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
