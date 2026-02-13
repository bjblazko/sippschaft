# Ideas

Future feature ideas and rough concepts. Nothing here is committed -- these are starting points for discussion and design.

---

## Guided Tour / Onboarding Wizard

**Problem:** First-time users land on the tree page with no explanation of how to interact with it. Controls, zoom, navigation, and the difference between Tree View and Node View are not self-explanatory.

**Idea:** A step-by-step guided tour that highlights one UI element at a time, dims the rest of the page, and shows a short explanation in a floating dialog. Similar to onboarding wizards in apps like Slack, Figma, or GitHub.

Possible steps in the tour:

1. **Tree View / Node View buttons** -- "Switch between a hierarchical tree layout and a physics-based node graph."
2. **Tree container (zoom & pan)** -- "Scroll to zoom in and out. Click and drag the background to pan."
3. **A person node** -- "Click any person to open their profile page with biography, dates, and family links."
4. **Theme selector** -- "Choose a visual style and light/dark mode. Your choice is saved automatically."
5. **Export button** -- "Download the entire family tree as a static site you can open without a server."

**Behavior:**

- Show automatically on first visit (track in `localStorage`, e.g. `sippschaft-tour-done`).
- A "Skip" button to dismiss immediately.
- A "Next" / "Back" navigation within the tour.
- The rest of the UI is dimmed or made semi-transparent with a spotlight cutout around the highlighted element.
- Optionally re-triggerable via a help button or keyboard shortcut.

**Open questions:**

- Build from scratch with vanilla JS/CSS, or use a library like [Shepherd.js](https://shepherdjs.dev/) or [Driver.js](https://driverjs.com/)?
- Should person profile pages have their own mini-tour?
- How to handle the tour on mobile where layout differs?
