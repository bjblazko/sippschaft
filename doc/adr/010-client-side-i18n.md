# ADR-010: Client-Side Internationalisation (i18n)

## Status

Accepted

## Context

All UI labels (navigation, buttons, form labels, headings) were hardcoded in English. Users who speak other languages -- German in particular, given the project's name -- cannot use the app in their native language. Markdown biography content and person names are user-authored and should remain untranslated.

Server-side i18n would require either duplicating templates per language or introducing a Go i18n library. Since the app already uses a client-side pattern for theming (localStorage + JS + data attributes), the same approach works naturally for language switching.

## Decision

Use a client-side translation layer via `data-i18n` attributes and a new `static/js/i18n.js` script:

- All translatable HTML elements receive a `data-i18n="key"` attribute with their English text as fallback content.
- `i18n.js` contains translation maps for each supported language (initially `en` and `de`).
- The active language is stored in `localStorage` under `sippschaft-lang` and applied on `DOMContentLoaded`.
- A language selector is placed in the ellipsis menu (server templates) or in the header theme selector row (export templates).
- The static site export includes `i18n.js` and uses whichever language was selected at export time.
- Adding a new language requires only adding a new map entry in `i18n.js` and a new `<option>` in each template's language selector.

## Consequences

- **Pro:** No server-side changes needed for translation logic; consistent with the existing theme pattern.
- **Pro:** Works identically in the static export since it is purely client-side.
- **Pro:** Adding new languages is a single-file change (`i18n.js` + selector options).
- **Con:** There is a brief moment on page load where English text is visible before JS applies translations. This is negligible since the script loads in `<head>`.
- **Con:** Markdown content and person names remain in their authored language -- this is by design.
