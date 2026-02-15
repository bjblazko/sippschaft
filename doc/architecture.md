# Sippschaft -- Architecture (arc42)

> Chapters selected for relevance to this project's scope. Chapters 2 (Constraints), 8 (Crosscutting Concepts), 10 (Quality Requirements), and 12 (Glossary) are omitted as they add little value at this scale.

---

## 1. Introduction and Goals

### Requirements Overview

Sippschaft is a self-hosted family tree web app. Each family member is a folder containing a YAML metadata file, a Markdown biography, and optional assets (photos, documents). The app renders an interactive tree visualization and individual profile pages.

**Key functional requirements:**

| # | Requirement | Status |
|---|-------------|--------|
| F1 | Display an interactive family tree on the homepage | Done |
| F2 | Support two visualization modes (classic hierarchical, force-directed) | Done |
| F3 | Show person detail pages with photo, dates, biography, and relationships | Done |
| F4 | Load family data from person folders at startup | Done |
| F5 | Expose a JSON API for the frontend to consume | Done |
| F6 | Serve static assets (CSS, JS) and person data assets (photos) | Done |

### Quality Goals

| Priority | Quality Goal | Description |
|----------|-------------|-------------|
| 1 | Simplicity | Minimal dependencies, no database, no config. Clone and run. |
| 2 | Portability | Data is plain text files. Move the folder, move the tree. |
| 3 | Accessibility | Non-developers can add family members by editing Markdown. |

### Stakeholders

| Role | Expectations |
|------|-------------|
| Family Member (Browser) | Browse the tree, view profiles. No technical knowledge required. |
| Family Contributor (Editor) | Add/edit person files. Needs clear data format documentation. |
| Open Source User (Self-Hoster) | Fork, populate with own data, customize, and deploy. Needs clear project structure. |

See [personas.md](personas.md) for detailed persona descriptions.

---

## 3. Context and Scope

### System Context

```mermaid
C4Context
    title System Context -- Sippschaft

    Person(browser, "Family Member", "Browses the tree and views profiles")
    Person(editor, "Contributor", "Creates/edits person folders in data/")

    System(sippschaft, "Sippschaft", "Go web server serving the family tree app")

    System_Ext(filesystem, "File System", "data/{person}/ folders")

    Rel(browser, sippschaft, "HTTP", "Views tree and profiles")
    Rel(editor, filesystem, "Edits", "YAML, Markdown, photos")
    Rel(sippschaft, filesystem, "Reads", "Person data at startup")
```

### Boundary: What is inside vs. outside the system

| Inside | Outside |
|--------|---------|
| Go HTTP server | File system (data files, images) |
| HTML templates | User's browser |
| Static assets (CSS, JS, D3.js, layout engine) | |
| JSON API | |

---

## 4. Solution Strategy

| Decision | Rationale | ADR |
|----------|-----------|-----|
| Go standard library for HTTP | No framework overhead, single binary, zero config | [ADR-001](adr/001-go-stdlib.md) |
| Markdown files as data source | Human-readable, Git-friendly, no database | [ADR-002](adr/002-markdown-data.md) |
| D3.js + Sugiyama-style layout for visualization | D3 for SVG rendering/zoom, custom seven-phase genealogy-aware layout | [ADR-011](adr/011-sugiyama-layout.md) |
| Goldmark for Markdown rendering | CommonMark-compliant, actively maintained | [ADR-004](adr/004-goldmark.md) |
| Folder-per-person data structure | Co-locates metadata, biography, and assets | [ADR-006](adr/006-folder-per-person.md) |
| Static site export as ZIP | Single-request export, works offline via `file://` | [ADR-009](adr/009-static-export.md) |
| Client-side i18n | `data-i18n` attributes + JS translation layer, same pattern as theming | [ADR-010](adr/010-client-side-i18n.md) |

---

## 5. Building Block View

### Level 1: Top-Level Decomposition

```mermaid
block-beta
    columns 3

    block:frontend["Frontend (Browser)"]:3
        templates["HTML Templates\n(index.html, person.html)"]
        js["tree.js + theme.js + i18n.js"]
        css["style.css"]
    end

    space:3

    block:backend["Backend (Go)"]:3
        main["main.go\nHTTP Server & Handlers"]
        parser["parser/loader.go\nFolder + YAML Parser"]
        model_pkg["model/person.go\nPerson Struct"]
    end

    space:3

    block:data["Data Layer (File System)"]:3
        folders["data/{person}/\nperson.yaml + person.md"]
        avatars["data/{person}/\navatar.* + assets"]
        space
    end

    main --> parser
    parser --> model_pkg
    parser --> folders
    main --> templates
```

### Level 2: Go Packages

```mermaid
classDiagram
    class main {
        -people map~string, *Person~
        -peopleMux sync.RWMutex
        -templates *template.Template
        +main()
        +reload()
        +handleIndex(w, r)
        +handlePerson(w, r)
        +handleTreeAPI(w, r)
    }

    class Person {
        +ID string
        +Name string
        +Sex string
        +Birth string
        +Death string
        +Parents []string
        +Spouses []string
        +Children []string
        +Photo string
        +Content string
    }

    class parser {
        +LoadPeople(dataDir string) map~string, *Person~
        -loadPerson(folderPath, folderName string) *Person
        -findAvatar(folderPath string) string, bool
    }

    main --> parser : calls LoadPeople()
    parser --> Person : creates
    main --> Person : stores in map
```

---

## 6. Runtime View

### Scenario 1: Application Startup

```mermaid
sequenceDiagram
    participant Main as main.go
    participant Parser as parser.LoadPeople()
    participant FS as File System (data/)
    participant Templates as template.ParseGlob()

    Main->>Parser: LoadPeople("data")
    Parser->>FS: ReadDir(data/)
    loop For each person folder
        FS-->>Parser: person.yaml
        Parser->>Parser: yaml.Unmarshal() — parse YAML into Person
        FS-->>Parser: person.md
        Parser->>Parser: Set Content from Markdown
        Parser->>Parser: findAvatar() — scan for avatar.*
    end
    Parser-->>Main: map[string]*Person
    Main->>Main: Store in global `people` map
    Main->>Templates: ParseGlob("templates/*.html")
    Templates-->>Main: compiled templates
    Main->>Main: ListenAndServe(:port)
```

### Scenario 2: Homepage Tree Rendering

```mermaid
sequenceDiagram
    participant Browser
    participant Server as Go Server
    participant Layout as tree.js Layout Engine
    participant D3 as D3.js (client)

    Browser->>Server: GET /
    Server-->>Browser: index.html
    Browser->>Server: GET /static/js/d3.v7.min.js
    Server-->>Browser: D3.js (vendored)
    Browser->>Server: GET /api/tree
    Server-->>Browser: JSON (all people)
    alt Classic View (default)
        Browser->>Layout: renderClassicTree(data)
        Layout->>Layout: Assign generations (BFS)
        Layout->>Layout: Crossing minimisation (barycenter + swaps)
        Layout->>Layout: Compute widths bottom-up
        Layout->>Layout: Assign positions top-down
        Layout->>Layout: Place satellite families
        Layout->>D3: Render SVG nodes & colour-coded family lines
    else Force View
        Browser->>D3: Create force simulation
        D3-->>Browser: Animated SVG with drag & zoom
    end
```

### Scenario 3: Viewing a Person Profile

```mermaid
sequenceDiagram
    participant Browser
    participant Server as Go Server
    participant Goldmark

    Browser->>Server: GET /person/1982-05-20_doe_jane
    Server->>Server: Lookup folder ID in people map
    Server->>Goldmark: Convert person.Content (Markdown → HTML)
    Goldmark-->>Server: HTML string
    Server->>Server: Execute person.html template with Person + HTML
    Server-->>Browser: Rendered profile page
```

---

## 7. Deployment View

```mermaid
graph TD
    subgraph Host Machine
        subgraph Go Process
            A[HTTP Server :8080]
        end

        subgraph File System
            B["data/{person}/<br/>person.yaml + person.md + avatar.*"]
            D[static/css/style.css]
            E["static/js/<br/>tree.js, theme.js, i18n.js, d3.v7.min.js"]
            F[templates/*.html]
        end

        A -->|reads at startup| B
        A -->|serves /data/| B
        A -->|serves| D
        A -->|serves| E
        A -->|renders| F
    end

    subgraph User Browser
        G[Browser]
    end

    G -->|HTTP :8080| A
```

**Infrastructure requirements:**
- Any machine with Go installed (or a pre-built binary)
- No reverse proxy required (but recommended for production: nginx, Caddy)
- No database, no message queue, no external services, no internet access required
- Fully offline-capable: all dependencies (including D3.js) are vendored locally

**Pre-built release binaries:**
Pushing a `v*` tag triggers a GitHub Actions workflow that cross-compiles binaries for Linux (amd64), macOS (amd64, arm64), and Windows (amd64). Each release archive bundles the binary with `static/` and `templates/` so users can run Sippschaft without a Go toolchain. See [ADR-012](adr/012-github-actions-release.md).

---

## 9. Architecture Decisions

Recorded as individual ADR files in [doc/adr/](adr/):

| ADR | Title | Status |
|-----|-------|--------|
| [001](adr/001-go-stdlib.md) | Use Go standard library over a web framework | Accepted |
| [002](adr/002-markdown-data.md) | Markdown files as the data source (no database) | Accepted |
| [003](adr/003-d3-dagre.md) | D3.js for tree visualization (Dagre removed) | Superseded by 007 |
| [007](adr/007-custom-layout.md) | Custom genealogy layout replacing Dagre | Superseded by 011 |
| [011](adr/011-sugiyama-layout.md) | Sugiyama-style layout with satellite placement | Accepted |
| [004](adr/004-goldmark.md) | Goldmark for Markdown rendering | Accepted |
| [005](adr/005-yaml-frontmatter.md) | YAML frontmatter for person metadata | Superseded by 006 |
| [006](adr/006-folder-per-person.md) | Folder-per-person data structure | Accepted |
| [008](adr/008-theme-system.md) | CSS custom property theme system | Accepted |
| [009](adr/009-static-export.md) | Static site export as ZIP | Accepted |
| [010](adr/010-client-side-i18n.md) | Client-side i18n with `data-i18n` attributes | Accepted |
| [012](adr/012-github-actions-release.md) | Tag-triggered GitHub Actions release workflow | Accepted |

---

## 11. Risks and Technical Debt

| # | Risk / Debt | Severity | Description |
|---|-------------|----------|-------------|
| R1 | No data validation | Medium | Referenced IDs (parents, spouses, children) are not checked for existence. Broken references fail silently in the UI. |
| R2 | No tests | Medium | No unit or integration tests exist. Regressions can only be caught manually. |
| ~~R3~~ | ~~CDN dependency~~ | ~~Low~~ | ~~Resolved: D3.js is now vendored locally at `static/js/d3.v7.min.js`. The app is fully offline-capable.~~ |
| R4 | Unidirectional relationships | Medium | If Alice lists Bob as a child, Bob does not automatically list Alice as a parent. Both sides must be manually maintained, which is error-prone. |
| ~~R5~~ | ~~No hot reload of data~~ | ~~Low~~ | ~~Resolved: The server polls the data directory every 2 seconds and automatically reloads when files change.~~ |
| ~~R6~~ | ~~Hardcoded port~~ | ~~Low~~ | ~~Resolved: Port is now configurable via `--port` flag or `SIPPSCHAFT_PORT` env var (default 8080).~~ |
| R7 | ~~Dagre unmaintained~~ | ~~Low~~ | ~~Resolved: Dagre replaced with custom genealogy layout algorithm.~~ |
| R8 | Raw HTML injection | Low | Biography Markdown is rendered to HTML and inserted via `template.HTML` (unescaped). Safe as long as data files are author-controlled, but becomes a risk if user-submitted content is ever allowed. |
