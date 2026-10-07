---
name: frontend-react-typescript
description: Applies React functional components, hooks, and strict TypeScript patterns for frontend code. Use when writing or refactoring React, TSX, JSX, hooks (useEffect, useState, useMemo, useCallback), custom hooks, props typing, context, component structure, or TypeScript types in the UI layer.
---

# Frontend React + TypeScript

## Components

- Prefer functional components; extract reusable logic into hooks or small modules.
- Keep components focused; split when JSX, state, or effects grow hard to follow.
- Type props with explicit interfaces or `type` aliases; avoid `any` unless unavoidable (justify briefly in code or reply).

## Hooks

- List dependencies correctly in `useEffect`, `useMemo`, `useCallback`; clean up subscriptions, timers, and listeners.
- Avoid stale closures: prefer functional updates or stable refs when appropriate.
- Do not call hooks conditionally or inside loops.

## State & data flow

- Prefer local state by default; lift state only when multiple children need it.
- Follow the project’s existing state solution (Context, Redux, React Query, etc.); do not introduce new global patterns without request.

## Types

- Model API responses and domain objects with clear types; use narrowing and guards instead of unsafe casts.
- Prefer `unknown` over `any` at boundaries; validate or parse external data when shape is uncertain.
