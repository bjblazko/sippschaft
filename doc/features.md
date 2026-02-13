# Features

## Current Features

### Interactive Family Tree (Homepage)

Two visualization modes on the main page:

- **Classic View** -- Hierarchical tree layout using a custom genealogy-aware algorithm. Parents are placed above their children, spouses are adjacent, and multi-spouse families use a couple-chain layout. Nodes show name, gender symbol, birth/death years, and optional photo.
- **Force View** -- Physics-based D3 force simulation. Nodes can be dragged freely. Parent-child links are solid lines; spouse links are dashed red lines.

Both views support zoom and pan via mouse/trackpad.

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

Theme selector dropdowns appear in the header on all pages. Selection is persisted in `localStorage` and survives page reloads and navigation.

### Static Site Export

`GET /export` (or the "Export" button in the header) downloads a ZIP archive containing the entire family tree as a self-contained static site. The ZIP includes:

- `index.html` with tree data embedded as inline JSON (no API call needed)
- Pre-rendered `person/{id}.html` pages for every family member
- All static assets (CSS, JS) and avatar photos
- All paths are relative, so the site works when opened via `file://` or deployed to any static hosting

Theme switching works fully in the exported site since it is implemented entirely in client-side CSS and JavaScript. D3.js is loaded from CDN, so an internet connection is required for the tree visualization.

### Localisation (i18n)

The UI supports multiple languages. Currently available: **English** (default) and **German**.

- All UI labels (navigation, buttons, headings, form labels) are translatable via `data-i18n` attributes.
- Language is selected from the ellipsis menu on server pages, or from the header on exported pages.
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
- [ ] **Highlight path** -- Click a person and highlight the ancestry path to a selected root.
- [ ] **Responsive layout** -- The tree container has a fixed 600px height. Mobile support is limited.

### Person Profile

- [x] **Show names instead of IDs** -- Relationship links display the person's name instead of the raw folder ID.
- [ ] **Multiple photos / gallery** -- Currently only one photo per person.
- [ ] **Timeline view** -- Show a person's life events on a timeline.

### Infrastructure

- [x] **Configurable data directory** -- Use `--data` flag or `DATA` environment variable to point to a different data folder. Defaults to `./data`.
- [x] **Hot reload without restart** -- The server polls the data directory every 2 seconds and automatically reloads when files change.
- [ ] **Configurable port** -- Port 8080 is hardcoded.
- [x] **Static site export** -- `GET /export` downloads a ZIP with the complete tree as static HTML/JS/CSS. Works via `file://` or any static host.
- [ ] **Tests** -- No test files exist in the project.
- [ ] **Docker support** -- No Dockerfile for containerized deployment.
- [ ] **CI/CD** -- No GitHub Actions or similar pipeline.
