"""
Daily incremental ingestion.
Fetches PRs merged in the last 48 hours across every repo in the GitHub org.

When running in Lambda, secrets are loaded from AWS Secrets Manager (see config.py).
Locally, set these environment variables:
  DATABASE_URL   - PostgreSQL connection string
  GITHUB_TOKEN   - GitHub personal access token
  GITHUB_ORG     - GitHub organization name
"""

import time
from datetime import datetime, timedelta, timezone
from db import bulk_upsert_prs
from github_client import get_github, get_org_name, fetch_repos, fetch_merged_prs
import profile_load


def handler(event=None, context=None):
    start = time.monotonic()

    g = get_github()
    org_name = get_org_name()

    since = datetime.now(timezone.utc) - timedelta(hours=48)

    repos = fetch_repos(g, org_name)
    print(f"Found {len(repos)} repositories in {org_name}")
    print(f"Fetching PRs merged since {since.isoformat()}")

    total_inserted = 0

    for repo in repos:
        print(f"Processing {repo.name}...")
        try:
            prs = fetch_merged_prs(repo, since=since)
            print(f"  Found {len(prs)} merged PRs")

            if prs:
                inserted = bulk_upsert_prs(prs)
                total_inserted += inserted
                print(f"  Inserted: {inserted}")
        except Exception as e:
            print(f"  Error processing {repo.name}: {e}")

    print(f"\nDaily load complete. Total inserted: {total_inserted}")

    print("\n--- Refreshing GitHub profiles ---")
    profile_load.handler()

    elapsed_min = (time.monotonic() - start) / 60
    print(f"\nTotal runtime: {elapsed_min:.2f} minutes")

    return {"inserted": total_inserted}


if __name__ == "__main__":
    handler()
