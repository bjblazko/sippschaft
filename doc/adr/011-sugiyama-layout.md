# ADR 011: Sugiyama-Style Layout with Satellite Placement

## Status

Accepted (supersedes ADR-007)

## Context

ADR-007 introduced a custom genealogy layout to replace Dagre. The initial algorithm was a simple recursive approach: find a root, build a tree, compute widths bottom-up, and assign positions top-down. This worked for single-family trees but broke down with:

- **Multi-partner chains** (A married B, B later married C): partners were collected one-hop only, so B's two partners were treated as separate groups, splitting the tree.
- **In-law ancestors** (e.g., the parents of a spouse from another family): they had no path from the main root through `layoutChildren` and were placed at arbitrary positions or not at all.
- **Edge crossings**: no crossing minimisation meant connection lines frequently passed through unrelated nodes.
- **Overlapping nodes**: satellite families placed near their bridge person overlapped with the main tree because the overlap check only considered one generation at a time.

## Decision

Replace the simple recursive layout with a **seven-phase Sugiyama-style layered graph algorithm** tailored for genealogical data. The algorithm lives entirely in `static/js/tree.js` inside `renderClassicTree()`.

### Phase 1 -- Root Selection

Find the root person: the parentless person with the most descendants (by recursive count through `children` links). This ensures the largest family line anchors the layout.

### Phase 2 -- Generation Assignment (Layer Assignment)

BFS from the root through **all relationship types** (children, parents, spouses, co-parents). Children are assigned `gen + 1`, parents `gen - 1`, partners the same `gen`. This guarantees all couples share a row regardless of how they entered the tree. Generations are then normalised so the minimum is zero.

### Phase 3 -- Family Unit Construction

Scan all people with children and group their children by co-parent. Each group becomes a **family unit** `{ parents: [...], children: [...], gen }`. A family key (sorted parent IDs joined with `+`) prevents duplicates.

### Phase 4 -- Spanning Tree (Child Assignment)

Each child must belong to exactly one parent for the tree layout. BFS from the root follows children + partner + parent links. The first parent to reach a child via `children` claims it (`assignedChild` set, `layoutChildren` map). This builds a spanning tree that drives the top-down width and position computation. In-law ancestors are discovered via parent links and their children are assigned in a second pass.

### Phase 5 -- Crossing Minimisation

**5a. DFS ordering.** A depth-first walk from the root produces an initial left-to-right order (`genOrder`) for each generation, placing partners adjacent.

**5b. Transitive partner groups.** `getPartnerGroup(pid, excludeFilter)` performs a BFS through all partner links (spouses + co-parents) to collect the complete partner chain at a generation. For example, if Otto married Clausina and Clausina previously married Heinrich, all three form one group. The optional `excludeFilter` allows traversal through excluded members (e.g., already-placed nodes) to find further partners without including them in the result. This function is used by `buildCoupleBlocks`, `computeGroupW`, `effectiveGroupW`, `placeGroup`, and the layout-roots loop.

**5c. Couple blocks.** People at each generation are grouped into atomic blocks via `getPartnerGroup`. Each block moves as a unit during reordering.

**5d. Barycenter heuristic.** Four alternating passes (top-down then bottom-up) sort blocks at each generation by the weighted barycenter of their connections to the adjacent generation. The primary child (spanning-tree member) gets weight 1.0; partner members get weight 0.3 so the block gently shifts toward the partner's family without being pulled away from siblings. A final top-down settling pass locks positions.

**5e. Internal block ordering (Hamiltonian path).** Within a multi-partner block, a Hamiltonian path through the partner adjacency graph places the hub person (e.g., a person with two marriages) in the middle. The path is oriented using parent barycenters; for generation-0 blocks (no parents), children barycenters are used instead. Fallback: male-left / female-right.

**5f. Adjacent swap.** A sweep at each generation tries swapping neighbouring blocks. Swaps that reduce crossings are kept; ties are broken by a **sibling span** metric (prefer grouping siblings closer together).

### Phase 6 -- Width Computation (Bottom-Up)

`computeGroupW(pid)` recursively computes the width of a person's partner group plus all descendants below. A group's width is `max(headerWidth, childrenTotalWidth)` where:

- `headerWidth = members * NODE_W + (members - 1) * SPOUSE_GAP`
- `childrenTotalWidth = sum of child group widths + gaps`

All members of a partner group share the same memoised width.

### Phase 7 -- Position Assignment (Top-Down)

`placeGroup(pid, left, gen)` assigns x/y positions. It collects the unplaced partner group, centres the header in the allocated width, then recursively places children sorted by `genOrder`.

`effectiveGroupW(pid)` is a non-memoised variant that excludes already-placed members and children, used during placement to compute the remaining width needed.

**Layout roots.** People not assigned as a child to anyone are collected into layout roots (transitively through partner links). The root with the largest subtree is the **main root** and is placed first.

**Satellite roots** (in-law ancestors, unpartnered co-parents) are placed **strictly to the right of the entire main tree**, one after another, sorted by their bridge person's x position. Earlier iterations attempted to interleave satellites near their bridge person using per-generation overlap checks, but this caused overlapping nodes and broken parent-child alignment. The right-of-tree strategy guarantees no overlaps and preserves the recursive tree structure. Connection lines still draw correctly because they use actual data-driven positions.

### Rendering

Connection lines are drawn per family unit:

- **Couple line**: horizontal between partners (solid for spouses, dashed for co-parents)
- **Junction**: vertical from couple midpoint down to a horizontal bar
- **Bar**: horizontal spanning all children x-positions
- **Drops**: vertical from bar down to each child's top edge

Each family gets a unique colour via **golden-angle HSL spacing** (137.508 steps, offset 30) for maximum visual separation. Bars between the same generation pair are **staggered** (10 px vertical offset) to distinguish overlapping family connections.

## Consequences

**Positive:**

- Multi-partner chains (A-B-C) are handled correctly as one atomic group
- In-law ancestors are discovered and placed without overlapping the main tree
- Crossing minimisation significantly reduces confusing line crossings
- Colour-coded family lines make it easy to trace parentage
- The layout is deterministic and stable across reloads

**Negative:**

- Satellite families appear to the right of the main tree rather than directly above their connection point, which can make connection lines longer
- The algorithm is complex (~1100 lines) and tightly coupled to genealogy conventions
- No incremental layout: the entire tree is recomputed on every render

**Neutral:**

- D3.js remains the only external dependency (CDN-loaded)
- The force-directed view is unchanged
