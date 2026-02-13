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
- Biography rendered from Markdown
- Links to parents, spouses, and children (by ID)

### Data Format

Each person is a folder in `data/` named `{birth-date}_{surname}_{firstname}`:

- `person.yaml` -- structured metadata: `name`, `sex`, `birth`, `death`, `parents`, `spouses`, `children`
- `person.md` -- biography in pure Markdown (no frontmatter)
- `avatar.{png,jpg,...}` -- profile photo (auto-detected by convention)
- The folder name is the canonical ID. Relationships reference other folder names.
- Additional images and documents can be placed in the folder for use in the biography.

### Themes

Four theme variants via two independent settings:

- **Style:** Classic (traditional serif look) or Modern (flat design, indigo accent, system font)
- **Mode:** Light, Dark, or Auto (follows OS `prefers-color-scheme`)

Theme selector dropdowns appear in the header on all pages. Selection is persisted in `localStorage` and survives page reloads and navigation.

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

- [ ] **Show names instead of IDs** -- Relationship links display raw IDs (e.g. `john-doe`) instead of the person's display name.
- [ ] **Multiple photos / gallery** -- Currently only one photo per person.
- [ ] **Timeline view** -- Show a person's life events on a timeline.

### Infrastructure

- [x] **Hot reload without restart** -- The server polls the `data/` directory every 2 seconds and automatically reloads when files change.
- [ ] **Configurable port** -- Port 8080 is hardcoded.
- [ ] **Static site generation** -- Export the tree as a static HTML site for hosting without a server.
- [ ] **Tests** -- No test files exist in the project.
- [ ] **Docker support** -- No Dockerfile for containerized deployment.
- [ ] **CI/CD** -- No GitHub Actions or similar pipeline.
