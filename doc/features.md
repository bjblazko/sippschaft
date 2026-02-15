# Features

## Current Features

### Interactive Family Tree (Homepage)

Two visualization modes on the main page:

- **Classic View** -- Hierarchical tree layout using a seven-phase Sugiyama-style layered graph algorithm (see [ADR-011](adr/011-sugiyama-layout.md) for full details). A BFS traversal through all relationship types (parents, children, spouses, co-parents) assigns generations, ensuring all couples and in-law families are on the same row. Partner groups are collected transitively (A-B-C chains treated as one atomic unit). The layout handles multi-family trees by building a spanning tree via BFS, computing block widths bottom-up, and assigning positions top-down. Satellite families (in-law ancestors) are placed to the right of the main tree to prevent overlaps. Crossing minimization uses weighted barycenter heuristic with alternating top-down/bottom-up passes, adjacent swap optimization with sibling proximity tiebreaker, and Hamiltonian path ordering for multi-partner blocks (hub person placed in the middle). Family connection lines are color-coded so each parent pair has a unique color (golden-angle HSL spacing), with staggered bar heights when multiple families connect between the same generations. Nodes show name, gender symbol, birth/death years, and optional photo.
- **Force View** -- Physics-based D3 force simulation. Nodes can be dragged freely. Parent-child links are solid lines; spouse links are dashed red lines.

Both views support zoom and pan via mouse/trackpad. **Ancestor highlight:** double-click a person (or long-press on mobile) to highlight their direct ancestors (parents, grandparents, etc.) while greying out everyone else. A floating action bar appears at the bottom with a "Focus bloodline" button. Press Escape or double-click empty space to clear. **Bloodline focus mode:** clicking "Focus bloodline" re-renders the tree with only the selected person's bloodline -- ancestors, descendants, siblings at every generation, and their partners -- producing a clean, compact lineage view. Blood descendants of siblings (cousins) are included; married-in partners are excluded. A "Show all" button restores the full tree. The bloodline focus persists across view switches. **Help overlay:** a small frosted-glass overlay in the bottom-left corner shows platform-specific controls with icons (pan, zoom, ancestor highlight). On Mac it shows "Scroll / Pinch" for zoom; on mobile it shows "Pinch" and "Long-press". The overlay is dismissible per page load via the close button. It adapts to all themes (neon glow border, home-computer beveled borders).

### Person Profiles

Clicking a node navigates to `/person/{id}` which shows:

- Photo (if provided)
- Name, birth date, death date, sex
- Name history (birth name, married names, etc.) with optional type and date
- Nicknames / also-known-as
- Biography rendered from Markdown (leading H1 stripped to avoid duplicating the name)
- Links to parents, spouses, and children (by ID)

### Data Format

Each person is a folder in `data/` named `{birth-date}_{surname}_{firstname}`:

- `person.yaml` -- structured metadata: `name`, `sex`, `birth`, `death`, `parents`, `spouses`, `children`, plus optional `names` (name history) and `nicknames`
- `person.md` -- biography in pure Markdown (no frontmatter)
- `avatar.{png,jpg,...}` -- profile photo (auto-detected by convention)
- The folder name is the canonical ID. Relationships reference other folder names.
- Additional images and documents can be placed in the folder for use in the biography.

### Themes

Eight theme variants via two independent settings:

- **Style:** Classic (traditional serif look), Modern (flat design, indigo accent, system font), Neon (cyberpunk/Blade Runner aesthetic), or Home Computer (1980s home computer aesthetic)
- **Mode:** Light, Dark, or Auto (follows OS `prefers-color-scheme`)

The Neon theme features monospace typography, glowing neon borders and text shadows, animated pulsing header, SVG glow filters on tree nodes and connection lines, and a subtle scanline overlay. Light mode uses electric cyan accents; dark mode uses hot magenta.

The Home Computer theme recreates the look of 1980s home computers. Light mode is inspired by the Amiga Workbench (blue background, gray windows, orange accents, rainbow stripes). Dark mode is inspired by the C64 (purple-blue background with light blue text). Both use beveled 3D buttons, hard pixel shadows, monospace font, and sharp corners.

Theme and mode selectors are accessible from the ellipsis menu (⋮) in the header on all pages. The default theme is Neon Light. Selection is persisted in `localStorage` and survives page reloads and navigation.

### Static Site Export

`GET /export` (or the "Export" button in the header) downloads a ZIP archive containing the entire family tree as a self-contained static site. The ZIP includes:

- `index.html` with tree data embedded as inline JSON (no API call needed)
- Pre-rendered `person/{id}.html` pages for every family member
- All static assets (CSS, JS) and avatar photos
- All paths are relative, so the site works when opened via `file://` or deployed to any static hosting

Theme switching works fully in the exported site since it is implemented entirely in client-side CSS and JavaScript. D3.js is bundled locally, so the exported site is fully offline-capable.

### Localisation (i18n)

The UI supports multiple languages. Currently available: **English** (default), **German**, **French**, **Spanish**, and **Italian**.

- All UI labels (navigation, buttons, headings, form labels) are translatable via `data-i18n` attributes.
- Language is selected from the ellipsis menu (⋮) in the header on all pages (server and export).
- Selection is persisted in `localStorage` and survives page reloads and navigation.
- Markdown biography content and person names remain in their authored language.
- The static site export includes the i18n script; whichever language is active at export time is applied.
- Adding a new language requires adding a translation map in `static/js/i18n.js` and a new `<option>` in each template's language selector.

### JSON API

`GET /api/tree` returns all people as JSON, consumed by the frontend.

---

## Roadmap (Inferred)

Items below are gaps or natural next steps identified from the current codebase. They are not committed -- just observations.

### Data & Model

- [ ] **Search / filter** -- No way to find a person except scrolling the tree. A search bar or filter would help with larger trees.
- [ ] **Data validation** -- No validation that referenced IDs (parents, spouses, children) actually exist. Broken references fail silently.
- [ ] **Bidirectional relationship sync** -- If Alice lists Bob as a child, Bob should automatically list Alice as a parent. Currently both sides must be manually maintained.
- [ ] **GEDCOM import/export** -- Standard genealogy format. Would make it easier to migrate data from other tools.

### Visualization

- [ ] **Zoom-to-fit** -- Auto-fit the tree to the viewport on initial load, especially for large trees.
- [x] **Highlight path** -- Double-click a person to highlight their direct ancestor chain. Press Escape or double-click empty space to clear.
- [ ] **Responsive layout** -- The tree container has a fixed 600px height. Mobile support is limited.

### Person Profile

- [x] **Show names instead of IDs** -- Relationship links display the person's name instead of the raw folder ID.
- [ ] **Multiple photos / gallery** -- Currently only one photo per person.
- [ ] **Timeline view** -- Show a person's life events on a timeline.

### Infrastructure

- [x] **Configurable data directory** -- Use `--data` flag or `SIPPSCHAFT_DATA` environment variable to point to a different data folder. Defaults to `./data`.
- [x] **Hot reload without restart** -- The server polls the data directory every 2 seconds and automatically reloads when files change.
- [x] **Configurable port** -- Use `--port` flag or `SIPPSCHAFT_PORT` environment variable. Defaults to `8080`.
- [x] **Static site export** -- `GET /export` downloads a ZIP with the complete tree as static HTML/JS/CSS. Works via `file://` or any static host.
- [x] **Release binaries** -- Pushing a `v*` tag triggers a GitHub Actions workflow that builds cross-platform binaries (Linux, macOS Intel/ARM, Windows), bundles them with `static/` and `templates/`, and publishes them as a GitHub Release.
- [ ] **Tests** -- No test files exist in the project.
- [ ] **Docker support** -- No Dockerfile for containerized deployment.
- [x] **CI/CD** -- Tag-triggered GitHub Actions workflow builds cross-platform release binaries.
