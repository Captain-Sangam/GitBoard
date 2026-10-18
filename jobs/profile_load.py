"""
GitHub profile ingestion.
Reads unique authors from meta.pull_requests, fetches their GitHub profiles,
and upserts into meta.github_profiles.

Usage:
  python profile_load.py           # fetch/update profiles for all authors
  python profile_load.py --clear   # truncate table first, then reload
"""

import argparse

from db import bulk_upsert_profiles, get_unique_authors, truncate_profiles
from github_client import fetch_user_profile, get_github


def handler(event=None, context=None, clear=False):
    if clear:
        print("Truncating meta.github_profiles...")
        truncate_profiles()

    authors = get_unique_authors()
    print(f"Found {len(authors)} unique authors")

    g = get_github()
    profiles = []

    for login in authors:
        try:
            profile = fetch_user_profile(g, login)
            profiles.append(profile)
            name = profile["name"] or login
            print(f"  Fetched profile for {name} ({login})")
        # Continue with other authors when an individual profile cannot load.
        except Exception as e:  # noqa: BLE001
            print(f"  Error fetching profile for {login}: {e}")

    if profiles:
        upserted = bulk_upsert_profiles(profiles)
        print(f"\nProfile load complete. Upserted: {upserted}")
    else:
        print("\nNo profiles to upsert.")

    return {"upserted": len(profiles)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Load GitHub user profiles")
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Truncate the profiles table before loading",
    )
    args = parser.parse_args()
    handler(clear=args.clear)
