# Agents

Guidance for AI agents working in this codebase.

## Architecture

This repo has two independent components:

- **Web server** (`src/`) — Next.js 16 App Router, TypeScript, read-only against Postgres. Deployed as a Docker container with standalone output.
- **Data jobs** (`jobs/`) — Python scripts that ingest data from the GitHub API into Postgres. Deployed separately (Lambda, cron, etc.).

The two components share a database but no code. Do not import between them.

## Web Server Conventions

- Four pages:
  - `/` — monthly dashboard with team stats and leaderboard.
  - `/all-time` — yearly leaderboard with podium + composite scoring.
  - `/profile/[author]` — engineer profile with monthly activity (stats, weekly AI summaries, PR table). Has a "Highlights" button linking to the analysis page.
  - `/profile/[author]/analysis` — profile highlights page showing all-time contribution analysis (tenure, all-time stats, repo breakdown, activity timeline) with an AI-generated banner (roast/spotlight toggle).
- Clicking any engineer name in the Leaderboard or Podium navigates to `/profile/[author]` via Next.js `Link`.
- All API routes live in `src/app/api/` and are read-only GET handlers, except `/api/summarize` and `/api/profile-banner` which are POST. The `/api/all-time` route accepts a `?year=` param and returns yearly scored leaderboard data. The `/api/profile-analysis` route accepts `?author=` and returns all-time contribution analytics. The `/api/profile-banner` route accepts POST with analysis data + `tone` ("roast" or "spotlight") and returns an AI-generated profile narrative.
- Database queries go in `src/lib/queries.ts`. API routes call query functions, never raw SQL. The `computeScore()` function in queries.ts defines the all-time ranking formula. The `getProfileAnalysis()` function computes tenure, repo breakdown, activity timeline, and rankings from existing PR data.
- LOC is calculated as `additions + deletions` (total lines changed) in all queries.
- `src/lib/db.ts` exports a singleton Postgres pool — do not create additional pools.
- Styling uses Tailwind CSS v4 with shadcn/ui (New York style, neutral base). Use `cn()` from `src/lib/utils.ts` for conditional classes.
- Dark mode is handled by `next-themes` with class strategy. Theme variables are in `globals.css` under `:root` and `.dark`. Do not hardcode colors — use semantic tokens (`bg-background`, `text-foreground`, etc.).
- UI primitives (Button, Card, Table, Tabs, Progress, etc.) live in `src/components/ui/` and are managed by shadcn — avoid editing these directly.
- The `Leaderboard` component supports an optional `score` field — when present (all-time page), it shows a Score column and defaults to sorting by score.
- The `EngineerView` component accepts an `embedded` prop — when true, hides the profile card and back button (used inside the profile page).
- Page transitions use a CSS `animate-fade-in` class with a keyed wrapper div.

## Data Jobs Conventions

- Each job file (`initial_load.py`, `daily_load.py`, `profile_load.py`) exposes a `handler(event, context)` for Lambda compatibility.
- Database helpers are in `jobs/db.py`, GitHub API helpers in `jobs/github_client.py`.
- When running in Lambda, secrets come from AWS Secrets Manager via `jobs/config.py`. Locally, use environment variables.
- All data lives in the `meta` schema: `meta.pull_requests` and `meta.github_profiles`.
- Schema changes go in `jobs/create_table.sql`.

## General Rules

- Never commit `.env` or secrets. Use `.env.example` as the template.
- The Dockerfile produces a standalone Next.js image — keep `output: "standalone"` in `next.config.ts`.
- TypeScript formatting uses the default Next.js/ESLint config. Run `npm run lint` before committing.
- Python formatting and linting uses [Ruff](https://github.com/astral-sh/ruff). Run `ruff check jobs/` and `ruff format --check jobs/` before committing.

## Documentation and public imagery

- Keep the root README concise: centered `logo.svg`, tagline, real app screenshot, setup entry point and documentation links. Put detailed guides in `docs/` and maintain `docs/README.md` as the index.
- Public screenshots live in `docs/images/` and must use fictional, isolated demo data with AI disabled. Record their source, date and crops in `docs/screenshots.md`; never publish company data or credentials.
- The selected identity is Branch Bars: `logo.svg` is the native vector symbol and `logo.png` is the original generated wordmark artwork.
- Check commands against the implementation. In particular, ingestion currently reads AWS Secrets Manager even locally, the web pool requires TLS, and the checked-in SQL creates only the pull-request table. The setup guide documents the additional profile-table DDL.
- For documentation-only changes, validate local links, anchors, image paths and setup examples; do not report unrun live GitHub, AWS or AI checks as passed.
