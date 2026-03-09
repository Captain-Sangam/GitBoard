# Contributing to Gitboard

Thanks for your interest in contributing! This guide will help you get started.

## Getting Started

1. **Fork** the repository and clone your fork
2. Create a new branch from `main` for your work
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env` and fill in your values
5. Run the dev server: `npm run dev`

## Development Setup

### Web server (Next.js)

```bash
npm install
npm run dev
```

### Data jobs (Python)

```bash
cd jobs
pip install -r requirements.txt
```

### Database

You need a PostgreSQL database. Create the schema:

```bash
psql $DATABASE_URL -f jobs/create_table.sql
```

## Making Changes

### Branch naming

Use descriptive branch names:

- `feat/add-chart-view` — new features
- `fix/leaderboard-sort` — bug fixes
- `docs/update-readme` — documentation
- `refactor/query-layer` — code improvements

### Code style

- **TypeScript (web server):** Follow the existing ESLint config. Run `npm run lint` before committing.
- **Python (data jobs):** Follow PEP 8. The CI runs [Ruff](https://github.com/astral-sh/ruff) for linting and formatting.
- Use meaningful variable and function names.
- Avoid adding comments that just narrate what the code does.

### Architecture boundaries

- The web server (`src/`) and data jobs (`jobs/`) are independent — do not import between them.
- Database queries go in `src/lib/queries.ts`. API routes call query functions, never raw SQL.
- UI primitives in `src/components/ui/` are managed by shadcn — avoid editing these directly.
- Use semantic color tokens (`bg-background`, `text-foreground`, etc.) instead of hardcoded colors.

### Commit messages

Write clear, concise commit messages:

```
feat: add weekly activity chart to profile page

fix: correct LOC calculation for merge commits

docs: add Docker Compose example to README
```

Use the imperative mood ("add", not "added" or "adds").

## Pull Requests

1. Make sure your branch is up to date with `main`
2. Run lint and type checks:
   ```bash
   npm run lint
   npx tsc --noEmit
   ```
3. Test your changes locally
4. Open a PR with a clear description of what changed and why
5. Fill in the PR template

PRs are reviewed before merging. Please be patient and responsive to feedback.

## Reporting Bugs

Open an issue with:

- A clear description of the bug
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots if applicable
- Your environment (OS, Node version, browser)

## Requesting Features

Open an issue describing:

- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.
