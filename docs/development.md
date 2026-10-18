# Development

Read [AGENTS.md](../AGENTS.md) for architecture boundaries and code conventions. Complete [Getting started](getting-started.md) before testing views that query data.

## Commands

Run web commands from the repository root:

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the locked web dependencies |
| `npm run dev -- --hostname 127.0.0.1` | Run local development on loopback |
| `npm run lint` | Check TypeScript and React code with ESLint |
| `npx tsc --noEmit` | Type-check the web app |
| `npm run build` | Create the production Next.js build |
| `npm start` | Serve the production build with Next.js |
| `ruff check jobs/` | Lint ingestion jobs |
| `ruff format --check jobs/` | Check Python formatting |

There is no dedicated automated test command in `package.json`. CI runs web type checking, linting and a production build, plus Ruff checks for the Python jobs. Explain any checks you could not complete in the PR.

CI pins Ruff to **0.17.1**. Install that version in your development environment (`python -m pip install ruff==0.17.1`) when running the Python checks. [`ruff.toml`](../ruff.toml) keeps suggestions compatible with the documented Python 3.10 minimum.

## Source layout

- `src/app/`: pages and HTTP route handlers
- `src/components/`: interface components; `ui/` holds shadcn-managed primitives
- `src/lib/`: shared PostgreSQL pool, queries, formatting and UI utilities
- `jobs/`: independent ingestion scripts and an optional Serverless deployment template
- `docs/`: user and maintainer guides; `images/` holds real app captures
- `logo.svg` and `logo.png`: the selected Branch Bars symbol and generated wordmark artwork

Keep database reads in the query layer. Use semantic styling tokens and preserve light/dark modes. Do not move GitHub ingestion into the web server.

## Documentation and images

Keep the root README short: centered logo, clear description, real screenshots, setup entry point and links to this documentation. Put detailed operation, architecture and deployment instructions in `docs/`, with entries in the [documentation index](README.md).

For documentation changes, check relative links, heading anchors, image paths and executable examples. Screenshots must come from the actual app using fictional data. Include useful alt text and state when an image is a cropped detail. Follow [screenshot provenance and branding](screenshots.md).

## Troubleshooting

### A parent directory is selected as the workspace root

If a parent checkout has another lockfile, Next.js can infer the wrong Turbopack root. If development then fails to resolve `tailwindcss`, use the existing Webpack mode:

```sh
npm run dev -- --webpack --hostname 127.0.0.1
```

The equivalent production build is `npm run build -- --webpack`. Do not remove another project's lockfile to work around this checkout's startup.

### Database connection or missing-table errors

The web client requires a TLS-enabled PostgreSQL server. A default plaintext local server will not work with the current pool configuration. Confirm both `meta.pull_requests` and `meta.github_profiles` exist using [Getting started](getting-started.md#create-the-database-tables).

### Local jobs ask for AWS credentials

This is the current implementation: ingestion reads Secrets Manager even when launched locally. Shell `GITHUB_TOKEN` or `DATABASE_URL` values do not override the secret. Check the selected AWS profile, secret region, secret keys and access permission. Never print the secret into an issue report.

### AI summaries are unavailable

An empty `AI_API_KEY` causes the AI endpoints to return `503`. Provider errors return `502`. Keep the key empty for demos and screenshot work; verify live provider behavior only when intentionally enabled for suitable data.
