"""
Daily incremental ingestion.
Fetches PRs merged in the last 48 hours across every repo in the GitHub org.

Credentials are always read from AWS Secrets Manager (see config.py),
including during local execution. Set SECRET_NAME and AWS_REGION to select
the secret, and configure an AWS identity authorized to read it.
The secret JSON supplies DATABASE_URL, GITHUB_TOKEN and GITHUB_ORG.
"""

import time
from datetime import datetime, timedelta, timezone

import profile_load
from db import bulk_upsert_prs
from github_client import fetch_merged_prs, fetch_repos, get_github, get_org_name


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
        # Preserve partial progress: one failed repo must not abort the batch.
        except Exception as e:  # noqa: BLE001
            print(f"  Error processing {repo.name}: {e}")

    print(f"\nDaily load complete. Total inserted: {total_inserted}")

    print("\n--- Refreshing GitHub profiles ---")
    profile_load.handler()

    elapsed_min = (time.monotonic() - start) / 60
    print(f"\nTotal runtime: {elapsed_min:.2f} minutes")

    return {"inserted": total_inserted}


if __name__ == "__main__":
    handler()
