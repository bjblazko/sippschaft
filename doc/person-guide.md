# Person Author Guide

How to add and edit people in Sippschaft.

## Quick Start

1. Create a folder in `data/` named `{birth-date}_{surname}_{firstname}` (all lowercase):

```
data/1982-05-20_doe_jane/
```

2. Add a `person.yaml` file with metadata:

```yaml
name: Jane Doe
sex: female
birth: "1982-05-20"
parents:
    - 1952-03-30_doe_frank
    - 1954-07-22_smith_alice
spouses:
    - 1980-01-01_doe_john
children:
    - 2010-01-01_doe_baby
```

3. Add a `person.md` file with the biography (plain Markdown, no frontmatter):

```markdown
Jane grew up in Smallville and studied journalism at KU.

## Career

She worked as a reporter for the Daily Planet for 15 years.
```

4. Optionally add a photo named `avatar.png`, `avatar.jpg`, or any other web image format.

The server auto-detects new files within a few seconds -- no restart needed.

## Folder Name Convention

The folder name serves as the person's unique ID and is used to reference them in relationships. The format is:

```
{date}_{surname}_{firstname}
```

- Use the **birth date** -- full (`1928-09-15`), year and month (`1928-09`), or year only (`1900`) are all supported
- Use the **birth surname** (maiden name), lowercase
- Use the **first name**, lowercase
- Separate parts with underscores

Examples:
- `1928-09-15_jones_margaret` (full date)
- `1928-09_jones_margaret` (year and month only)
- `1900_smith_walter` (year only)
- `2001-11-05_wei_li`

The folder name never changes, even if the person changes their name through marriage.

## person.yaml Reference

### Required Fields

| Field   | Type   | Description                          |
|---------|--------|--------------------------------------|
| `name`  | string | Primary display name (shown in tree) |
| `sex`   | string | `male`, `female`, or `diverse`       |
| `birth` | string | Birth date: `"1982-05-20"`, `"1982-05"`, or `"1982"` |

### Optional Fields

| Field      | Type     | Description                                  |
|------------|----------|----------------------------------------------|
| `death`    | string   | Death date (same formats as birth)           |
| `parents`  | list     | Folder names of parents                      |
| `spouses`  | list     | Folder names of spouses                      |
| `children` | list     | Folder names of children                     |
| `names`    | list     | Name history (see below)                     |
| `nicknames`| list     | Informal names, e.g. `["Maggie", "Nana Meg"]`|

### Relationships

Relationships reference other people by their folder name:

```yaml
parents:
    - 1952-03-30_doe_frank
    - 1954-07-22_smith_alice
spouses:
    - 1980-01-01_doe_john
children:
    - 2010-01-01_doe_baby
```

Use an empty list `[]` or omit the field if there are none.

**Important: relationships must be specified on both sides.** If Alice lists Bob as a child, then Bob's YAML must also list Alice as a parent. The tree visualization relies on both directions to draw connection lines correctly. For example:

```
Alice's person.yaml          Bob's person.yaml
children:                    parents:
    - bob_folder_name            - alice_folder_name
```

The same applies to spouses -- both partners must list each other.

### Name History

People change names through marriage, divorce, legal changes, or gender transition. Track these with the `names` list:

```yaml
name: Margaret Smith
names:
    - name: Margaret Jones
      type: birth
    - name: Margaret Smith
      type: married
      since: "1948"
nicknames:
    - Maggie
    - Nana Meg
```

Each entry in `names` has:

| Field   | Required | Description                                              |
|---------|----------|----------------------------------------------------------|
| `name`  | yes      | The full name                                            |
| `type`  | no       | `birth`, `married`, `divorced`, `chosen`, `legal`, `religious` |
| `since` | no       | Date or year when this name was adopted                  |

The list is ordered chronologically (earliest first). Dates are often unknown -- that's fine, just omit `since` and rely on the list order.

The top-level `name` field is the primary display name used in the tree and navigation. It doesn't need to match any entry in `names`.

### Minimal Example

A person with just the basics:

```yaml
name: Baby Doe
sex: female
birth: "2010-01-01"
parents:
    - 1980-01-01_doe_john
    - 1982-05-20_doe_jane
```

### Full Example

A person using all available fields:

```yaml
name: Margaret Smith
sex: female
birth: "1928-09-15"
death: "2010-02-14"
names:
    - name: Margaret Jones
      type: birth
    - name: Margaret Smith
      type: married
      since: "1948"
nicknames:
    - Maggie
    - Nana Meg
parents: []
spouses:
    - 1925-04-10_smith_harold
children:
    - 1950-05-15_smith_arthur
    - 1954-07-22_smith_alice
```

## person.md (Biography)

Write the biography in plain Markdown. No frontmatter or special syntax required.

```markdown
Margaret was born into a large family of bakers. She met Harold
at a county fair in 1947.

## Education

- **High School**: Mill Creek High, Class of 1946.

## Hobbies

- Baking (won Blue Ribbon 5 years in a row)
- Quilting
```

Note: If the markdown starts with a `# Heading` matching the person's name, it will be automatically stripped on the profile page to avoid showing the name twice.

You can reference images stored in the same folder:

```markdown
Here is a photo from the wedding:

![Wedding photo](wedding-1948.jpg)
```

## Photos

Place a profile photo in the person's folder named `avatar` with any common web image extension:

- `avatar.png`
- `avatar.jpg` / `avatar.jpeg`
- `avatar.webp`
- `avatar.gif`

Only one avatar is used. Additional images can be placed in the folder and referenced from `person.md`.

## Tips

- **Birth name as folder ID**: Always use the birth surname in the folder name, even if the person later changed their name. The folder name is a stable ID that never changes.
- **Partial dates**: Year-only (`"1900"`), year-month (`"1928-09"`), and full dates (`"1928-09-15"`) all work -- in both YAML fields and folder names.
- **Quote dates**: Always quote dates in YAML (`"1982-05-20"`) to prevent YAML from interpreting them as numbers or timestamps.
- **Hot reload**: The server detects file changes automatically. Just save your file and refresh the browser.
- **Relationships are one-directional**: If you add Alice as a parent of Bob, you should also add Bob as a child of Alice. Both sides need to be maintained manually.
