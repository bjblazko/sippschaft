let currentData = null;
let currentView = 'classic'; // 'force' or 'classic'

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

    fetch('/api/tree')
        .then(response => response.json())
        .then(data => {
            console.log("Data fetched", data);
            currentData = data;
            renderTree();
        })
        .catch(error => console.error('Error fetching tree data:', error));

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

    // Drop shadow filter
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "drop-shadow")
        .attr("x", "-20%").attr("y", "-20%").attr("width", "140%").attr("height", "140%");
    filter.append("feDropShadow")
        .attr("dx", 0).attr("dy", 2).attr("stdDeviation", 3)
        .attr("flood-color", "rgba(0,0,0,0.2)");

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
        window.location.href = `/person/${d.id}`;
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

function renderClassicTree(peopleMap) {
    const { width, height } = getContainerSize();
    const NODE_W = 210, NODE_H = 60, H_GAP = 40, V_GAP = 80, SPOUSE_GAP = 20;

    // === LAYOUT: Custom genealogy tree algorithm ===

    // 1. Find root person (most descendants, no parents)
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

    // 2. Build tree by following children (avoid duplicates)
    const treeChildren = {};
    const inTree = new Set();
    function buildTree(pid) {
        if (inTree.has(pid)) return;
        inTree.add(pid);
        treeChildren[pid] = [];
        const p = peopleMap[pid];
        if (p.children) {
            p.children.forEach(cid => {
                if (peopleMap[cid] && !inTree.has(cid)) {
                    treeChildren[pid].push(cid);
                    buildTree(cid);
                }
            });
        }
    }
    buildTree(rootId);

    // 3. For each tree person, group their tree-children by spouse
    function childrenBySpouse(pid) {
        const children = treeChildren[pid] || [];
        const groups = {};
        children.forEach(cid => {
            const child = peopleMap[cid];
            if (!child || !child.parents) return;
            const other = child.parents.find(p => p !== pid && peopleMap[p]);
            const key = other || '__none__';
            if (!groups[key]) groups[key] = [];
            groups[key].push(cid);
        });
        return groups;
    }

    // 4. Compute subtree widths (bottom-up)
    const widthCache = {};
    function subtreeW(pid) {
        if (widthCache[pid] !== undefined) return widthCache[pid];
        const p = peopleMap[pid];
        const groups = childrenBySpouse(pid);
        const spouseIds = (p.spouses || []).filter(s => peopleMap[s]);

        if (spouseIds.length === 0 && Object.keys(groups).length === 0) {
            widthCache[pid] = NODE_W;
            return NODE_W;
        }

        // For each spouse, compute the family width
        const famWidths = [];
        spouseIds.forEach(sid => {
            const kids = groups[sid] || [];
            const coupleW = NODE_W * 2 + SPOUSE_GAP;
            let kidsW = 0;
            if (kids.length > 0) {
                kidsW = kids.reduce((s, c) => s + subtreeW(c), 0) + (kids.length - 1) * H_GAP;
            }
            famWidths.push(Math.max(coupleW, kidsW));
        });

        // Handle children with unknown/single parent
        const singleKids = groups['__none__'] || [];
        if (singleKids.length > 0) {
            const kidsW = singleKids.reduce((s, c) => s + subtreeW(c), 0) + (singleKids.length - 1) * H_GAP;
            famWidths.push(Math.max(NODE_W, kidsW));
        }

        if (famWidths.length === 0) {
            // Has spouses but no children at all: just couple width
            widthCache[pid] = NODE_W * 2 + SPOUSE_GAP;
            return widthCache[pid];
        }

        let total;
        if (famWidths.length > 1) {
            // Multi-spouse: lay out all children as one group
            const coupleChainW = (spouseIds.length + 1) * NODE_W + spouseIds.length * SPOUSE_GAP;
            let allKidsW = 0;
            let firstKid = true;
            spouseIds.forEach(sid => {
                (groups[sid] || []).forEach(cid => {
                    if (!firstKid) allKidsW += H_GAP;
                    allKidsW += subtreeW(cid);
                    firstKid = false;
                });
            });
            total = Math.max(coupleChainW, allKidsW);
        } else {
            total = famWidths.reduce((a, b) => a + b, 0);
        }
        widthCache[pid] = total;
        return total;
    }
    subtreeW(rootId);

    // 5. Assign positions top-down
    const positions = {};
    const placed = new Set();

    function placeSubtree(pid, left, top) {
        if (placed.has(pid)) return;
        const p = peopleMap[pid];
        const totalW = widthCache[pid] || NODE_W;
        const centerX = left + totalW / 2;
        const groups = childrenBySpouse(pid);
        const spouseIds = (p.spouses || []).filter(s => peopleMap[s]);

        if (spouseIds.length === 0) {
            // Single person (no spouse)
            positions[pid] = { x: centerX, y: top + NODE_H / 2 };
            placed.add(pid);
            const singleKids = groups['__none__'] || [];
            if (singleKids.length > 0) {
                const kidsW = singleKids.reduce((s, c) => s + subtreeW(c), 0) + (singleKids.length - 1) * H_GAP;
                let cx = centerX - kidsW / 2;
                singleKids.forEach(cid => {
                    placeSubtree(cid, cx, top + NODE_H + V_GAP);
                    cx += subtreeW(cid) + H_GAP;
                });
            }
            return;
        }

        if (spouseIds.length === 1) {
            // Single spouse
            const sid = spouseIds[0];
            const sp = peopleMap[sid];
            // Male on left, female on right
            let leftId = pid, rightId = sid;
            if (p.sex === 'female' && sp.sex === 'male') { leftId = sid; rightId = pid; }
            else if (p.sex === 'male') { leftId = pid; rightId = sid; }
            else if (sp.sex === 'male') { leftId = sid; rightId = pid; }

            if (!placed.has(leftId)) {
                positions[leftId] = { x: centerX - SPOUSE_GAP / 2 - NODE_W / 2, y: top + NODE_H / 2 };
                placed.add(leftId);
            }
            if (!placed.has(rightId)) {
                positions[rightId] = { x: centerX + SPOUSE_GAP / 2 + NODE_W / 2, y: top + NODE_H / 2 };
                placed.add(rightId);
            }

            const kids = groups[sid] || [];
            if (kids.length > 0) {
                const kidsW = kids.reduce((s, c) => s + subtreeW(c), 0) + (kids.length - 1) * H_GAP;
                let cx = centerX - kidsW / 2;
                kids.forEach(cid => {
                    placeSubtree(cid, cx, top + NODE_H + V_GAP);
                    cx += subtreeW(cid) + H_GAP;
                });
            }
            return;
        }

        // Multiple spouses: place couple chain centered, all children as one group below
        const numInChain = spouseIds.length + 1; // spouses + the person
        const coupleChainW = numInChain * NODE_W + (numInChain - 1) * SPOUSE_GAP;
        const chainStartX = centerX - coupleChainW / 2;

        // Chain order: [first spouse, person, second spouse, ...]
        const chain = [spouseIds[0], pid, ...spouseIds.slice(1)];
        chain.forEach((id, idx) => {
            if (!placed.has(id)) {
                positions[id] = {
                    x: chainStartX + idx * (NODE_W + SPOUSE_GAP) + NODE_W / 2,
                    y: top + NODE_H / 2
                };
                placed.add(id);
            }
        });

        // Collect ALL children across all spouses in order
        const allKids = [];
        spouseIds.forEach(sid => {
            (groups[sid] || []).forEach(cid => allKids.push(cid));
        });

        if (allKids.length > 0) {
            const allKidsW = allKids.reduce((s, c) => s + subtreeW(c), 0) + (allKids.length - 1) * H_GAP;
            let cx = centerX - allKidsW / 2;
            allKids.forEach(cid => {
                placeSubtree(cid, cx, top + NODE_H + V_GAP);
                cx += subtreeW(cid) + H_GAP;
            });
        }
    }

    placeSubtree(rootId, 0, 0);

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

    // Drop shadow filter
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "drop-shadow")
        .attr("x", "-20%").attr("y", "-20%").attr("width", "140%").attr("height", "140%");
    filter.append("feDropShadow")
        .attr("dx", 0).attr("dy", 2).attr("stdDeviation", 3)
        .attr("flood-color", "rgba(0,0,0,0.2)");

    const inner = svg.append("g");

    // Center and scale the tree to fit
    const scaleX = width / treeW;
    const scaleY = height / treeH;
    const initialScale = Math.min(scaleX, scaleY, 1) * 0.9;
    const tx = (width - treeW * initialScale) / 2;
    const ty = 20;
    svg.call(d3.zoom().transform, d3.zoomIdentity.translate(tx, ty).scale(initialScale));
    inner.attr("transform", d3.zoomIdentity.translate(tx, ty).scale(initialScale));

    // --- Draw family connection lines ---
    // Build family units from the data for line drawing
    const drawnFamilies = new Set();
    Object.values(peopleMap).forEach(person => {
        if (!person.spouses) return;
        person.spouses.forEach(sid => {
            const famKey = [person.id, sid].sort().join('+');
            if (drawnFamilies.has(famKey)) return;
            drawnFamilies.add(famKey);

            const posA = positions[person.id];
            const posB = positions[sid];
            if (!posA || !posB) return;

            // Find children of this couple
            const kids = [];
            Object.values(peopleMap).forEach(child => {
                if (child.parents && child.parents.includes(person.id) && child.parents.includes(sid)) {
                    if (positions[child.id]) kids.push(child.id);
                }
            });

            const leftPos = posA.x < posB.x ? posA : posB;
            const rightPos = posA.x < posB.x ? posB : posA;
            const spouseY = (leftPos.y + rightPos.y) / 2; // center height
            const junctionX = (posA.x + posB.x) / 2;

            // Spouse line: right edge of left box → left edge of right box, at center height
            inner.append("line")
                .attr("x1", leftPos.x + NODE_W / 2).attr("y1", spouseY)
                .attr("x2", rightPos.x - NODE_W / 2).attr("y2", spouseY)
                .attr("stroke", cssVar('--line-color')).attr("stroke-width", 1.5);

            // Children connections
            if (kids.length > 0) {
                const sorted = kids.map(k => positions[k]).sort((a, b) => a.x - b.x);
                const childTopY = Math.min(...sorted.map(c => c.y - NODE_H / 2));
                const barY = (spouseY + childTopY) / 2;

                // Vertical from junction to bar
                inner.append("line")
                    .attr("x1", junctionX).attr("y1", spouseY)
                    .attr("x2", junctionX).attr("y2", barY)
                    .attr("stroke", cssVar('--line-color')).attr("stroke-width", 1.5);

                // Horizontal bar
                const barL = Math.min(sorted[0].x, junctionX);
                const barR = Math.max(sorted[sorted.length - 1].x, junctionX);
                if (barL !== barR) {
                    inner.append("line")
                        .attr("x1", barL).attr("y1", barY)
                        .attr("x2", barR).attr("y2", barY)
                        .attr("stroke", cssVar('--line-color')).attr("stroke-width", 1.5);
                }

                // Vertical drops to each child
                sorted.forEach(cpos => {
                    inner.append("line")
                        .attr("x1", cpos.x).attr("y1", barY)
                        .attr("x2", cpos.x).attr("y2", cpos.y - NODE_H / 2)
                        .attr("stroke", cssVar('--line-color')).attr("stroke-width", 1.5);
                });
            }
        });
    });

    // --- Draw single-parent connection lines ---
    // Handle parents who have children but no spouse (or children with only one known parent)
    Object.values(peopleMap).forEach(person => {
        if (!person.children || person.children.length === 0) return;
        if (person.spouses && person.spouses.length > 0) return; // already handled above
        const parentPos = positions[person.id];
        if (!parentPos) return;

        const kids = person.children.filter(cid => positions[cid]);
        if (kids.length === 0) return;

        const sorted = kids.map(cid => positions[cid]).sort((a, b) => a.x - b.x);
        const parentBottomY = parentPos.y + NODE_H / 2;
        const childTopY = Math.min(...sorted.map(c => c.y - NODE_H / 2));
        const barY = (parentBottomY + childTopY) / 2;

        // Vertical from parent bottom to bar
        inner.append("line")
            .attr("x1", parentPos.x).attr("y1", parentBottomY)
            .attr("x2", parentPos.x).attr("y2", barY)
            .attr("stroke", cssVar('--line-color')).attr("stroke-width", 1.5);

        // Horizontal bar
        const barL = Math.min(sorted[0].x, parentPos.x);
        const barR = Math.max(sorted[sorted.length - 1].x, parentPos.x);
        if (barL !== barR) {
            inner.append("line")
                .attr("x1", barL).attr("y1", barY)
                .attr("x2", barR).attr("y2", barY)
                .attr("stroke", cssVar('--line-color')).attr("stroke-width", 1.5);
        }

        // Vertical drops to each child
        sorted.forEach(cpos => {
            inner.append("line")
                .attr("x1", cpos.x).attr("y1", barY)
                .attr("x2", cpos.x).attr("y2", cpos.y - NODE_H / 2)
                .attr("stroke", cssVar('--line-color')).attr("stroke-width", 1.5);
        });
    });

    // --- Draw person nodes ---
    Object.entries(positions).forEach(([pid, pos]) => {
        const p = peopleMap[pid];
        if (!p) return;

        const group = inner.append("g")
            .attr("transform", `translate(${pos.x - NODE_W / 2}, ${pos.y - NODE_H / 2})`)
            .style("cursor", "pointer")
            .on("click", () => { window.location.href = `/person/${pid}`; });

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
