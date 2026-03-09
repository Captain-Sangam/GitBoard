# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Gitboard, please report it responsibly.

**Do not open a public issue.** Instead, use [GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) on this repository.

We will acknowledge receipt within 48 hours and aim to release a fix within 7 days for critical issues.

## Scope

Gitboard is a read-only dashboard. The main security-sensitive areas are:

- **Database connection** (`DATABASE_URL`) — ensure your PostgreSQL instance uses strong credentials and network restrictions.
- **API keys** (`AI_API_KEY`, `GITHUB_TOKEN`) — never commit these to version control. Use `.env` files locally and secrets management in production.
- **AI prompts** — the `/api/summarize` and `/api/profile-banner` routes send PR metadata to the Anthropic API. Review the prompts if your PR data contains sensitive information.

## Best Practices

- Never commit `.env` files. The `.gitignore` excludes them by default.
- Rotate credentials if you suspect they have been exposed.
- Use read-only database credentials for the web server — it only needs SELECT access.
- Restrict your GitHub token to the minimum scopes required (org read access).
