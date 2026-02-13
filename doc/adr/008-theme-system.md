# ADR-008: CSS Custom Property Theme System

**Status:** Accepted

## Context

The app had a single hardcoded light visual style. Users want to choose between different visual styles and support dark mode, including automatic OS-level dark/light detection.

## Decision

Implement a theme system using CSS custom properties (`--var`) and `data-*` attributes on the `<html>` element. Two independent axes:

- **Style** (`data-theme-style`): `classic`, `modern`, `neon`, or `home-computer` -- controls font, accent colors, border radius, and overall visual feel.
- **Mode** (`data-theme-mode`): `light` or `dark` -- controls background, text, and contrast colors. An "auto" setting resolves to light/dark based on the OS `prefers-color-scheme` media query.

Theme state is stored in `localStorage` and applied immediately on page load (before body renders) via a `<script>` in `<head>` to prevent flash of unstyled content.

SVG tree colors (gender fills, strokes, connection lines, text) are read from CSS custom properties at render time via `getComputedStyle`, so they respond to theme changes. A `themechange` custom event triggers tree re-rendering.

## Consequences

- Zero additional dependencies -- pure CSS and vanilla JS.
- Eight theme variants (classic, modern, neon, home-computer -- each with light/dark) from a single stylesheet.
- Adding new themes only requires a new CSS variable block with a `[data-theme-style="x"][data-theme-mode="y"]` selector.
- Themes can include style-specific CSS rules (e.g. `[data-theme-style="neon"]`) for animations, glow effects, and other enhancements beyond variable overrides.
- The `theme.js` script must be loaded in `<head>` on every page that needs theming.
- SVG colors are read from computed styles rather than hardcoded, adding a `getComputedStyle` call per color lookup.
