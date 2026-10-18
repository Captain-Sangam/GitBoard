import psycopg2
from config import get_secret
from psycopg2.extras import execute_values


def get_connection():
    return psycopg2.connect(get_secret("DATABASE_URL"))


def get_unique_authors():
    """Return all distinct author logins from pull_requests."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT author FROM meta.pull_requests ORDER BY author")
        authors = [row[0] for row in cur.fetchall()]
        cur.close()
        return authors
    finally:
        conn.close()


def truncate_profiles():
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("TRUNCATE meta.github_profiles")
        conn.commit()
        cur.close()
    finally:
        conn.close()


def bulk_upsert_profiles(profiles):
    """Upsert GitHub profile rows, updating on conflict."""
    if not profiles:
        return 0

    conn = get_connection()
    try:
        cur = conn.cursor()
        rows = [
            (
                p["login"],
                p["name"],
                p["avatar_url"],
                p["bio"],
                p["company"],
                p["location"],
                p["blog"],
                p["twitter_username"],
                p["html_url"],
            )
            for p in profiles
        ]

        execute_values(
            cur,
            """
            INSERT INTO meta.github_profiles
                (login, name, avatar_url, bio, company, location,
                 blog, twitter_username, html_url)
            VALUES %s
            ON CONFLICT (login) DO UPDATE SET
                name = EXCLUDED.name,
                avatar_url = EXCLUDED.avatar_url,
                bio = EXCLUDED.bio,
                company = EXCLUDED.company,
                location = EXCLUDED.location,
                blog = EXCLUDED.blog,
                twitter_username = EXCLUDED.twitter_username,
                html_url = EXCLUDED.html_url,
                updated_at = NOW()
            """,
            rows,
            page_size=500,
        )

        upserted = cur.rowcount
        conn.commit()
        cur.close()
        return upserted
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def bulk_upsert_prs(prs):
    """Open a connection, bulk insert all PRs, close the connection."""
    if not prs:
        return 0

    conn = get_connection()
    try:
        cur = conn.cursor()
        rows = [
            (
                pr["pr_number"],
                pr["repo_name"],
                pr["author"],
                pr["title"],
                pr["body"],
                pr["merged_at"],
                pr["additions"],
                pr["deletions"],
                pr["files_changed"],
                pr["commits"],
                pr["week_start"],
                pr["month"],
            )
            for pr in prs
        ]

        execute_values(
            cur,
            """
            INSERT INTO meta.pull_requests
                (pr_number, repo_name, author, title, body,
                 merged_at, additions, deletions, files_changed, commits,
                 week_start, month)
            VALUES %s
            ON CONFLICT (repo_name, pr_number) DO NOTHING
            """,
            rows,
            page_size=500,
        )

        inserted = cur.rowcount
        conn.commit()
        cur.close()
        return inserted
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
