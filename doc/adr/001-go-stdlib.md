# ADR 001: Use Go Standard Library Over a Web Framework

## Status

Accepted

## Context

The app needs an HTTP server to serve pages, static files, and a JSON API. Go has a capable standard library (`net/http`) but there are also popular frameworks like Gin, Echo, Fiber, and Chi that provide routing, middleware, and convenience features.

## Decision

Use `net/http` from the Go standard library with `http.ServeMux` for routing. No third-party web framework.

## Consequences

**Positive:**
- Zero external dependencies for the HTTP layer
- Smaller binary, faster compilation
- No framework version churn or breaking API changes
- Easy for contributors to understand -- just standard Go
- Aligns with the project principle of simplicity

**Negative:**
- No built-in middleware chaining (logging, CORS, etc.) -- must be added manually if needed
- Path parameter extraction is manual (e.g. `r.URL.Path[len("/person/"):]`)
- No automatic request validation or binding

**Neutral:**
- Go 1.22+ improved `ServeMux` with method-based routing and path parameters, which could be adopted later without adding a framework
