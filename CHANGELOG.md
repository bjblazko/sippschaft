# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Localisation support: English and German, switchable via language selector in the ellipsis menu (ADR-010)
- Language preference persisted in `localStorage`, applied on all pages including static export
- Ellipsis menu (⋮) in the header containing export and language controls
- Static site export: `GET /export` returns a ZIP archive containing the complete family tree as a self-contained static site (ADR-009)
- Tree page in export uses inline JSON data instead of API fetch, enabling `file://` usage without a server

### Fixed

- Person profile relationship links now show display names instead of raw folder IDs

## [0.2.0] - 2026-02-13

### Added

- Theme system with eight variants: Classic, Modern, Neon, and Home Computer -- each with Light/Dark mode (ADR-008)
- Theme selector in the header (style + mode dropdowns) on all pages
- OS dark/light mode auto-detection via `prefers-color-scheme` with "Auto" option
- Theme preference persisted in `localStorage` across sessions and pages
- Neon theme (Blade Runner / cyberpunk aesthetic) with monospace font, glowing borders, pulsing header, text-shadow effects, scanline overlay, and neon-colored SVG glow filters on tree nodes and connection lines
- Home Computer theme (1980s home computer aesthetic): light mode inspired by Amiga Workbench (blue/orange/gray with rainbow stripes), dark mode inspired by C64 (purple/blue with light blue text); both with beveled 3D buttons, hard pixel shadows, and zero border-radius
- Drop shadows on SVG tree nodes (classic view rectangles, force view circles) via SVG `feDropShadow` filter
- Drop shadow on header bar and profile cards via CSS `box-shadow` custom properties
- Configurable data directory via `--data` flag or `DATA` environment variable (defaults to `./data`)
- Automatic data directory polling every 2 seconds for hot reload without restart
- Screenshots in README (tree view, node view, person profile)
- 16 additional avatar photos for family members
- Name history support: `names` list in YAML for tracking birth names, married names, and other name changes over time with optional type and date
- Nickname support: `nicknames` list in YAML, displayed separately on the profile page
- `CHANGELOG.md` following Keep a Changelog format

### Changed

- Replaced Dagre graph layout with custom genealogy-aware layout algorithm in `tree.js` (ADR-007)
- Spouse connection lines now attach at the side-center of person boxes instead of the bottom edge
- Multi-spouse families (e.g. Robert Smith with Linda Johnson and Susan Davis) use a couple-chain layout with all children placed as one group below, preventing visual overlaps
- Renamed Go module from `genealogy-app` to `sippschaft`
- Renamed UI title and heading from "Family Tree App" to "Sippschaft"
- Renamed view buttons from "Force View" / "Classic View" to "Node View" / "Tree View"
- SVG tree colors (gender fills, strokes, line colors, text) now read from CSS custom properties for theme support
- Person profile pages strip the leading `<h1>` from rendered markdown to avoid duplicating the name shown from YAML metadata

### Removed

- Dagre CDN dependency (`cdnjs.cloudflare.com/dagre`) from `index.html`

## [0.1.0] - 2026-02-12

### Added

- Go web server using only the standard library `net/http` (ADR-001)
- Folder-per-person data structure under `data/` with `person.yaml`, `person.md`, and `avatar.*` per person (ADR-006)
- YAML metadata for structured fields (name, sex, birth, death, parents, spouses, children) parsed with `gopkg.in/yaml.v3`
- Markdown biographies rendered with Goldmark (ADR-004)
- Interactive family tree visualization on the homepage using D3.js v7 (ADR-003)
  - Classic view: hierarchical tree layout with parent-child and spouse connections
  - Force view: physics-based force-directed graph with draggable nodes
  - Zoom and pan support in both views
- Person profile pages at `/person/{id}` showing photo, dates, biography, and relationship links
- JSON API at `GET /api/tree` serving all people for the frontend
- Sample family tree with 22 people across 4 generations (Smith, Jones, Doe, Brown, Johnson, Davis, Taylor, Osei, Wei families)
- 6 AI-generated avatar photos
- Full arc42 architecture documentation (`doc/architecture.md`)
- Feature list and roadmap (`doc/features.md`)
- User personas (`doc/personas.md`)
- Project vision and principles (`doc/vision.md`)
- Architecture Decision Records (ADR-001 through ADR-006)
- Live-reload development setup with `air`
- `.gitignore` for Go binaries, `air` temp files, OS files, and IDE configs
