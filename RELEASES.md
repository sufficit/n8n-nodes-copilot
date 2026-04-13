# Releases

Releases are triggered by pushing a git tag in the format `v*.*.*` (e.g., `v4.4.9`).
The workflow [`.github/workflows/build-and-release.yml`](.github/workflows/build-and-release.yml) runs automatically on tag push or via `workflow_dispatch`.

Release notes are stored in [`docs/`](docs/) as `RELEASE-<version>.md` files.
