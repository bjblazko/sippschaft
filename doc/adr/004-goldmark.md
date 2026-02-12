# ADR 004: Goldmark for Markdown Rendering

## Status

Accepted

## Context

Person biographies are written in Markdown and need to be rendered as HTML on the profile page. Go has several Markdown libraries: Goldmark, Blackfriday, and gomarkdown.

## Decision

Use Goldmark (`github.com/yuin/goldmark`) for converting Markdown content to HTML.

## Consequences

**Positive:**
- Goldmark is CommonMark-compliant, ensuring predictable rendering
- Actively maintained and widely adopted in the Go ecosystem (used by Hugo)
- Extensible via plugins (syntax highlighting, footnotes, etc.) if needed later
- Good performance for the typical biography length

**Negative:**
- Adds an external dependency (though lightweight)
- Raw HTML output is trusted and injected via `template.HTML` -- this is acceptable since data files are author-controlled, but would be a security concern if user-submitted content were allowed

**Neutral:**
- Blackfriday was the previous Go standard but is less maintained; Goldmark is the current recommendation
