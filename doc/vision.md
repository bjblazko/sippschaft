# Vision

Sippschaft is a simple, file-based family tree app that anyone can self-host without a database.

## Principles

- **Simplicity over features** -- The app should remain easy to understand, deploy, and maintain. A single binary, a folder of Markdown files, and a browser are all you need.
- **Data as plain files** -- Family members are defined as Markdown files with YAML frontmatter. No database, no migrations, no vendor lock-in. Data is human-readable, version-controllable, and portable.
- **Zero configuration** -- Clone, run, open. No config files, environment variables, or setup wizards required.
- **Accessible to non-developers** -- Adding a family member means creating a simple text file. No code changes needed.
- **Self-hostable and offline-capable** -- Runs on any machine with Go installed. No cloud dependencies, no CDN, no internet required. All assets are bundled locally.

## Non-goals

- Being a full genealogy research platform (GEDCOM import/export, source citations, etc.)
- Multi-user authentication or access control
- Cloud-hosted SaaS offering
