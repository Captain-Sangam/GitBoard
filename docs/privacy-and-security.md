# Privacy and security

Report vulnerabilities according to the root [security policy](../SECURITY.md). Do not post credentials or private contribution data in public issues.

## Data stored and displayed

GitBoard stores GitHub pull-request metadata in PostgreSQL, including repository names, authors, titles, bodies, merge times and change counts. Imported profile fields include names, avatars, biographies, company, location, blog, social handle and GitHub profile links. The [architecture guide](architecture.md#database) describes the tables.

Repository and contributor information can be private even when it is summarized into counts. The app has no built-in sign-in, role-based access control or API rate limiting. Protect pages and API routes together using your deployment's access controls.

GitHub avatars are loaded from `avatars.githubusercontent.com` when a profile has an avatar URL. Building the app downloads the Geist fonts through Next.js.

## Credentials and database access

- The web app reads `DATABASE_URL` and optional `AI_API_KEY` from its runtime environment. Use read-only database credentials for it.
- The Python jobs read their database URL, GitHub token and organization from an AWS Secrets Manager secret, including during local runs. They need database write access and appropriate GitHub access.
- The current web pool requires TLS but sets `rejectUnauthorized: false`, so it does not verify the database server's certificate. Treat this as a deployment limitation; use a controlled network and review the client configuration against your security requirements.
- Keep actual `.env` files, database dumps, cloud secrets and tokens out of commits, screenshots and issue reports. The committed `.env.example` contains placeholders only.

## AI data flow

When `AI_API_KEY` is configured:

- Weekly summary requests send PR titles, repository names and up to 200 characters of each supplied PR body to Anthropic.
- Profile banners send the contributor's name and login, contribution dates, counts, rankings and top repository names to Anthropic.

Both routes call the Anthropic Messages API from the server. Provider usage can incur costs. Review the source prompts and your data-handling requirements before enabling these features for private repositories.

Leaving `AI_API_KEY` empty disables these provider calls; the endpoints return `503`. The statistics, tables and activity timeline remain available. The current UI can show fallback AI messages, so an AI banner is not evidence that a provider request succeeded.

## Public screenshots

Use an isolated database with fictional contributors, repositories and PRs. Keep AI disabled and review the rendered screens for credentials and real organizational information before publishing. The committed images follow this process; see [provenance](screenshots.md).
