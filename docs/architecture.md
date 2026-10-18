# Architecture

GitBoard has two independent components that share a PostgreSQL database. There are no imports between the web app and ingestion jobs.

```text
GitHub API → Python ingestion jobs → PostgreSQL meta tables → Next.js API → Browser
                    ↑                                      ↓
          AWS Secrets Manager                     Anthropic (optional AI)
```

| Component | Responsibility | Runtime |
| --- | --- | --- |
| Web app (`src/`) | Read collected activity, serve dashboard pages and request optional AI summaries | Next.js 16, React 19, TypeScript |
| Data jobs (`jobs/`) | Retrieve merged pull requests and GitHub profile metadata, then write them to PostgreSQL | Python, PyGithub, psycopg2, Boto3 |

## Web app

- [`src/lib/db.ts`](../src/lib/db.ts) exports the shared PostgreSQL connection pool. It requires TLS and currently disables certificate verification.
- [`src/lib/queries.ts`](../src/lib/queries.ts) owns activity queries, profile lookups, yearly scoring and contribution analysis.
- [`src/app/api/`](../src/app/api/) validates requests and delegates database reads to query functions. The two AI routes request Anthropic responses.
- [`src/components/`](../src/components/) contains the leaderboard, podium, date selectors, stat cards and contributor views.
- Tailwind CSS v4 and shadcn/ui supply the interface. Theme variables live in [`globals.css`](../src/app/globals.css); `next-themes` manages theme selection.

The web app makes database reads. It does not run ingestion jobs, apply schema migrations or write generated summaries into PostgreSQL.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Monthly team totals and sortable leaderboard |
| `/all-time` | Year selector, yearly totals, podium and composite-score leaderboard |
| `/profile/[author]` | Contributor profile, monthly metrics, weekly summaries and PR activity |
| `/profile/[author]/analysis` | All-time Highlights, repository reach, activity timeline and optional AI banner |

## API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/months` | GET | Available months with imported data |
| `/api/team` | GET | Monthly totals, leaderboard and profiles (`month`) |
| `/api/engineer` | GET | Monthly contributor activity and profile (`author`, `month`) |
| `/api/all-time` | GET | Yearly totals, profiles and scored leaderboard (`year`) |
| `/api/profile-analysis` | GET | All-time contributor analysis (`author`) |
| `/api/summarize` | POST | Optional AI summary for supplied PR metadata |
| `/api/profile-banner` | POST | Optional AI narrative for supplied contribution facts and tone |

## Data jobs

The initial and daily loaders list repositories in the configured GitHub organization and import merged pull requests. The initial loader retrieves historical data; the daily loader requests a 48-hour window. Both finish by refreshing contributor profile metadata. Each job also exposes a Lambda-compatible `handler` function.

[`jobs/config.py`](../jobs/config.py) caches an AWS Secrets Manager JSON secret within the process. `SECRET_NAME` and `AWS_REGION` select the secret; the jobs use its `DATABASE_URL`, `GITHUB_TOKEN` and `GITHUB_ORG` values even during local execution.

[`jobs/db.py`](../jobs/db.py) inserts pull requests with `ON CONFLICT (repo_name, pr_number) DO NOTHING` and upserts profiles by login. Existing PR rows are not updated on conflict. The interface's freshness depends on when imports last ran successfully.

## Database

- `meta.pull_requests` stores repository and PR identifiers, author, title, body, merge time, additions, deletions, files changed, commits and derived date buckets. The schema also has an `ai_summary` column, but current AI routes do not persist output there.
- `meta.github_profiles` stores GitHub profile fields and supports importer updates through `updated_at`.

The checked-in [`create_table.sql`](../jobs/create_table.sql) creates only the pull-request table and its indexes. [Getting started](getting-started.md#create-the-database-tables) supplies the required profile-table setup for a fresh database.

Read the [privacy and security guide](privacy-and-security.md) for deployment boundaries and external data flows.
