<p align="center">
  <img src="logo.svg" width="144" height="144" alt="GitBoard logo: rising activity bars connected by commit nodes">
</p>

<h1 align="center">GitBoard</h1>

<p align="center"><strong>The story behind the commits.</strong></p>

A self-hosted engineering analytics dashboard for GitHub activity. Explore monthly team statistics, yearly leaderboards and contributor histories, with optional AI summaries to help put the activity in context.

![GitBoard in dark mode showing monthly team statistics and a sortable contributor leaderboard](docs/images/dashboard.png)

*The actual open-source app running locally with fictional contributors, repositories and pull requests.*

## Screenshots

<details>
<summary><strong>Yearly leaderboard</strong> — yearly totals and the top-three podium</summary>

![GitBoard in light mode showing yearly contribution totals and a gold, silver and bronze podium](docs/images/yearly-leaderboard.png)

</details>

<details>
<summary><strong>Contributor highlights</strong> — contribution history, repository reach and activity over time</summary>

![GitBoard contributor highlights showing tenure, contribution totals, repository breakdown and a monthly activity timeline](docs/images/contributor-highlights.png)

</details>

All screenshots use the same fictional local dataset. AI generation was disabled for the captures. See [screenshot provenance](docs/screenshots.md) for details.

## Setup and run

Requires **Node.js 20.9+**, **PostgreSQL 14+ with TLS**, and data loaded into the database. Importing GitHub activity also requires **Python 3.10+**, a GitHub token with access to the intended organization and repositories, and AWS Secrets Manager access for the current ingestion jobs. An Anthropic API key is optional.

```sh
git clone https://github.com/Captain-Sangam/GitBoard.git gitboard
cd gitboard
npm ci
cp .env.example .env
```

Follow [Getting started](docs/getting-started.md) to configure the database, create both required tables and import activity. Then, from the repository root:

```sh
npm run dev -- --hostname 127.0.0.1
```

Open [localhost:3000](http://localhost:3000). Select a month, open a contributor or switch to **Yearly Leaderboard**. The web app reads collected data; ingestion jobs run separately to keep it current.

GitBoard has no built-in sign-in or access control. Use it on a trusted local network, or put it behind authenticated access when deploying. AI features send selected contribution data to Anthropic when enabled. Read [privacy and security](docs/privacy-and-security.md) before connecting private repositories.

## Documentation and contributing

See [docs](docs/README.md) for setup, the user guide, architecture, development and deployment. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request, and report vulnerabilities through the [security policy](SECURITY.md).

GitBoard is available under the [MIT License](LICENSE).
