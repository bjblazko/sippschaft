# ADR 007: Custom Genealogy Layout Replacing Dagre

## Status

Accepted

## Context

The classic tree view used Dagre (a general-purpose directed graph layout library) to position nodes. Dagre treats the family tree as a generic DAG and has no concept of genealogical conventions:

- Spouses were not guaranteed to be adjacent
- Children were not centered under their parents
- A person with multiple marriages caused confusing node placement
- "Family junction" nodes were an imperfect workaround that still produced unclear parent-child lines

Dagre was also unmaintained (last release 2019) and added an external CDN dependency.

## Decision

Replace Dagre with a custom genealogy-aware layout algorithm in `tree.js`. Keep D3.js for SVG rendering, zoom/pan, and the force-directed view.

The custom layout works as follows:

1. **Find the root** -- the parentless person with the most descendants
2. **Build a tree** by following `children` links from the root (avoiding duplicates)
3. **Group children by spouse** to handle multiple marriages
4. **Compute subtree widths bottom-up** -- each family unit's width is `max(couple width, children width)`; multiple marriages share the central person node
5. **Assign positions top-down** -- couples are placed centered above their children; children are distributed within their parent's allocated width

## Consequences

**Positive:**
- Children are always centered directly under their parent couple
- Spouses are always adjacent (male left, female right by convention)
- Multiple marriages are handled naturally (e.g., `Linda --- Robert --- Susan`)
- One fewer CDN dependency (Dagre removed)
- No more invisible "family junction" nodes or edge-grouping hacks
- Full control over genealogy-specific layout rules

**Negative:**
- More application code to maintain (~200 lines of layout logic in tree.js)
- The algorithm assumes a single connected tree rooted at one ancestor; disconnected families would need separate handling

**Neutral:**
- D3.js remains as the only external JS dependency (CDN-loaded)
- The force-directed view is unchanged
