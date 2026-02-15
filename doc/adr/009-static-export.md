# ADR-009: Static Site Export as ZIP

**Status:** Accepted

## Context

Users want to share or host the family tree without running a Go server. A static HTML export would allow opening the tree directly from the filesystem (`file://` protocol) or deploying to any static hosting service (GitHub Pages, Netlify, S3, etc.).

The main challenge is that the tree page fetches data from `/api/tree` at runtime, which requires a running server. Person profile pages are rendered server-side by Go templates. All asset paths in templates use absolute paths (e.g. `/static/css/style.css`) which do not work with the `file://` protocol.

## Decision

Add a `GET /export` endpoint that streams a ZIP archive containing the complete family tree as a self-contained static site:

- **`index.html`** -- Tree page with family data embedded as inline JSON in a `<script>` tag (`window.__SIPPSCHAFT_DATA__`), eliminating the API fetch.
- **`person/{id}.html`** -- Pre-rendered profile page for each person, with biography already converted from Markdown to HTML.
- **`static/css/style.css`**, **`static/js/theme.js`**, **`static/js/i18n.js`**, **`static/js/tree.js`**, **`static/js/d3.v7.min.js`** -- Client-side assets copied verbatim.
- **`data/{id}/avatar.*`** -- Avatar photos and other media files (YAML and Markdown source files are excluded).

All paths in the export use relative references (`static/...` from index, `../static/...` from person pages) so the site works without a web server.

`tree.js` checks for `window.__SIPPSCHAFT_DATA__` before calling `fetch('/api/tree')`. If the global is set (as in the export), it uses the inline data directly. A `window.__SIPPSCHAFT_STATIC__` flag switches person link URLs from `/person/{id}` to `person/{id}.html`.

Separate export templates (`export-index.html`, `export-person.html`) are used to keep the server-mode templates unchanged.

## Consequences

- The export is a single HTTP request producing a downloadable ZIP -- no build tools or CLI needed.
- Theme switching works fully in the export since it is pure client-side CSS/JS.
- D3.js is vendored locally and included in the export, so the exported site is fully offline-capable.
- The export is a snapshot; it does not update when data changes. Users must re-export after edits.
- Export templates must be kept in sync with the server templates when UI changes are made.
