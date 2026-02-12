# ADR 005: YAML Frontmatter for Person Metadata

## Status

Superseded by [ADR-006](006-folder-per-person.md)

## Context

Each person file needs structured metadata (name, dates, relationships) alongside free-form biography text. The metadata format could be JSON, TOML, YAML, or a custom format.

## Decision

Use YAML frontmatter (delimited by `---`) at the top of each Markdown file, parsed with `gopkg.in/yaml.v3`. The parser is a custom state machine that splits frontmatter from content.

## Consequences

**Positive:**
- YAML is widely known and readable without escaping (unlike JSON)
- Frontmatter is a well-established convention (Jekyll, Hugo, Obsidian)
- Clean separation of structured data and free-form content in a single file
- Lists (parents, spouses, children) are natural in YAML syntax

**Negative:**
- YAML has well-known gotchas (implicit type coercion, indentation sensitivity)
- The custom frontmatter parser is simple but does not handle edge cases like `---` appearing in the biography content
- No schema validation -- typos in field names are silently ignored

**Neutral:**
- TOML would avoid some YAML pitfalls but is less familiar to non-developers
- A future improvement could add schema validation at load time
