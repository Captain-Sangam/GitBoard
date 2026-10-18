# Getting started

GitBoard has two independent parts: a Next.js web app that reads PostgreSQL, and Python jobs that import GitHub activity. Running the web app does not create tables or import data.

## Requirements

- Node.js 20.9 or newer, with npm
- Python 3.10 or newer for ingestion jobs
- PostgreSQL 14 or newer; the web app's current database client requires TLS
- A GitHub token with access to the organization and repositories you intend to import, including any required organization authorization
- AWS credentials authorized to read the ingestion secret from Secrets Manager
- Optional: an Anthropic API key for generated summaries and profile narratives

## Install

```sh
git clone https://github.com/Captain-Sangam/GitBoard.git gitboard
cd gitboard
npm ci
cp .env.example .env
```

Edit `.env` for the **web app**:

```dotenv
DATABASE_URL=postgresql://user:password@database.example:5432/gitboard
AI_API_KEY=
```

Replace the example database address and credentials with your own. Leave `AI_API_KEY` empty to keep provider calls disabled. Next.js loads this file automatically; `psql` and the Python jobs do not.

## Create the database tables

Create a PostgreSQL database using your provider or PostgreSQL administration tools. Set `DATABASE_URL` in the shell you use for schema setup, using a role authorized to create the schema and tables. This can be different from the web app's read-only role. Then run from the repository root:

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f jobs/create_table.sql
```

The checked-in schema creates `meta.pull_requests`, but does not yet create `meta.github_profiles`. Both the dashboard and profile importer use that second table. For a fresh database, create it before importing data:

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE IF NOT EXISTS meta.github_profiles (
  login TEXT PRIMARY KEY,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  company TEXT,
  location TEXT,
  blog TEXT,
  twitter_username TEXT,
  html_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SQL
```

Use a database role with `SELECT` permission on the `meta` tables for the web app. The importer needs separate write permissions. See [deployment](deployment.md) for the process boundary and [privacy and security](privacy-and-security.md) for connection details.

## Configure the ingestion jobs

The current [`jobs/config.py`](../jobs/config.py) **always reads AWS Secrets Manager**, including when a job runs on your laptop. It does not read `DATABASE_URL`, `GITHUB_TOKEN` or `GITHUB_ORG` directly from `.env` or the shell.

Create a Secrets Manager secret containing these JSON keys:

```json
{
  "DATABASE_URL": "postgresql://importer:password@database.example:5432/gitboard",
  "GITHUB_TOKEN": "replace-with-your-token",
  "GITHUB_ORG": "your-organization"
}
```

Set the secret's name and region in the job's environment:

```sh
export SECRET_NAME=your-gitboard-secret
export AWS_REGION=your-secret-region
```

The defaults are `gitboard-job` and `us-west-2`. Configure an AWS identity with `secretsmanager:GetSecretValue` for that secret and, if its encryption key requires it, the corresponding KMS decrypt permission. Boto3 uses its normal AWS credential chain; set `AWS_PROFILE` when selecting a local profile. Creating cloud resources may incur charges.

Do not put actual credentials in documentation, tracked files or issue reports.

## Import activity

From the repository root:

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r jobs/requirements.txt
python jobs/initial_load.py
```

The initial loader retrieves merged pull requests from the configured organization, stores them in PostgreSQL and then loads GitHub profile metadata for the collected authors. Runtime depends on organization size and GitHub API limits. Check the logs for per-repository or per-profile errors; the loaders can continue after individual failures.

Refresh the collected data separately from the web process:

```sh
python jobs/daily_load.py
python jobs/profile_load.py
```

`daily_load.py` requests the last 48 hours of merged activity and also refreshes profiles. Schedule it at an interval appropriate for your data needs. `profile_load.py` can refresh profiles independently. Its optional `--clear` flag truncates the profiles table first; ordinary refreshes do not require that flag.

## Run the dashboard

From the repository root, in a shell with Node.js available:

```sh
npm run dev -- --hostname 127.0.0.1
```

Open [localhost:3000](http://localhost:3000). The latest available month is selected after the app loads its month list. See the [user guide](user-guide.md) for navigation and [development](development.md#troubleshooting) if startup fails.

For production, follow [deployment](deployment.md). For public images and demos, use fictional data as described in [screenshot provenance](screenshots.md).
