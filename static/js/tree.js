let currentData = null;
let currentView = 'classic'; // 'force' or 'classic'

// In static export mode, links are relative HTML files instead of server routes
function personUrl(id) {
    if (window.__SIPPSCHAFT_STATIC__) {
        return 'person/' + id + '.html';
    }
    return '/person/' + id;
}

function getContainerSize() {
    const el = document.getElementById('tree-container');
    const rect = el.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const height = rect.height || (window.innerHeight - el.offsetTop);
    return { width, height };
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM Content Loaded");
    // Bind buttons
    const btnForce = document.getElementById('btn-force');
    if (btnForce) {
        console.log("Found Force Button");
        btnForce.addEventListener('click', () => {
            console.log("Clicked Force View");
            switchView('force');
        });
    } else {
        console.error("Force Button NOT found");
    }

    const btnClassic = document.getElementById('btn-classic');
    if (btnClassic) {
        console.log("Found Classic Button");
        btnClassic.addEventListener('click', () => {
            console.log("Clicked Classic View");
            switchView('classic');
        });
    } else {
        console.error("Classic Button NOT found");
    }

    if (window.__SIPPSCHAFT_DATA__) {
        console.log("Using inline data");
        currentData = window.__SIPPSCHAFT_DATA__;
        renderTree();
    } else {
        fetch('/api/tree')
            .then(response => response.json())
            .then(data => {
                console.log("Data fetched", data);
                currentData = data;
                renderTree();
            })
            .catch(error => console.error('Error fetching tree data:', error));
    }

    window.addEventListener('resize', () => {
        if (currentData) renderTree();
    });

    // Re-render when theme changes
    document.addEventListener('themechange', () => {
        if (currentData) renderTree();
    });
});

function switchView(view) {
    console.log("Switching view to:", view);
    currentView = view;
    // Update buttons
    document.querySelectorAll('#controls button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${view}`).classList.add('active');

    renderTree();
}

function renderTree() {
    console.log("Rendering tree. View:", currentView);
    // Clear existing
    const container = d3.select("#tree-container");
    container.html("");

    if (!currentData) {
        console.warn("No data to render");
        return;
    }

    try {
        if (currentView === 'force') {
            renderForceTree(currentData);
        } else {
            console.log("Calling renderClassicTree");
            renderClassicTree(currentData);
        }
    } catch (e) {
        console.error("Error rendering tree:", e);
    }
}

// Helper to format life span (e.g. "*1950 †2020" or "*1980")
function getLifeSpan(p) {
    if (!p.birth && !p.death) return '';
    const getYear = (s) => s ? s.split('-')[0] : '?';
    const bYear = getYear(p.birth);
    if (p.death) {
        return `*${bYear} †${getYear(p.death)}`;
    }
    return `*${bYear}`;
}

function getGenderSymbol(sex) {
    const s = sex ? sex.toLowerCase() : '';
    if (s === 'male') return '♂';
    if (s === 'female') return '♀';
    if (s === 'diverse') return '⚥';
    return '?';
}

function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function isNeonTheme() {
    return document.documentElement.dataset.themeStyle === 'neon';
}

function addDropShadowFilter(svg) {
    const defs = svg.append("defs");
    if (isNeonTheme()) {
        // Neon glow filter: colored outer glow + slight blur
        const filter = defs.append("filter").attr("id", "drop-shadow")
            .attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
        filter.append("feGaussianBlur")
            .attr("in", "SourceAlpha").attr("stdDeviation", 4).attr("result", "blur");
        filter.append("feFlood")
            .attr("flood-color", cssVar('--accent-color')).attr("flood-opacity", "0.5").attr("result", "color");
        filter.append("feComposite")
            .attr("in", "color").attr("in2", "blur").attr("operator", "in").attr("result", "glow");
        const merge = filter.append("feMerge");
        merge.append("feMergeNode").attr("in", "glow");
        merge.append("feMergeNode").attr("in", "SourceGraphic");
    } else {
        // Standard drop shadow
        const filter = defs.append("filter").attr("id", "drop-shadow")
            .attr("x", "-20%").attr("y", "-20%").attr("width", "140%").attr("height", "140%");
        filter.append("feDropShadow")
            .attr("dx", 0).attr("dy", 2).attr("stdDeviation", 3)
            .attr("flood-color", "rgba(0,0,0,0.2)");
    }
    return defs;
}

function getGenderColor(sex) {
    const s = sex ? sex.toLowerCase() : '';
    if (s === 'male') return cssVar('--male-fill');
    if (s === 'female') return cssVar('--female-fill');
    if (s === 'diverse') return cssVar('--diverse-fill');
    return cssVar('--unknown-fill');
}

function getStrokeColor(sex) {
    const s = sex ? sex.toLowerCase() : '';
    if (s === 'male') return cssVar('--male-stroke');
    if (s === 'female') return cssVar('--female-stroke');
    if (s === 'diverse') return cssVar('--diverse-stroke');
    return cssVar('--unknown-stroke');
}


function renderForceTree(peopleMap) {
    const { width, height } = getContainerSize();

    // Convert map to nodes and links
    const nodes = Object.values(peopleMap).map(p => ({
        id: p.id,
        name: p.name,
        sex: p.sex,
        lifeSpan: getLifeSpan(p),
        photo: p.photo, // Pass photo path
        group: 1
    }));

    const links = [];

    // Create links based on relationships
    Object.values(peopleMap).forEach(p => {
        // Children links
        if (p.children) {
            p.children.forEach(childId => {
                links.push({ source: p.id, target: childId, type: "parent-child" });
            });
        }

        // Spouse links
        if (p.spouses) {
            p.spouses.forEach(spouseId => {
                if (p.id < spouseId) {
                    links.push({ source: p.id, target: spouseId, type: "spouse" });
                }
            });
        }
    });

    const svg = d3.select("#tree-container").append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(d3.zoom().on("zoom", (event) => {
            g.attr("transform", event.transform);
        }))
        .append("g");

    addDropShadowFilter(svg);

    const g = svg.append("g");

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(120)) // Increased distance
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide(40)); // Increased radius

    const link = g.append("g")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("stroke", d => d.type === "spouse" ? cssVar('--female-stroke') : cssVar('--line-color'))
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", d => d.type === "spouse" ? "5,5" : "none");

    const node = g.append("g")
        .selectAll("g")
        .data(nodes)
        .enter().append("g")
        .call(d3.drag()
            .on("start", (event, d) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on("drag", (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on("end", (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }));

    node.append("circle")
        .attr("r", 25) // Slightly larger
        .attr("fill", d => getGenderColor(d.sex))
        .attr("stroke", d => getStrokeColor(d.sex))
        .attr("stroke-width", 2)
        .attr("filter", "url(#drop-shadow)");

    // Photo (Force View)
    node.each(function (d) {
        if (d.photo) {
            d3.select(this).append("clipPath")
                .attr("id", "clip-" + d.id)
                .append("circle")
                .attr("r", 25);

            d3.select(this).append("image")
                .attr("xlink:href", d.photo)
                .attr("x", -25)
                .attr("y", -25)
                .attr("width", 50)
                .attr("height", 50)
                .attr("clip-path", "url(#clip-" + d.id + ")");
        }
    });

    // Name + Gender Symbol
    node.append("text")
        .attr("x", 30) // Offset
        .attr("y", -5)
        .text(d => d.name + " " + getGenderSymbol(d.sex))
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .attr("fill", cssVar('--node-text'));

    // Dates
    node.append("text")
        .attr("x", 30)
        .attr("y", 10)
        .text(d => d.lifeSpan)
        .style("font-size", "10px")
        .attr("fill", cssVar('--node-subtext'));

    node.on("click", (event, d) => {
        window.location.href = personUrl(d.id);
    });

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("transform", d => `translate(${d.x},${d.y})`);
    });
}

function measureTextWidth(text, fontSize, fontWeight) {
    const svg = d3.select("body").append("svg").style("position", "absolute").style("visibility", "hidden");
    const t = svg.append("text").text(text).style("font-size", fontSize).style("font-weight", fontWeight);
    const w = t.node().getComputedTextLength();
    svg.remove();
    return w;
}

function renderClassicTree(peopleMap) {
    const { width, height } = getContainerSize();

    // Compute node width from the longest name
    let maxNameW = 0;
    Object.values(peopleMap).forEach(p => {
        const label = p.name + " " + getGenderSymbol(p.sex);
        const w = measureTextWidth(label, "14px", "bold");
        if (w > maxNameW) maxNameW = w;
    });
    const hasPhotos = Object.values(peopleMap).some(p => p.photo);
    const padding = hasPhotos ? 65 + 15 : 30; // text offset + right margin
    const NODE_W = Math.max(210, Math.ceil(maxNameW + padding));
    const NODE_H = 60, H_GAP = 40, V_GAP = 80, SPOUSE_GAP = 20;

    // === LAYOUT: Genealogy tree with global generation alignment ===

    // Helper: get all partners (spouses + non-spouse co-parents)
    function getAllPartners(pid) {
        const p = peopleMap[pid];
        const spouseIds = (p.spouses || []).filter(s => peopleMap[s]);
        const coParentSet = new Set();
        if (p.children) {
            p.children.forEach(cid => {
                const child = peopleMap[cid];
                if (child && child.parents) {
                    child.parents.forEach(ppid => {
                        if (ppid !== pid && peopleMap[ppid] && !spouseIds.includes(ppid)) {
                            coParentSet.add(ppid);
                        }
                    });
                }
            });
        }
        const coParents = [...coParentSet];
        return { spouseIds, coParents, partnerIds: [...spouseIds, ...coParents] };
    }

    // Transitively collect all partners at the same generation via partner links.
    // A partner group is a set of people connected through chains of partner
    // relationships (A-B, B-C → A,B,C are all in the same group).
    // Optional excludeFilter: members matching the filter are still traversed
    // (to find further partners) but NOT included in the result.
    function getPartnerGroup(startPid, excludeFilter) {
        const gen = genMap[startPid];
        const members = [];
        const visited = new Set();
        const queue = [startPid];
        while (queue.length > 0) {
            const pid = queue.shift();
            if (visited.has(pid) || genMap[pid] !== gen) continue;
            visited.add(pid);
            if (!excludeFilter || !excludeFilter(pid)) {
                members.push(pid);
            }
            getAllPartners(pid).partnerIds.forEach(sid => {
                if (!visited.has(sid) && genMap[sid] === gen) queue.push(sid);
            });
        }
        return members;
    }

    // --- Phase 1: Find root person (most descendants, no parents) ---
    function countDesc(pid, vis) {
        if (vis.has(pid)) return 0;
        vis.add(pid);
        const p = peopleMap[pid];
        if (!p || !p.children) return 0;
        let n = 0;
        p.children.forEach(c => { if (peopleMap[c]) n += 1 + countDesc(c, vis); });
        return n;
    }
    let rootId = null, maxD = -1;
    Object.values(peopleMap).forEach(p => {
        if (!p.parents || p.parents.length === 0) {
            const d = countDesc(p.id, new Set());
            if (d > maxD) { maxD = d; rootId = p.id; }
        }
    });
    if (!rootId) { rootId = Object.keys(peopleMap)[0]; }

    // --- Phase 2: Global generation assignment via BFS ---
    // BFS through ALL relationship types ensures couples are on the same row
    const genMap = {};
    {
        const q = [rootId];
        genMap[rootId] = 0;
        while (q.length > 0) {
            const pid = q.shift();
            const gen = genMap[pid];
            const p = peopleMap[pid];

            // Partners → same generation
            getAllPartners(pid).partnerIds.forEach(sid => {
                if (genMap[sid] === undefined) { genMap[sid] = gen; q.push(sid); }
            });
            // Also check direct spouse links for childless couples
            if (p.spouses) {
                p.spouses.forEach(sid => {
                    if (peopleMap[sid] && genMap[sid] === undefined) { genMap[sid] = gen; q.push(sid); }
                });
            }

            // Children → gen + 1
            if (p.children) {
                p.children.forEach(cid => {
                    if (peopleMap[cid] && genMap[cid] === undefined) { genMap[cid] = gen + 1; q.push(cid); }
                });
            }

            // Parents → gen - 1
            if (p.parents) {
                p.parents.forEach(ppid => {
                    if (peopleMap[ppid] && genMap[ppid] === undefined) { genMap[ppid] = gen - 1; q.push(ppid); }
                });
            }
        }
        const minG = Math.min(...Object.values(genMap));
        Object.keys(genMap).forEach(pid => genMap[pid] -= minG);
    }
    const maxGen = Math.max(...Object.values(genMap));

    // --- Phase 3: Build family units ---
    // Each family = { parents: [sorted ids], children: [sorted by birth], gen }
    const families = [];
    {
        const seen = new Set();
        Object.values(peopleMap).forEach(person => {
            if (!person.children || person.children.length === 0) return;
            const childGroups = {};
            person.children.forEach(cid => {
                if (!peopleMap[cid]) return;
                const child = peopleMap[cid];
                const op = (child.parents || []).find(p => p !== person.id && peopleMap[p]);
                const key = op || '__none__';
                if (!childGroups[key]) childGroups[key] = [];
                childGroups[key].push(cid);
            });
            Object.entries(childGroups).forEach(([opKey, kids]) => {
                const parents = opKey === '__none__' ? [person.id] : [person.id, opKey].sort();
                const fk = parents.join('+');
                if (!seen.has(fk)) {
                    seen.add(fk);
                    families.push({
                        parents,
                        children: [...new Set(kids)].sort((a, b) =>
                            (peopleMap[a].birth || '').localeCompare(peopleMap[b].birth || '')
                        ),
                        gen: genMap[parents[0]]
                    });
                }
            });
        });
    }

    // --- Phase 4: Assign each child to exactly one parent for tree layout ---
    // Build a spanning tree rooted at the root person.
    // DFS from root following children links; each child is assigned to
    // whichever parent reaches it first. Then discover remaining people
    // (in-law ancestors) and assign their children too.
    const layoutChildren = {}; // pid -> [child ids assigned to this parent]
    Object.keys(genMap).forEach(pid => layoutChildren[pid] = []);
    const assignedChild = new Set();
    const reachable = new Set();

    // BFS from root through children + partner links to find main tree
    {
        const q = [rootId];
        reachable.add(rootId);
        while (q.length > 0) {
            const pid = q.shift();
            const p = peopleMap[pid];

            // Follow partner links
            getAllPartners(pid).partnerIds.forEach(sid => {
                if (!reachable.has(sid)) { reachable.add(sid); q.push(sid); }
            });

            // Follow children links and assign
            if (p.children) {
                p.children.forEach(cid => {
                    if (peopleMap[cid] && !assignedChild.has(cid)) {
                        assignedChild.add(cid);
                        layoutChildren[pid].push(cid);
                    }
                    if (peopleMap[cid] && !reachable.has(cid)) {
                        reachable.add(cid);
                        q.push(cid);
                    }
                });
            }

            // Follow parent links to discover in-law ancestors
            if (p.parents) {
                p.parents.forEach(ppid => {
                    if (peopleMap[ppid] && !reachable.has(ppid)) {
                        reachable.add(ppid);
                        q.push(ppid);
                    }
                });
            }
        }
    }

    // Assign remaining unassigned children (for in-law families discovered via parent links)
    families.sort((a, b) => a.gen - b.gen);
    families.forEach(fam => {
        fam.children.forEach(cid => {
            if (!assignedChild.has(cid)) {
                assignedChild.add(cid);
                layoutChildren[fam.parents[0]].push(cid);
            }
        });
    });

    // --- Phase 5: DFS ordering within each generation ---
    const genOrder = {};
    for (let g = 0; g <= maxGen; g++) genOrder[g] = [];
    const inOrder = new Set();

    function addPerson(pid) {
        if (inOrder.has(pid) || genMap[pid] === undefined) return;
        inOrder.add(pid);
        genOrder[genMap[pid]].push(pid);
    }

    // DFS: visit person, then partners adjacent, then recurse to children
    function dfsOrder(pid) {
        if (inOrder.has(pid) || !peopleMap[pid]) return;
        addPerson(pid);

        // Add partners adjacent (male-left ordering)
        const { partnerIds } = getAllPartners(pid);
        partnerIds.forEach(sid => addPerson(sid));

        // Recurse into children (assigned to this person)
        (layoutChildren[pid] || []).forEach(cid => dfsOrder(cid));

        // Also recurse into children assigned to partners
        partnerIds.forEach(sid => {
            (layoutChildren[sid] || []).forEach(cid => dfsOrder(cid));
        });
    }

    dfsOrder(rootId);

    // Pick up anyone not reached (disconnected components)
    Object.keys(genMap).forEach(pid => {
        if (!inOrder.has(pid)) dfsOrder(pid);
    });

    // --- Phase 5b: Crossing minimization (Sugiyama-style) ---
    // Group people at a generation into couple blocks (units that move together)
    function buildCoupleBlocks(g) {
        const blocks = [];
        const assigned = new Set();
        genOrder[g].forEach(pid => {
            if (assigned.has(pid)) return;
            // Transitively collect all partners into one block
            const group = getPartnerGroup(pid);
            const block = group.filter(id => !assigned.has(id));
            block.forEach(id => assigned.add(id));
            if (block.length > 0) blocks.push(block);
        });
        return blocks;
    }

    // Compute the weighted barycenter of a block's connections at refGen.
    // Primary child (spanning-tree member) gets full weight; partners get reduced
    // weight so the block gently shifts toward the partner's family without being
    // pulled away from siblings.
    function blockBarycenter(block, g, refGen) {
        const refOrder = genOrder[refGen];
        const primaryChild = block.find(pid => assignedChild.has(pid));

        let totalIdx = 0, totalWeight = 0;
        block.forEach(pid => {
            const p = peopleMap[pid];
            const w = (pid === primaryChild) ? 1.0 : 0.3;
            if (p.parents) {
                p.parents.forEach(ppid => {
                    if (peopleMap[ppid] && genMap[ppid] === refGen) {
                        const idx = refOrder.indexOf(ppid);
                        if (idx >= 0) { totalIdx += idx * w; totalWeight += w; }
                    }
                });
            }
            if (p.children) {
                p.children.forEach(cid => {
                    if (peopleMap[cid] && genMap[cid] === refGen) {
                        const idx = refOrder.indexOf(cid);
                        if (idx >= 0) { totalIdx += idx * w; totalWeight += w; }
                    }
                });
            }
        });
        return totalWeight > 0 ? totalIdx / totalWeight : genOrder[g].indexOf(block[0]);
    }

    // Order members within a couple block so that each person is near their parents.
    // Uses individual parent barycenters to decide left-right positioning.
    function orderBlockInternal(block, g) {
        if (block.length <= 1) return;

        // Compute each member's individual parent barycenter
        const refOrder = genOrder[g - 1] || [];
        function memberParentBary(pid) {
            const p = peopleMap[pid];
            let total = 0, cnt = 0;
            if (p.parents) {
                p.parents.forEach(ppid => {
                    if (peopleMap[ppid] && genMap[ppid] === g - 1) {
                        const idx = refOrder.indexOf(ppid);
                        if (idx >= 0) { total += idx; cnt++; }
                    }
                });
            }
            return cnt > 0 ? total / cnt : null;
        }

        // Build couple/co-parent adjacency within the block
        function areDirectlyLinked(a, b) {
            const pa = peopleMap[a], pb = peopleMap[b];
            if (pa.spouses && pa.spouses.includes(b)) return true;
            if (pb.spouses && pb.spouses.includes(a)) return true;
            const aKids = new Set(pa.children || []);
            return (pb.children || []).some(c => aKids.has(c));
        }

        const adj = {};
        block.forEach(pid => adj[pid] = []);
        for (let i = 0; i < block.length; i++) {
            for (let j = i + 1; j < block.length; j++) {
                if (areDirectlyLinked(block[i], block[j])) {
                    adj[block[i]].push(block[j]);
                    adj[block[j]].push(block[i]);
                }
            }
        }

        // Find a Hamiltonian path so directly-linked partners are adjacent.
        // This puts the "hub" person (e.g., Timo with 2 partners) in the middle.
        function findPath(start, visited) {
            visited.add(start);
            if (visited.size === block.length) return [start];
            for (const next of adj[start]) {
                if (!visited.has(next)) {
                    const rest = findPath(next, new Set(visited));
                    if (rest) return [start, ...rest];
                }
            }
            return null;
        }

        // Start from leaf nodes (fewest connections) for best path
        const sortedByDeg = [...block].sort((a, b) => adj[a].length - adj[b].length);
        let path = null;
        for (const start of sortedByDeg) {
            path = findPath(start, new Set());
            if (path) break;
        }
        if (!path) {
            // Fallback: sort by parent barycenter
            const withBary = block.map(pid => ({ pid, bary: memberParentBary(pid) }));
            withBary.sort((a, b) => {
                if (a.bary === null && b.bary === null) return 0;
                if (a.bary === null) return 1;
                if (b.bary === null) return -1;
                return a.bary - b.bary;
            });
            block.length = 0;
            withBary.forEach(item => block.push(item.pid));
            return;
        }

        // Orient the path: left end should have parents more to the left
        const firstB = memberParentBary(path[0]);
        const lastB = memberParentBary(path[path.length - 1]);
        if (firstB !== null && lastB !== null) {
            if (firstB > lastB) path.reverse();
        } else if (firstB !== null && lastB === null) {
            // Only first end has parents — put it on the side nearest its parents
            const midRef = (refOrder.length - 1) / 2;
            if (firstB > midRef) path.reverse();
        } else if (firstB === null && lastB !== null) {
            const midRef = (refOrder.length - 1) / 2;
            if (lastB < midRef) path.reverse();
        } else {
            // Neither has parents in the row above: orient based on children positions
            const childRefOrder = genOrder[g + 1] || [];
            function memberChildBary(pid) {
                const p = peopleMap[pid];
                let total = 0, cnt = 0;
                if (p.children) {
                    p.children.forEach(cid => {
                        if (peopleMap[cid] && genMap[cid] === g + 1) {
                            const idx = childRefOrder.indexOf(cid);
                            if (idx >= 0) { total += idx; cnt++; }
                        }
                    });
                }
                return cnt > 0 ? total / cnt : null;
            }
            const firstCB = memberChildBary(path[0]);
            const lastCB = memberChildBary(path[path.length - 1]);
            if (firstCB !== null && lastCB !== null) {
                if (firstCB > lastCB) path.reverse();
            } else {
                // Fallback: male-left-female-right for first pair
                if (peopleMap[path[0]].sex === 'female' && peopleMap[path[1]].sex === 'male') {
                    path.reverse();
                }
            }
        }

        block.length = 0;
        path.forEach(pid => block.push(pid));
    }

    // Count crossings between two generations
    function countCrossings(gTop, gBot) {
        const topOrder = genOrder[gTop];
        const botOrder = genOrder[gBot];
        // Build edge list: for each person in botOrder, find parents in topOrder
        const edges = [];
        botOrder.forEach((pid, botIdx) => {
            const p = peopleMap[pid];
            if (p.parents) {
                p.parents.forEach(ppid => {
                    if (peopleMap[ppid] && genMap[ppid] === gTop) {
                        const topIdx = topOrder.indexOf(ppid);
                        if (topIdx >= 0) edges.push({ top: topIdx, bot: botIdx });
                    }
                });
            }
        });
        // Count inversions: edge (t1,b1) crosses (t2,b2) if t1<t2 and b1>b2 or vice versa
        let crossings = 0;
        for (let i = 0; i < edges.length; i++) {
            for (let j = i + 1; j < edges.length; j++) {
                if ((edges[i].top - edges[j].top) * (edges[i].bot - edges[j].bot) < 0) {
                    crossings++;
                }
            }
        }
        return crossings;
    }

    // Alternating barycenter passes (top-down then bottom-up)
    for (let pass = 0; pass < 4; pass++) {
        // Top-down pass
        for (let g = 1; g <= maxGen; g++) {
            const blocks = buildCoupleBlocks(g);
            blocks.forEach(block => { block._bary = blockBarycenter(block, g, g - 1); });
            blocks.sort((a, b) => a._bary - b._bary);
            blocks.forEach(block => orderBlockInternal(block, g));
            genOrder[g] = blocks.flatMap(b => [...b]);
        }
        // Bottom-up pass
        for (let g = maxGen - 1; g >= 0; g--) {
            const blocks = buildCoupleBlocks(g);
            blocks.forEach(block => { block._bary = blockBarycenter(block, g, g + 1); });
            blocks.sort((a, b) => a._bary - b._bary);
            genOrder[g] = blocks.flatMap(b => [...b]);
        }
    }
    // Final top-down pass to settle
    for (let g = 1; g <= maxGen; g++) {
        const blocks = buildCoupleBlocks(g);
        blocks.forEach(block => { block._bary = blockBarycenter(block, g, g - 1); });
        blocks.sort((a, b) => a._bary - b._bary);
        blocks.forEach(block => orderBlockInternal(block, g));
        genOrder[g] = blocks.flatMap(b => [...b]);
    }

    // Apply internal ordering to gen 0 blocks (orients based on children positions)
    {
        const blocks = buildCoupleBlocks(0);
        blocks.forEach(block => orderBlockInternal(block, 0));
        genOrder[0] = blocks.flatMap(b => [...b]);
    }

    // Compute total sibling span at a generation (sum of index ranges for each family's children)
    function computeSiblingSpan(g) {
        let totalSpan = 0;
        const seenFam = new Set();
        families.forEach(fam => {
            if (fam.children.length < 2) return;
            const childGen = genMap[fam.children[0]];
            if (childGen !== g) return;
            const fk = fam.parents.join('+');
            if (seenFam.has(fk)) return;
            seenFam.add(fk);
            const indices = fam.children
                .map(cid => genOrder[g].indexOf(cid))
                .filter(idx => idx >= 0);
            if (indices.length >= 2) {
                totalSpan += Math.max(...indices) - Math.min(...indices);
            }
        });
        return totalSpan;
    }

    // Adjacent swap pass: try swapping neighbouring blocks to reduce crossings
    // Uses sibling span as tiebreaker when crossings are equal
    for (let g = 0; g <= maxGen; g++) {
        const refAbove = g > 0 ? g - 1 : null;
        const refBelow = g < maxGen ? g + 1 : null;
        if (refAbove === null && refBelow === null) continue;

        let improved = true;
        while (improved) {
            improved = false;
            const blocks = buildCoupleBlocks(g);
            for (let i = 0; i < blocks.length - 1; i++) {
                // Current crossings and sibling span
                let crossBefore = 0;
                if (refAbove !== null) crossBefore += countCrossings(refAbove, g);
                if (refBelow !== null) crossBefore += countCrossings(g, refBelow);
                const spanBefore = computeSiblingSpan(g);

                // Try swap
                const tmp = blocks[i]; blocks[i] = blocks[i + 1]; blocks[i + 1] = tmp;
                genOrder[g] = blocks.flatMap(b => [...b]);

                let crossAfter = 0;
                if (refAbove !== null) crossAfter += countCrossings(refAbove, g);
                if (refBelow !== null) crossAfter += countCrossings(g, refBelow);

                if (crossAfter < crossBefore) {
                    improved = true; // keep the swap — fewer crossings
                } else if (crossAfter === crossBefore) {
                    // Tiebreaker: prefer grouping siblings closer together
                    const spanAfter = computeSiblingSpan(g);
                    if (spanAfter < spanBefore) {
                        improved = true; // keep the swap — same crossings but siblings closer
                    } else {
                        // Undo swap
                        const tmp2 = blocks[i]; blocks[i] = blocks[i + 1]; blocks[i + 1] = tmp2;
                        genOrder[g] = blocks.flatMap(b => [...b]);
                    }
                } else {
                    // Undo swap — more crossings
                    const tmp2 = blocks[i]; blocks[i] = blocks[i + 1]; blocks[i + 1] = tmp2;
                    genOrder[g] = blocks.flatMap(b => [...b]);
                }
            }
        }
    }

    // --- Phase 6: Compute block widths bottom-up ---
    // groupW[pid] = width for the person's couple group + all descendants below
    // When a child has a partner whose descendants are in a different subtree,
    // only count that child's own layoutChildren contribution (not the partner's tree).
    const groupW = {};

    // Compute groupW for a person's couple group + all descendants below.
    function computeGroupW(pid) {
        if (groupW[pid] !== undefined) return groupW[pid];

        const groupMembers = getPartnerGroup(pid);

        // Header width for the couple/chain
        const headerW = groupMembers.length * NODE_W + (groupMembers.length - 1) * SPOUSE_GAP;

        // Gather children assigned to this group via layoutChildren
        const children = [];
        const childSet = new Set();
        groupMembers.forEach(gid => {
            (layoutChildren[gid] || []).forEach(cid => {
                if (!childSet.has(cid)) { childSet.add(cid); children.push(cid); }
            });
        });

        let totalW = headerW;
        if (children.length > 0) {
            const childGen = genMap[children[0]];
            const orderAtGen = genOrder[childGen] || [];
            children.sort((a, b) => orderAtGen.indexOf(a) - orderAtGen.indexOf(b));

            let childrenTotalW = 0;
            children.forEach(cid => childrenTotalW += computeGroupW(cid));
            if (children.length > 1) childrenTotalW += (children.length - 1) * H_GAP;

            totalW = Math.max(headerW, childrenTotalW);
        }

        // Assign same width to all group members (memoize)
        groupMembers.forEach(gid => { groupW[gid] = totalW; });

        return totalW;
    }

    // Compute bottom-up
    for (let g = maxGen; g >= 0; g--) {
        genOrder[g].forEach(pid => computeGroupW(pid));
    }

    // --- Phase 7: Assign positions top-down ---
    const positions = {};
    const placed = new Set();

    // Compute effective width for a group, excluding already-placed children
    function effectiveGroupW(pid) {
        // Transitively collect all unplaced partners (traverse through placed ones)
        const groupMembers = getPartnerGroup(pid, id => placed.has(id));
        const headerW = groupMembers.length * NODE_W + (groupMembers.length - 1) * SPOUSE_GAP;

        const children = [];
        const childSet = new Set();
        groupMembers.forEach(gid => {
            (layoutChildren[gid] || []).forEach(cid => {
                if (!childSet.has(cid) && !placed.has(cid)) { childSet.add(cid); children.push(cid); }
            });
        });

        if (children.length === 0) return headerW;

        let childrenTotalW = 0;
        children.forEach(cid => childrenTotalW += effectiveGroupW(cid));
        if (children.length > 1) childrenTotalW += (children.length - 1) * H_GAP;

        return Math.max(headerW, childrenTotalW);
    }

    function placeGroup(pid, left, gen) {
        if (placed.has(pid)) return;

        // Transitively collect all unplaced partners (traverse through placed ones)
        const groupMembers = getPartnerGroup(pid, id => placed.has(id));
        const totalW = effectiveGroupW(pid);
        const centerX = left + totalW / 2;
        const y = gen * (NODE_H + V_GAP) + NODE_H / 2;

        // Place the couple/chain header
        // Use the order from genOrder (set by crossing minimization) for internal ordering
        const orderAtThisGen = genOrder[gen] || [];
        const orderedMembers = [...groupMembers].sort((a, b) =>
            orderAtThisGen.indexOf(a) - orderAtThisGen.indexOf(b)
        );

        if (orderedMembers.length === 1) {
            positions[pid] = { x: centerX, y };
            placed.add(pid);
        } else {
            const chainW = orderedMembers.length * NODE_W + (orderedMembers.length - 1) * SPOUSE_GAP;
            const chainStart = centerX - chainW / 2;
            orderedMembers.forEach((id, idx) => {
                if (!placed.has(id)) {
                    positions[id] = { x: chainStart + idx * (NODE_W + SPOUSE_GAP) + NODE_W / 2, y };
                    placed.add(id);
                }
            });
        }

        // Gather children that still need placement
        const children = [];
        const childSet = new Set();
        groupMembers.forEach(gid => {
            (layoutChildren[gid] || []).forEach(cid => {
                if (!childSet.has(cid) && !placed.has(cid)) { childSet.add(cid); children.push(cid); }
            });
        });

        // Sort children by genOrder position
        const childGen = gen + 1;
        const orderAtGen = genOrder[childGen] || [];
        children.sort((a, b) => orderAtGen.indexOf(a) - orderAtGen.indexOf(b));

        if (children.length > 0) {
            const childWidths = children.map(cid => effectiveGroupW(cid));
            let childrenTotalW = childWidths.reduce((s, w) => s + w, 0)
                + (children.length - 1) * H_GAP;
            let cx = centerX - childrenTotalW / 2;
            children.forEach((cid, i) => {
                placeGroup(cid, cx, childGen);
                cx += childWidths[i] + H_GAP;
            });
        }
    }

    // Find all "layout roots" — people who are not assigned as a child to anyone.
    const layoutRoots = [];
    const rootGrouped = new Set();

    for (let g = 0; g <= maxGen; g++) {
        genOrder[g].forEach(pid => {
            if (assignedChild.has(pid) || rootGrouped.has(pid)) return;
            // Transitively collect all non-assignedChild partners into one root block.
            // Traverse through assignedChild partners (to find further roots)
            // but don't include them in the block.
            const block = getPartnerGroup(pid, id => assignedChild.has(id));
            block.forEach(id => rootGrouped.add(id));
            // Also mark assignedChild partners as grouped so they aren't re-processed
            getPartnerGroup(pid).forEach(id => rootGrouped.add(id));
            if (block.length > 0) {
                layoutRoots.push({ block, gen: g });
            }
        });
    }

    // Count subtree size to identify the main root
    function countSubtreeSize(block) {
        let size = 0;
        const visited = new Set();
        function walk(pid) {
            if (visited.has(pid)) return;
            visited.add(pid);
            size++;
            getAllPartners(pid).partnerIds.forEach(sid => {
                if (!visited.has(sid) && genMap[sid] !== undefined) { visited.add(sid); size++; }
            });
            (layoutChildren[pid] || []).forEach(cid => walk(cid));
        }
        block.forEach(pid => walk(pid));
        return size;
    }

    // Separate main root (largest subtree) from satellite roots
    layoutRoots.sort((a, b) => countSubtreeSize(b.block) - countSubtreeSize(a.block));
    const mainRootEntry = layoutRoots[0];
    const satelliteEntries = layoutRoots.slice(1);

    // Place the main root first (absorbs marry-in partners via placeGroup)
    placeGroup(mainRootEntry.block[0], 0, mainRootEntry.gen);

    // For satellite roots, find the already-placed descendant (bridge person)
    // that connects them to the main tree, and place the satellite near that person.
    function findBridgePerson(block) {
        function search(pid, visited) {
            if (visited.has(pid)) return null;
            visited.add(pid);
            if (placed.has(pid)) return pid;
            const p = peopleMap[pid];
            if (p && p.children) {
                for (const cid of p.children) {
                    if (peopleMap[cid]) {
                        const result = search(cid, visited);
                        if (result) return result;
                    }
                }
            }
            return null;
        }
        for (const pid of block) {
            const result = search(pid, new Set());
            if (result) return result;
        }
        return null;
    }

    // Place satellites strictly to the right of all existing nodes.
    // Attempting to interleave satellites near bridge persons causes
    // overlaps and broken parent-child alignment, so we place each
    // satellite cleanly to the right of the entire tree.
    // Sort by bridge person x so satellites appear in visual order.
    satelliteEntries.forEach(entry => {
        const bridge = findBridgePerson(entry.block);
        entry.bridgePerson = bridge;
        entry.bridgeX = bridge && positions[bridge] ? positions[bridge].x : Infinity;
    });
    satelliteEntries.sort((a, b) => a.bridgeX - b.bridgeX);

    satelliteEntries.forEach(({ block, gen }) => {
        const primaryPid = block[0];
        if (placed.has(primaryPid)) return;

        // Place this satellite to the right of everything currently placed
        const rightmostX = Object.values(positions).length > 0
            ? Math.max(...Object.values(positions).map(p => p.x + NODE_W / 2))
            : 0;
        placeGroup(primaryPid, rightmostX + H_GAP * 2, gen);
    });

    // Safety net: place any remaining unplaced people
    Object.keys(genMap).forEach(pid => {
        if (!placed.has(pid)) {
            const y = genMap[pid] * (NODE_H + V_GAP) + NODE_H / 2;
            const maxX = Object.values(positions).length > 0
                ? Math.max(...Object.values(positions).map(p => p.x + NODE_W / 2))
                : 0;
            positions[pid] = { x: maxX + H_GAP + NODE_W / 2, y };
            placed.add(pid);
        }
    });


    // Shift all positions so minimum x has a margin
    let minX = Infinity, maxX = -Infinity, maxY = 0;
    Object.values(positions).forEach(pos => {
        minX = Math.min(minX, pos.x - NODE_W / 2);
        maxX = Math.max(maxX, pos.x + NODE_W / 2);
        maxY = Math.max(maxY, pos.y + NODE_H / 2);
    });
    const margin = 30;
    if (minX < margin) {
        const shift = margin - minX;
        Object.values(positions).forEach(pos => { pos.x += shift; });
        maxX += margin - minX;
    }
    const treeW = maxX + margin;
    const treeH = maxY + margin;

    // === RENDERING with D3 ===

    const svg = d3.select("#tree-container").append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(d3.zoom().on("zoom", (event) => {
            inner.attr("transform", event.transform);
        }));

    addDropShadowFilter(svg);

    const inner = svg.append("g");

    // Center and scale the tree to fit
    const scaleX = width / treeW;
    const scaleY = height / treeH;
    const initialScale = Math.min(scaleX, scaleY, 1) * 0.9;
    const tx = (width - treeW * initialScale) / 2;
    const ty = 20;
    svg.call(d3.zoom().transform, d3.zoomIdentity.translate(tx, ty).scale(initialScale));
    inner.attr("transform", d3.zoomIdentity.translate(tx, ty).scale(initialScale));

    // --- Color palette for family connection lines ---
    // Each family (parent pair) gets a unique color for visual distinction
    const familyColorPalette = (() => {
        const neon = isNeonTheme();
        const colors = [];
        const count = 14;
        for (let i = 0; i < count; i++) {
            const hue = (i * 137.508 + 30) % 360; // golden angle for max separation
            if (neon) {
                colors.push(`hsl(${Math.round(hue)}, 100%, 65%)`);
            } else {
                colors.push(`hsl(${Math.round(hue)}, 70%, 55%)`);
            }
        }
        return colors;
    })();
    const familyColorMap = {};
    let nextFamColorIdx = 0;
    function getFamilyColor(famKey) {
        if (!familyColorMap[famKey]) {
            familyColorMap[famKey] = familyColorPalette[nextFamColorIdx % familyColorPalette.length];
            nextFamColorIdx++;
        }
        return familyColorMap[famKey];
    }

    // --- Draw family connection lines ---
    // Build family units from the data for line drawing (spouses AND co-parents)
    // Track bar offsets per generation pair to stagger overlapping bars
    const genPairBarCounter = {};
    const BAR_STAGGER = 10;
    const drawnFamilies = new Set();
    Object.values(peopleMap).forEach(person => {
        const { spouseIds, partnerIds } = getAllPartners(person.id);
        partnerIds.forEach(sid => {
            const famKey = [person.id, sid].sort().join('+');
            if (drawnFamilies.has(famKey)) return;
            drawnFamilies.add(famKey);

            const posA = positions[person.id];
            const posB = positions[sid];
            if (!posA || !posB) return;

            const isSpouse = spouseIds.includes(sid);
            const famColor = getFamilyColor(famKey);

            // Find children of this couple
            const kids = [];
            Object.values(peopleMap).forEach(child => {
                if (child.parents && child.parents.includes(person.id) && child.parents.includes(sid)) {
                    if (positions[child.id]) kids.push(child.id);
                }
            });

            const leftPos = posA.x < posB.x ? posA : posB;
            const rightPos = posA.x < posB.x ? posB : posA;
            const coupleY = (leftPos.y + rightPos.y) / 2;
            const junctionX = (posA.x + posB.x) / 2;

            // Couple line: solid for spouses, dashed for co-parents
            inner.append("line")
                .attr("x1", leftPos.x + NODE_W / 2).attr("y1", coupleY)
                .attr("x2", rightPos.x - NODE_W / 2).attr("y2", coupleY)
                .attr("stroke", famColor).attr("stroke-width", 2)
                .attr("stroke-dasharray", isSpouse ? "none" : "6,4");

            // Children connections
            if (kids.length > 0) {
                const sorted = kids.map(k => positions[k]).sort((a, b) => a.x - b.x);
                const childTopY = Math.min(...sorted.map(c => c.y - NODE_H / 2));
                // Stagger bars from different families between the same generation pair
                const parentGen = genMap[person.id];
                const childGen = genMap[kids[0]];
                const pairKey = parentGen + '-' + childGen;
                if (!genPairBarCounter[pairKey]) genPairBarCounter[pairKey] = 0;
                const staggerIdx = genPairBarCounter[pairKey]++;
                const barY = (coupleY + childTopY) / 2 - staggerIdx * BAR_STAGGER;

                // Vertical from junction to bar
                inner.append("line")
                    .attr("x1", junctionX).attr("y1", coupleY)
                    .attr("x2", junctionX).attr("y2", barY)
                    .attr("stroke", famColor).attr("stroke-width", 2);

                // Horizontal bar
                const barL = Math.min(sorted[0].x, junctionX);
                const barR = Math.max(sorted[sorted.length - 1].x, junctionX);
                if (barL !== barR) {
                    inner.append("line")
                        .attr("x1", barL).attr("y1", barY)
                        .attr("x2", barR).attr("y2", barY)
                        .attr("stroke", famColor).attr("stroke-width", 2);
                }

                // Vertical drops to each child
                sorted.forEach(cpos => {
                    inner.append("line")
                        .attr("x1", cpos.x).attr("y1", barY)
                        .attr("x2", cpos.x).attr("y2", cpos.y - NODE_H / 2)
                        .attr("stroke", famColor).attr("stroke-width", 2);
                });
            }
        });
    });

    // --- Draw single-parent connection lines ---
    // Handle parents who have children but no partner (children with only one known parent)
    Object.values(peopleMap).forEach(person => {
        if (!person.children || person.children.length === 0) return;
        const { partnerIds } = getAllPartners(person.id);
        if (partnerIds.length > 0) return; // already handled above
        const parentPos = positions[person.id];
        if (!parentPos) return;

        const kids = person.children.filter(cid => positions[cid]);
        if (kids.length === 0) return;

        const spFamColor = getFamilyColor('single-' + person.id);

        const sorted = kids.map(cid => positions[cid]).sort((a, b) => a.x - b.x);
        const parentBottomY = parentPos.y + NODE_H / 2;
        const childTopY = Math.min(...sorted.map(c => c.y - NODE_H / 2));
        // Stagger bars for single-parent families too
        const spParentGen = genMap[person.id];
        const spChildGen = genMap[person.children.find(cid => positions[cid])];
        const spPairKey = spParentGen + '-' + spChildGen;
        if (!genPairBarCounter[spPairKey]) genPairBarCounter[spPairKey] = 0;
        const spStaggerIdx = genPairBarCounter[spPairKey]++;
        const barY = (parentBottomY + childTopY) / 2 - spStaggerIdx * BAR_STAGGER;

        // Vertical from parent bottom to bar
        inner.append("line")
            .attr("x1", parentPos.x).attr("y1", parentBottomY)
            .attr("x2", parentPos.x).attr("y2", barY)
            .attr("stroke", spFamColor).attr("stroke-width", 2);

        // Horizontal bar
        const barL = Math.min(sorted[0].x, parentPos.x);
        const barR = Math.max(sorted[sorted.length - 1].x, parentPos.x);
        if (barL !== barR) {
            inner.append("line")
                .attr("x1", barL).attr("y1", barY)
                .attr("x2", barR).attr("y2", barY)
                .attr("stroke", spFamColor).attr("stroke-width", 2);
        }

        // Vertical drops to each child
        sorted.forEach(cpos => {
            inner.append("line")
                .attr("x1", cpos.x).attr("y1", barY)
                .attr("x2", cpos.x).attr("y2", cpos.y - NODE_H / 2)
                .attr("stroke", spFamColor).attr("stroke-width", 2);
        });
    });


    // --- Draw person nodes ---
    Object.entries(positions).forEach(([pid, pos]) => {
        const p = peopleMap[pid];
        if (!p) return;

        const group = inner.append("g")
            .attr("transform", `translate(${pos.x - NODE_W / 2}, ${pos.y - NODE_H / 2})`)
            .style("cursor", "pointer")
            .on("click", () => { window.location.href = personUrl(pid); });

        group.append("rect")
            .attr("width", NODE_W)
            .attr("height", NODE_H)
            .attr("rx", 5).attr("ry", 5)
            .attr("fill", getGenderColor(p.sex))
            .attr("stroke", getStrokeColor(p.sex))
            .attr("stroke-width", 2)
            .attr("filter", "url(#drop-shadow)");

        if (p.photo) {
            group.append("image")
                .attr("xlink:href", p.photo)
                .attr("x", 5).attr("y", 5)
                .attr("width", 50).attr("height", 50)
                .attr("preserveAspectRatio", "xMidYMid slice");
        }

        const textX = p.photo ? 65 : NODE_W / 2;
        const textAnchor = p.photo ? "start" : "middle";

        group.append("text")
            .attr("x", textX)
            .attr("y", NODE_H / 2 - 5)
            .attr("text-anchor", textAnchor)
            .text(p.name + " " + getGenderSymbol(p.sex))
            .attr("fill", cssVar('--node-text'))
            .style("font-size", "14px")
            .style("font-weight", "bold");

        group.append("text")
            .attr("x", textX)
            .attr("y", NODE_H / 2 + 15)
            .attr("text-anchor", textAnchor)
            .text(getLifeSpan(p))
            .attr("fill", cssVar('--node-subtext'))
            .style("font-size", "11px");
    });
}
