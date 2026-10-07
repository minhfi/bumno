---
name: frontend-accessibility
description: Enforces accessible markup, keyboard navigation, focus management, ARIA usage, and screen-reader-friendly UI. Use when building or reviewing forms, modals, dialogs, menus, tables, links, buttons, landmarks, or when the user mentions a11y, WCAG, inclusive design, or keyboard-only use.
---

# Frontend accessibility

## Structure

- Use semantic HTML first (`button` for actions, `a` for navigation, headings in order, `main` / `nav` / `header` / `footer` where appropriate).
- Associate every form control with a visible or visually hidden label (`htmlFor` / `id`, or `aria-label` only when a visible label is impossible).

## Keyboard & focus

- Interactive custom controls must be focusable and operable with keyboard (Enter/Space as appropriate, Escape to dismiss overlays).
- Preserve visible focus styles; do not remove outline without an equivalent focus ring.
- Trap focus inside modal dialogs and restore focus to the trigger on close when patterns exist in the codebase.

## Dynamic UI

- Use `aria-expanded`, `aria-controls`, `aria-live` (polite/assertive) for announcements when behavior matches ARIA patterns.
- Decorative images: empty `alt`; informative images: meaningful `alt` text.

## Verification

- Quick checks: Tab through the flow, use screen reader labels in devtools, and ensure color is not the only cue for state or errors.
