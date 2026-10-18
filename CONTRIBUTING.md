# Contributing to GitBoard

Bug reports, documentation fixes and code contributions are welcome. Follow the [code of conduct](CODE_OF_CONDUCT.md), and report vulnerabilities through the [security policy](SECURITY.md).

## Setup

Follow [Getting started](docs/getting-started.md) to install dependencies, create both database tables and configure ingestion. The web app and Python jobs use different credential sources; putting job credentials in `.env` does not configure the current Secrets Manager-based importer.

Read [AGENTS.md](AGENTS.md) for architecture boundaries and the [development guide](docs/development.md) for commands, conventions and troubleshooting.

## Verify and submit

1. Create a descriptive branch from `main` and keep the change focused.
2. Run `npm run lint`, `npx tsc --noEmit` and `npm run build` for web changes. For Python changes, also run `ruff check jobs/` and `ruff format --check jobs/`. CI runs these checks.
3. Exercise changed behavior locally, using an isolated database when appropriate. Verify both themes for UI changes.
4. For documentation changes, check commands, relative links, heading anchors and image paths. Use real app captures with fictional data; see [screenshots and branding](docs/screenshots.md).
5. Open a pull request describing what changed, why it helps and which checks you ran. Include screenshots for visible interface changes, and state any verification limits.

## Issues and feature requests

For bugs, include steps to reproduce, expected and actual behavior, relevant runtime versions and sanitized logs. For feature requests, explain the problem and the workflow you want to improve. Do not include credentials, private repository content or real contributor data in public reports.

Contributions are licensed under the [MIT License](LICENSE).
