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

function getGenderColor(sex) {
    const s = sex ? sex.toLowerCase() : '';
    if (s === 'male') return '#AED6F1'; // Light Blue
    if (s === 'female') return '#F5B7B1'; // Light Pink
    if (s === 'diverse') return '#D7BDE2'; // Light Purple
    return '#E0E0E0'; // Gray
}

function getStrokeColor(sex) {
    const s = sex ? sex.toLowerCase() : '';
    if (s === 'male') return '#3498db';
    if (s === 'female') return '#e74c3c';
    if (s === 'diverse') return '#9b59b6';
    return '#7f8c8d';
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
        .attr("stroke", d => d.type === "spouse" ? "#e74c3c" : "#999")
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
        .attr("stroke", d => getStrokeColor(d.sex))
        .attr("stroke-width", 2);

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
        .attr("fill", "#333");

    // Dates
    node.append("text")
        .attr("x", 30)
        .attr("y", 10)
        .text(d => d.lifeSpan)
        .style("font-size", "10px")
        .attr("fill", "#666");

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

    // Initialize Dagre graph
    var g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', nodesep: 70, ranksep: 50 });
    g.setDefaultEdgeLabel(function () { return {}; });

    const processedFamilies = new Set();

    // Add nodes for People
    Object.values(peopleMap).forEach(p => {
        // Increased height to fit dates
        g.setNode(p.id, {
            label: p.name,
            lifeSpan: getLifeSpan(p),
            sex: p.sex,
            photo: p.photo,
            width: 210,
            height: 60,
            type: 'person',
            id: p.id
        });
    });

    // Process Families (unions) to solve the "sibling alignment" and "spouse" issues
    Object.values(peopleMap).forEach(child => {
        if (child.parents && child.parents.length > 0) {
            // Sort parental IDs to create a unique family ID
            const parents = [...child.parents].sort();
            const familyId = "fam_" + parents.join("_");

            if (!processedFamilies.has(familyId)) {
                // Create a "Family" node (invisible small dot)
                g.setNode(familyId, { label: "", width: 10, height: 10, type: 'family' });
                processedFamilies.add(familyId);

                // Link Parents -> Family Node
                parents.forEach(parentId => {
                    if (peopleMap[parentId]) {
                        g.setEdge(parentId, familyId, { style: "stroke: #333; stroke-width: 2px;", arrow: false });
                    }
                });
            }

            // Link Family Node -> Child
            g.setEdge(familyId, child.id, { style: "stroke: #333; stroke-width: 2px;", arrow: true });
        }
    });

    // Fallback for spouses without children (so they are close together)
    Object.values(peopleMap).forEach(p => {
        if (p.spouses) {
            p.spouses.forEach(spouseId => {
                const parents = [p.id, spouseId].sort();
                const familyId = "fam_" + parents.join("_");
                if (!processedFamilies.has(familyId)) {
                    // Create empty family for childless couples
                    g.setNode(familyId, { label: "", width: 10, height: 10, type: 'family' });
                    processedFamilies.add(familyId);
                    g.setEdge(p.id, familyId, { style: "stroke: #333; stroke-width: 2px;" });
                    g.setEdge(spouseId, familyId, { style: "stroke: #333; stroke-width: 2px;" });
                }
            })
        }
    });


    dagre.layout(g);

    const svg = d3.select("#tree-container").append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(d3.zoom().on("zoom", (event) => {
            inner.attr("transform", event.transform);
        }));

    const inner = svg.append("g");

    // Initial transform to center roughly - improve later
    const initialScale = 0.75;
    inner.call(d3.zoom().transform, d3.zoomIdentity.translate((width - g.graph().width * initialScale) / 2, 20).scale(initialScale));


    // Draw edges
    g.edges().forEach(e => {
        const edge = g.edge(e);
        const points = edge.points;
        const line = d3.line()
            .x(d => d.x)
            .y(d => d.y)
            .curve(d3.curveBasis);
        // Using curveBasis for smoother lines, or custom implementation for orthogonal

        inner.append("path")
            .attr("d", line(points))
            .attr("stroke", "#333")
            .attr("stroke-width", 2)
            .attr("fill", "none");
    });

    // Draw nodes
    g.nodes().forEach(v => {
        const node = g.node(v);

        if (node.type === 'family') {
            inner.append("circle")
                .attr("cx", node.x)
                .attr("cy", node.y)
                .attr("r", 4)
                .attr("fill", "#333");
            return;
        }

        const group = inner.append("g")
            .attr("transform", `translate(${node.x - node.width / 2}, ${node.y - node.height / 2})`)
            .style("cursor", "pointer")
            .on("click", () => {
                window.location.href = `/person/${node.id}`;
            });

        group.append("rect")
            .attr("width", node.width)
            .attr("height", node.height)
            .attr("rx", 5)
            .attr("ry", 5)
            .attr("fill", getGenderColor(node.sex))
            .attr("stroke", getStrokeColor(node.sex))
            .attr("stroke", getStrokeColor(node.sex))
            .attr("stroke-width", 2);

        // Photo (Classic View)
        if (node.photo) {
            group.append("image")
                .attr("xlink:href", node.photo)
                .attr("x", 5)
                .attr("y", 5)
                .attr("width", 50)
                .attr("height", 50)
                .attr("preserveAspectRatio", "xMidYMid slice");
        }

        // Text Positioning
        const textX = node.photo ? 65 : node.width / 2;
        const textAnchor = node.photo ? "start" : "middle";

        // Name + Symbol
        group.append("text")
            .attr("x", textX)
            .attr("y", node.height / 2 - 5) // Shift up
            .attr("text-anchor", textAnchor)
            .text(node.label + " " + getGenderSymbol(node.sex))
            .attr("fill", "#333")
            .style("font-size", "14px")
            .style("font-weight", "bold");

        // Dates
        group.append("text")
            .attr("x", textX)
            .attr("y", node.height / 2 + 15) // Shift down
            .attr("text-anchor", textAnchor)
            .text(node.lifeSpan)
            .attr("fill", "#555")
            .style("font-size", "11px");
    });
}
