# Personas

## 1. Family Member (Browser)

**Who:** A non-technical relative -- a parent, grandparent, cousin -- who wants to explore the family tree.

**Goals:**
- Browse the interactive tree and find people they know
- View a person's profile with photo, dates, and biography
- Navigate between related people (parents, children, spouses)

**Needs:**
- Simple, intuitive UI that works in any browser
- No login, no setup -- just open a link
- Readable names, dates, and photos at a glance

**Frustrations:**
- Complex genealogy software with steep learning curves
- Having to install desktop applications

---

## 2. Family Contributor (Editor)

**Who:** A family member (possibly with minimal technical skills) who maintains and extends the data.

**Goals:**
- Add new family members by creating Markdown files
- Update existing entries (dates, bios, photos)
- Keep the tree accurate and up to date

**Needs:**
- Clear, documented file format (frontmatter fields, naming conventions)
- Immediate feedback when changes are made (hot reload)
- Forgiving format -- reasonable defaults when fields are missing

**Frustrations:**
- Opaque database schemas
- Needing to learn a programming language to contribute

---

## 3. Open Source User (Self-Hoster)

**Who:** A developer or hobbyist who forks the project to build their own family tree.

**Goals:**
- Clone the repo, populate it with their own data, and run it
- Customize the look and feel (CSS, templates)
- Potentially contribute features back upstream

**Needs:**
- Clear project structure and documentation
- Easy local development setup (just `go run`)
- Well-separated concerns (data, templates, logic)

**Frustrations:**
- Undocumented projects that require reverse-engineering
- Heavy dependencies or complex build pipelines
