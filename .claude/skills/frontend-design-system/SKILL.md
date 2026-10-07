---
name: frontend-design-system
description: Reuse a repo's existing UI components and design tokens instead of writing new styles. Use when the target repo already has a component library or design system (shared components, theme/tokens, Tailwind config, CSS variables, Storybook, shadcn/ui) and you are planning or building UI in it. Not for new apps with no design system — use frontend-design there.
---

# Frontend design system

The repo's own design system is the source of truth. Do not bring in a spacing scale, palette, or type scale from anywhere else.

## 1. Discover the design system

Before planning or writing UI, find out what exists. Delegate this to the `explorer` subagent when you are in the delivery workflow. Look for:

- **Tokens:** Tailwind config (`tailwind.config.*`, `@theme` in CSS), CSS variables (`:root`, `[data-theme]`), theme files (`theme.ts`, `tokens.*`, MUI/Chakra/Mantine theme), SCSS variables.
- **Components:** shared component folders (`components/ui`, `src/components`, `packages/ui`, a design-system package in the monorepo), their props and variants.
- **shadcn/ui:** `components.json` → which components are installed, aliases, icon library. Add a missing one with the shadcn CLI only if the plan says so.
- **Storybook:** stories show intended usage and variants. If the Storybook MCP server is available, use it to list components and props.
- **Icons, breakpoints, theming:** icon library in use, responsive breakpoints, dark mode / theme switching mechanism.
- **Usage examples:** two or three existing screens similar to the feature — copy their composition, not just their components.

## 2. Plan output (Phase 2)

Record in the plan's **Design** section:

| Need | Reuse | Path | Notes |
|---|---|---|---|
| Primary action | `Button` variant `primary` | `src/components/ui/button.tsx` | |
| Surface color | `--color-surface` / `bg-surface` | `src/styles/tokens.css` | |
| Date input | missing | — | create / ask (see step 4) |

List every token group used (color, spacing, radius, typography, shadow) and every component, so the approved plan is the build contract.

## 3. Rules when building

- Use the repo's tokens by name. No raw hex/rgb/hsl, no arbitrary px/rem, no Tailwind arbitrary values (`p-[13px]`, `text-[#333]`) where a token exists.
- Use existing components before raw HTML. Use their props and variants before adding `className`/`style` overrides; never restyle a shared component from the outside to make it look different.
- Do not edit shared components (adding variants, changing defaults) unless the plan lists it — other screens depend on them.
- Follow the repo's composition patterns (layout primitives, form wrappers, data table, page shell) as seen in existing screens.
- Interactive states (hover, focus-visible, disabled, loading, error) come from the components; do not reimplement them.
- Respect the repo's theming: if it supports dark mode, every new surface and text color must come from theme-aware tokens.
- Use the repo's icon library and breakpoints; do not add another.

## 4. When something is missing

- A component or token the feature needs does not exist → stop and ask the user, then update the plan. Options to offer: compose from existing primitives, add a variant to an existing component, or create a new component.
- If a new component is approved, build it in the same folder, file structure, naming, styling approach, and prop conventions as its neighbours, using existing tokens only.
- Never add a new UI library or styling approach.

## 5. Self-check before done

Run on the changed files only (adjust paths and extensions to the repo):

```bash
git diff --name-only <base>...HEAD -- '*.tsx' '*.ts' '*.jsx' '*.css' '*.scss' \
  | xargs grep -nE '#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|style=\{\{|\[[0-9.]+(px|rem)\]|-\[#'
```

Hits in token/theme definition files are expected. For every other hit: replace with a token or component prop, or keep it only if no token exists and note why. Also check that no new component duplicates one that already exists.
