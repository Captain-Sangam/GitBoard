from datetime import timezone

from config import get_secret
from dateutil.relativedelta import relativedelta
from github import Github


def get_github():
    return Github(get_secret("GITHUB_TOKEN"))


def get_org_name():
    return get_secret("GITHUB_ORG")


def week_start(dt):
    """Monday of the week containing dt."""
    return (dt - relativedelta(days=dt.weekday())).date()


def month_start(dt):
    return dt.date().replace(day=1)


def fetch_repos(g, org_name):
    org = g.get_organization(org_name)
    return list(org.get_repos(type="all"))


def fetch_user_profile(g, login):
    """Fetch public GitHub profile fields for a single user."""
    user = g.get_user(login)
    return {
        "login": user.login,
        "name": user.name or "",
        "avatar_url": user.avatar_url or "",
        "bio": user.bio or "",
        "company": user.company or "",
        "location": user.location or "",
        "blog": user.blog or "",
        "twitter_username": user.twitter_username or "",
        "html_url": user.html_url,
    }


def fetch_merged_prs(repo, since=None):
    pulls = repo.get_pulls(state="closed", sort="updated", direction="desc")
    results = []

    for pr in pulls:
        if not pr.merged:
            continue

        merged_at = pr.merged_at
        if merged_at.tzinfo is None:
            merged_at = merged_at.replace(tzinfo=timezone.utc)

        if since and merged_at < since:
            break

        results.append(
            {
                "pr_number": pr.number,
                "repo_name": repo.name,
                "author": pr.user.login if pr.user else "unknown",
                "title": pr.title,
                "body": pr.body or "",
                "merged_at": merged_at,
                "additions": pr.additions,
                "deletions": pr.deletions,
                "files_changed": pr.changed_files,
                "commits": pr.commits,
                "week_start": week_start(merged_at),
                "month": month_start(merged_at),
            }
        )

    return results
