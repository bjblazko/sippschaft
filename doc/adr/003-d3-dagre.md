# ADR 003: D3.js and Dagre for Tree Visualization

## Status

Superseded by [ADR-007](007-custom-layout.md)

## Context

The core feature of the app is an interactive family tree visualization in the browser. The tree needs to support:

- Hierarchical layout (parents above children)
- Spouse pairing
- Zoom, pan, and click navigation
- An alternative force-directed view for exploratory browsing

Options considered: D3.js (with manual layout or Dagre), Cytoscape.js, vis.js, GoJS (commercial), or a custom Canvas/SVG solution.

## Decision

Use D3.js v7 for SVG rendering, interaction (zoom, drag, click), and the force-directed view. Use Dagre for automatic hierarchical graph layout in the classic view.

Both libraries are loaded from CDNs (`d3js.org`, `cdnjs.cloudflare.com`).

## Consequences

**Positive:**
- D3 is the most widely used data visualization library -- large community, extensive documentation
- Dagre handles hierarchical layout automatically, including edge routing
- The "family node" pattern (invisible nodes connecting parents to children) solves sibling alignment
- Force view comes essentially for free with D3's force simulation module
- No build step required -- CDN script tags in the HTML template

**Negative:**
- D3 has a steep learning curve and verbose API
- CDN dependency means the app requires internet access on first load (no offline support without vendoring)
- Dagre is minimally maintained (last release 2019), though the API is stable
- Custom styling and layout tweaks require low-level SVG manipulation

**Neutral:**
- Could vendor the JS files into `static/js/` for offline support in the future
