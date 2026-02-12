# Project Instructions

## Documentation Maintenance

When the user explicitly or implicitly makes a **feature request**, **architecture proposal**, or **technology decision** during a conversation:

1. **doc/features.md** -- Add new features to the roadmap or move items from roadmap to "Current Features" once implemented.
2. **doc/adr/** -- Create a new ADR (`NNN-slug.md`) for any significant technology or architecture decision using the existing Status/Context/Decision/Consequences format. Update the ADR index table in `doc/architecture.md` chapter 9.
3. **doc/architecture.md** -- Update affected chapters (context diagram, building blocks, runtime views, deployment, risks) and their Mermaid diagrams to reflect the change.
4. **doc/personas.md** -- Update if a change affects who the app is for or how they use it.
5. **doc/vision.md** -- Update if a change affects project principles or non-goals.

Do this automatically as part of implementing the change. Do not ask for confirmation to update docs -- just do it alongside the code changes.

## Project Overview

Sippschaft is a simple, file-based family tree web app. See `doc/vision.md` for principles and `doc/architecture.md` for the full arc42 architecture documentation.

- **Language:** Go 1.25.5, standard library `net/http`
- **Frontend:** D3.js v7 + Dagre (from CDN), vanilla JS
- **Data:** Markdown files with YAML frontmatter in `data/`
- **Templates:** Go `html/template` in `templates/`
- **Docs:** `doc/` (vision, personas, features, architecture, ADRs)
