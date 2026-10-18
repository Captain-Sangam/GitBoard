# Deployment

Deploy the web server and ingestion jobs separately. Both need network access to PostgreSQL, but the web app does not need a GitHub token or AWS Secrets Manager access.

Prepare the schema and initial import using [Getting started](getting-started.md). The database must support TLS for the current web client.

## Web configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string for a role with read access to `meta` tables |
| `AI_API_KEY` | No | Anthropic API key for optional summaries and profile narratives |

Use your runtime's secret injection for production. Keep `.env` files out of source control and container build contexts.

## Node server

```sh
npm ci
npm run build
npm start -- --hostname 127.0.0.1
```

The app runs on port 3000 by default. Configure the runtime environment before starting it. The build downloads the Geist fonts through Next.js, so building requires access to the font source.

## Docker

The multi-stage [Dockerfile](../Dockerfile) builds the web app and runs its Next.js standalone server as a non-root user. Keep `output: "standalone"` in [`next.config.ts`](../next.config.ts).

The Dockerfile copies `public/` into the runner, but the current repository has no tracked public directory. Create the empty directory in your local build context first:

```sh
mkdir -p public
docker build -t gitboard .
```

Create an untracked runtime environment file, such as `.env.local`, containing `DATABASE_URL` and an optional `AI_API_KEY`. Pass it at runtime:

```sh
docker run --rm --name gitboard \
  -p 127.0.0.1:3000:3000 \
  --env-file .env.local \
  gitboard
```

The container's database hostname must be reachable from inside the container; container `localhost` refers to the container itself. The image serves the web app only. It does not run the Python jobs or apply migrations.

## Ingestion jobs

Install [`jobs/requirements.txt`](../jobs/requirements.txt) and run the jobs manually, under a scheduler, or in an appropriate Python runtime. All three scripts expose a Lambda-compatible `handler` function.

| Setting | Source | Purpose |
| --- | --- | --- |
| `SECRET_NAME` | Job environment | Secrets Manager secret name; defaults to `gitboard-job` |
| `AWS_REGION` | Job environment | Secret region; defaults to `us-west-2` |
| AWS credentials | Boto3 credential chain or runtime role | Permission to read the selected secret |
| `DATABASE_URL` | Secret JSON | Database connection for the importer |
| `GITHUB_TOKEN` | Secret JSON | GitHub access for the intended organization and repositories |
| `GITHUB_ORG` | Secret JSON | GitHub organization to import |

The [Serverless template](../jobs/serverless.yaml) defines a daily Lambda schedule. Review its IAM policy, region, network settings, database reachability, secret selection and packaging before deploying it. It references `SECRET_NAME` for IAM configuration but does not explicitly forward that variable into the Lambda environment; custom secret names must be supplied to the function environment as well. The default name is used by `config.py` otherwise.

For local execution and initial loading, see [Getting started](getting-started.md#configure-the-ingestion-jobs). Review logs for individual import failures and schedule refreshes independently of web restarts.

## Access boundary

GitBoard has no built-in authentication, authorization or API rate limiting. Bind it to loopback for local use. For shared deployment, put both pages and API routes behind authenticated network or proxy access, and serve traffic over HTTPS.

Enabling AI also enables requests that can incur provider charges. Read [privacy and security](privacy-and-security.md) before making the dashboard available to others.
