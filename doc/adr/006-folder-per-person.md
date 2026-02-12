# ADR 006: Folder-Per-Person Data Structure

## Status

Accepted (supersedes [ADR-005](005-yaml-frontmatter.md))

## Context

The original data format stored each person as a single Markdown file with YAML frontmatter in a flat `data/` directory, with photos in `static/images/`. This worked for simple profiles but didn't scale for richer content: multiple photos, linked documents, or longer biographies referencing local assets.

## Decision

Each person gets a dedicated folder in `data/` named `{birth-date}_{surname}_{firstname}` (all lowercase). The folder contains:

- `person.yaml` -- structured metadata (name, sex, dates, relationships). Parsed with `gopkg.in/yaml.v3`.
- `person.md` -- biography in pure Markdown (no frontmatter).
- `avatar.{ext}` -- profile photo, auto-detected by scanning for common image extensions. No explicit `photo` field in the YAML.
- Additional files (images, documents) can be placed alongside and referenced from the Markdown.

The folder name is the canonical ID. There is no separate `id` field. All relationship references (parents, spouses, children) use folder names.

The `data/` directory is served over HTTP at `/data/` so that avatars and other assets are accessible to the browser.

## Consequences

**Positive:**
- All assets for a person are co-located in one folder
- Supports multiple images and documents per person without any schema changes
- The folder name encodes birth date and name, making the file system browsable and sortable
- Pure Markdown in `person.md` (no frontmatter) -- cleaner separation of concerns
- Avatar is auto-detected by convention -- no manual `photo` field to maintain
- YAML remains the metadata format (familiar, readable) but in its own file

**Negative:**
- Folder names are verbose (`1982-05-20_doe_jane` vs. `jane-doe`)
- Relationship references are verbose and harder to type manually
- Renaming a person (e.g. correcting a birth date) requires updating all references across other folders
- The `data/` directory is now served over HTTP, exposing YAML and Markdown files (acceptable for a self-hosted family app)

**Neutral:**
- Migration from the old flat format is a one-time operation
- A future validation step could check that all referenced folder names exist
