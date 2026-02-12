# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- Replaced Dagre graph layout with custom genealogy-aware layout algorithm in `tree.js` (ADR-007)
- Spouse connection lines now attach at the side-center of person boxes instead of the bottom edge
- Multi-spouse families (e.g. Robert Smith with Linda Johnson and Susan Davis) use a couple-chain layout with all children placed as one group below, preventing visual overlaps

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
