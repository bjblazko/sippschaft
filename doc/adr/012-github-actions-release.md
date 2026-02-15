# ADR-012: Tag-Triggered GitHub Actions Release Workflow

**Status:** Accepted

## Context

Sippschaft had no CI/CD pipeline. Users who want to run the app must clone the repository and build from source, which requires a Go toolchain. Providing pre-built binaries for common platforms would let users download and run Sippschaft without installing Go.

The app loads `static/` and `templates/` directories at runtime from the working directory (no `//go:embed`), so a release binary alone is not sufficient -- these directories must be bundled alongside it.

## Decision

Add a GitHub Actions workflow (`.github/workflows/release.yml`) triggered by pushing a `v*` tag. The workflow:

1. **Builds** the Go binary for four platform targets using a matrix strategy:
   - `linux/amd64`
   - `darwin/amd64` (Mac Intel)
   - `darwin/arm64` (Mac Apple Silicon)
   - `windows/amd64`
2. **Packages** each binary together with `static/` and `templates/` into an archive:
   - `.tar.gz` for Linux and macOS
   - `.zip` for Windows
   - Named `sippschaft-{tag}-{os}-{arch}.{ext}`
3. **Creates a GitHub Release** using `gh release create` with auto-generated release notes and attaches all archives.

Cross-compilation is handled by setting `GOOS` and `GOARCH` environment variables on `ubuntu-latest` runners. Binaries are stripped (`-ldflags "-s -w"`) to reduce size.

## Consequences

- Users can download a single archive from the GitHub Releases page, extract it, and run `./sippschaft` without installing Go.
- The `data/` directory is not included in the release archive -- users bring their own family data.
- Adding a new platform target requires only adding a row to the build matrix.
- The workflow uses `GITHUB_TOKEN` (automatically provided) for creating releases -- no additional secrets are needed.
- Release notes are auto-generated from commit history between tags. Manual notes can be edited after creation.
