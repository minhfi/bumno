---
name: frontend-api-integration
description: Standardizes HTTP clients, error handling, and loading, empty, and error UI for API-driven features. Use when integrating or debugging REST, GraphQL, axios, fetch, interceptors, base URL, auth headers, tokens, React Query, SWR, pagination, retries, or backend contracts from the browser.
---

# Frontend API integration

## Client & boundaries

- Centralize HTTP configuration (base URL, timeouts, auth headers) in existing client or adapter modules; do not scatter raw `fetch` with duplicated options unless the project already does.

## Errors

- Map HTTP and network failures to user-visible messages where appropriate; avoid leaking raw stack traces or sensitive payloads in UI.
- Distinguish offline, timeout, 4xx, and 5xx when the product needs different handling.

## Security

- Never embed secrets in client code; tokens only via existing auth flows and storage patterns in the repo.
- Avoid reflecting untrusted server strings into `dangerouslySetInnerHTML` or unsanitized HTML.

## UI contract

- Expose explicit UI states: loading, success, empty, error; avoid indefinite spinners without timeout or retry policy if the app standard includes them.
- Type request and response shapes; validate or narrow at runtime when APIs are unstable.

## Caching

- Follow the project’s data layer (React Query, SWR, Redux, etc.): query keys, invalidation, and stale behavior should match existing conventions.
