# ADR 002: Markdown Files as the Data Source (No Database)

## Status

Accepted

## Context

The app needs to store family member data -- names, dates, relationships, biographies. Options include a relational database (SQLite, PostgreSQL), a document store, JSON files, or Markdown files.

## Decision

Store each person as a `.md` file in the `data/` directory. Structured metadata lives in YAML frontmatter; the biography is the Markdown body. All files are loaded into memory at startup.

## Consequences

**Positive:**
- Human-readable and editable with any text editor
- Version-controllable with Git (diffs, history, branches)
- No database to install, configure, or migrate
- Non-developers can contribute by editing simple text files
- Portable -- copy the `data/` folder to move the entire dataset

**Negative:**
- No query language -- all data is loaded into memory and traversed in Go
- No referential integrity enforcement (a parent ID can reference a non-existent person)
- Concurrent writes are not handled (not a concern for the current single-writer use case)
- Scaling is limited by memory, though family trees rarely exceed thousands of entries

**Neutral:**
- A future migration to a database could use these files as a seed/import format
