# Sippschaft

A family tree web app that visualizes genealogy data as an interactive tree. Family members are defined as simple Markdown files, making it easy to build and maintain your family history.

## Documentation

- [Person Author Guide](doc/person-guide.md) -- how to add and edit family members
- [Changelog](CHANGELOG.md)
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

See the [Person Author Guide](doc/person-guide.md) for the full YAML reference, name history, nicknames, and tips.

## Running the App

Make sure [Go](https://go.dev/) is installed, then:

```
go run main.go
```

Open [http://localhost:8080](http://localhost:8080) in your browser.
