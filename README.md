# Sippschaft

A family tree web app that visualizes genealogy data as an interactive tree. Family members are defined as simple Markdown files, making it easy to build and maintain your family history.

## Documentation

- [Features & Roadmap](doc/features.md)
- [Architecture (arc42)](doc/architecture.md)
- [Vision & Principles](doc/vision.md)
- [Personas](doc/personas.md)
- [Architecture Decision Records](doc/adr/)

## Adding Family Members

Each person is a folder in `data/` named `{birth-date}_{surname}_{firstname}`:

```
data/
  1982-05-20_doe_jane/
    person.yaml     # structured metadata
    person.md       # biography (Markdown)
    avatar.png      # profile photo (optional)
```

**person.yaml:**

```yaml
name: Jane Doe
sex: female
birth: "1982-05-20"
death: ""
parents: ["1952-03-30_doe_frank", "1954-07-22_smith_alice"]
spouses: ["1980-01-01_doe_john"]
children: ["2010-01-01_doe_baby"]
```

**person.md:**

```markdown
# Jane Doe

A biography written in Markdown goes here.
```

Relationships reference other people by their folder name.

## Running the App

Make sure [Go](https://go.dev/) is installed, then:

```
go run main.go
```

Open [http://localhost:8080](http://localhost:8080) in your browser.
