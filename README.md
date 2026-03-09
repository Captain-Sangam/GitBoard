# Gitboard

Engineering analytics dashboard that aggregates GitHub PR activity across an organization and presents monthly team statistics, developer rankings, a yearly leaderboard with composite scoring, AI-generated weekly summaries, and per-engineer profile analysis pages. Includes dark/light mode and smooth page transitions.

![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Monthly dashboard** — team-wide stat cards (PRs, LOC, active repos, engineers) with a sortable leaderboard
- **Yearly leaderboard** — podium for top 3, composite score rankings across the entire year
- **Engineer profiles** — monthly stats with ranks, weekly AI-generated summaries, PR activity table
- **Profile analysis** — all-time contribution highlights, tenure tracking, repo breakdown, activity timeline, AI-generated roast/spotlight banners
- **Dark / light mode** with smooth page transitions

## Architecture

```
GitHub API  -->  Python Jobs    -->  PostgreSQL  -->  Next.js Server  -->  Dashboard
                 (cron / Lambda)     (meta schema)   (read-only)            |
                                                                       Anthropic API
                                                                     (on-demand summaries)
```

| Component | Technology | Deployment |
|---|---|---|
| **Web server** (`src/`) | Next.js 16, TypeScript | Docker container |
| **Data jobs** (`jobs/`) | Python | Lambda, cron, or standalone |

The server is read-only — it queries the database and generates AI summaries on the fly. The Python jobs handle all data ingestion and run separately.

All data lives in the `meta` schema (`meta.pull_requests` and `meta.github_profiles`).

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.10+
- PostgreSQL 14+
- A GitHub personal access token with org read access
- (Optional) An [Anthropic API key](https://console.anthropic.com/) for AI summaries

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/gitboard.git
cd gitboard
npm install
```

### 2. Set up the database

Create a PostgreSQL database, then run the schema migration:

```bash
psql $DATABASE_URL -f jobs/create_table.sql
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values. See [Environment Variables](#environment-variables) for details.

### 4. Load data

```bash
cd jobs
pip install -r requirements.txt

# One-time full historical load
python initial_load.py

# Fetch GitHub profile avatars / metadata
python profile_load.py
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

### Web server

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AI_API_KEY` | No | Anthropic API key for AI summaries (starts with `sk-ant-`) |

### Data jobs

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `GITHUB_TOKEN` | Yes | GitHub personal access token with org read access |
| `GITHUB_ORG` | Yes | GitHub organization name to ingest data from |

When running in AWS Lambda, secrets can be fetched from AWS Secrets Manager via `config.py`. Set `SECRET_NAME` and `AWS_REGION` to override defaults.

## Docker

```bash
docker build -t gitboard .
docker run -p 3000:3000 \
  -e DATABASE_URL="your-connection-string" \
  -e AI_API_KEY="sk-ant-..." \
  gitboard
```

## Data Jobs

The `jobs/` directory is a standalone Python package. You can deploy it however you like — Lambda, ECS, cron, or run manually.

### Initial load (run once)

Fetches all merged PRs across every repo in the org:

```bash
python initial_load.py
```

### Daily load (run on a schedule)

Fetches PRs merged in the last 48 hours:

```bash
python daily_load.py
```

### Profile load

Fetches GitHub profiles for all unique PR authors:

```bash
python profile_load.py           # fetch/update all profiles
python profile_load.py --clear   # truncate table first, then reload
```

All three expose a `handler(event, context)` function for Lambda compatibility.

### Serverless deployment (optional)

A `serverless.yaml` template is included for deploying the daily job to AWS Lambda. Customize the VPC, IAM, and schedule settings for your environment:

```bash
cd jobs
npm install
npx sls deploy
```

## Pages

| Route | Description |
|---|---|
| `/` | Monthly team dashboard — stat cards, sortable leaderboard |
| `/all-time` | Yearly leaderboard — year selector, podium, composite score rankings |
| `/profile/[author]` | Engineer profile — monthly stats, weekly AI summaries, PR table |
| `/profile/[author]/analysis` | Profile highlights — AI banner, tenure, all-time stats, repo breakdown, activity timeline |

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/months` | GET | Available months with data |
| `/api/team` | GET | Monthly team stats + leaderboard |
| `/api/engineer` | GET | Engineer stats, profile, and PR list for a month |
| `/api/all-time` | GET | Yearly stats + scored leaderboard (`?year=` param) |
| `/api/profile-analysis` | GET | All-time contribution analytics (`?author=` param) |
| `/api/profile-banner` | POST | AI-generated profile narrative (`tone`: "roast" or "spotlight") |
| `/api/summarize` | POST | On-demand AI weekly summaries |

## Yearly Scoring

The yearly leaderboard ranks engineers by a composite score:

```
score = (PRs × 5) + (LOC ÷ 100) + (repos × 10)
```

- **PRs × 5** — shipping is the strongest signal
- **LOC ÷ 100** — total lines changed (additions + deletions)
- **Repos × 10** — cross-repo breadth

## AI Features

**Weekly summaries** are generated on-the-fly when viewing an engineer's monthly activity. The server groups PRs by week and calls the Anthropic API (Claude) to produce a concise summary.

**Profile banners** on the highlights page generate a personalized narrative from all-time contribution data. Two tones are available: "Roast" (lighthearted comedy roast) and "Spotlight" (celebratory employee spotlight). Both are generated on-demand and cached client-side.

Requires `AI_API_KEY` to be set. The dashboard works without it — AI features are simply disabled.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
