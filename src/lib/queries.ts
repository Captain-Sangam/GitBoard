import { pool } from "./db";
import { startOfMonth, endOfMonth } from "date-fns";

export async function getAvailableMonths(): Promise<Date[]> {
  const { rows } = await pool.query(
    `SELECT DISTINCT month FROM meta.pull_requests ORDER BY month DESC`
  );
  return rows.map((r: { month: Date }) => r.month);
}

export async function getTeamStats(month: Date) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);

  const { rows } = await pool.query(
    `SELECT
      COUNT(DISTINCT author) AS engineers,
      COUNT(DISTINCT repo_name) AS repos,
      COUNT(*) AS total_prs,
      COALESCE(SUM(additions + deletions), 0) AS lines_added
    FROM meta.pull_requests
    WHERE merged_at >= $1 AND merged_at <= $2`,
    [start, end]
  );

  const r = rows[0];
  return {
    engineers: Number(r.engineers),
    repos: Number(r.repos),
    totalPrs: Number(r.total_prs),
    linesAdded: Number(r.lines_added),
  };
}

export async function getLeaderboard(month: Date) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);

  const { rows } = await pool.query(
    `SELECT
      author,
      COUNT(*) AS prs,
      COALESCE(SUM(additions + deletions), 0) AS loc,
      COUNT(DISTINCT repo_name) AS repos
    FROM meta.pull_requests
    WHERE merged_at >= $1 AND merged_at <= $2
    GROUP BY author
    ORDER BY prs DESC`,
    [start, end]
  );

  return rows.map((r: { author: string; prs: string; loc: string; repos: string }, i: number) => ({
    rank: i + 1,
    author: r.author,
    prs: Number(r.prs),
    loc: Number(r.loc),
    repos: Number(r.repos),
  }));
}

export async function getEngineerStats(author: string, month: Date) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);

  const { rows } = await pool.query(
    `SELECT
      COUNT(*) AS prs,
      COALESCE(SUM(additions + deletions), 0) AS lines_added,
      COUNT(DISTINCT repo_name) AS repos
    FROM meta.pull_requests
    WHERE author = $1
      AND merged_at >= $2 AND merged_at <= $3`,
    [author, start, end]
  );

  const r = rows[0];
  const leaderboard = await getLeaderboard(month);
  const rank = leaderboard.findIndex((e) => e.author === author) + 1;

  const sortedByPrs = [...leaderboard].sort((a, b) => b.prs - a.prs);
  const sortedByLoc = [...leaderboard].sort((a, b) => b.loc - a.loc);
  const sortedByRepos = [...leaderboard].sort((a, b) => b.repos - a.repos);

  return {
    prs: Number(r.prs),
    linesAdded: Number(r.lines_added),
    repos: Number(r.repos),
    rank,
    totalEngineers: leaderboard.length,
    prRank: sortedByPrs.findIndex((e) => e.author === author) + 1,
    locRank: sortedByLoc.findIndex((e) => e.author === author) + 1,
    reposRank: sortedByRepos.findIndex((e) => e.author === author) + 1,
  };
}

export async function getEngineerPRs(author: string, month: Date) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);

  const { rows } = await pool.query(
    `SELECT
      repo_name, pr_number, title, body,
      additions, files_changed, commits, merged_at, week_start
    FROM meta.pull_requests
    WHERE author = $1
      AND merged_at >= $2 AND merged_at <= $3
    ORDER BY merged_at DESC`,
    [author, start, end]
  );

  return rows;
}

export interface GithubProfile {
  login: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  twitter_username: string | null;
  html_url: string;
}

export async function getProfile(login: string): Promise<GithubProfile | null> {
  const { rows } = await pool.query(
    `SELECT login, name, avatar_url, bio, company, location, blog, twitter_username, html_url
     FROM meta.github_profiles WHERE login = $1`,
    [login]
  );
  return rows[0] ?? null;
}

export async function getProfileMap(logins: string[]): Promise<Record<string, GithubProfile>> {
  if (logins.length === 0) return {};

  const { rows } = await pool.query(
    `SELECT login, name, avatar_url, bio, company, location, blog, twitter_username, html_url
     FROM meta.github_profiles WHERE login = ANY($1)`,
    [logins]
  );

  const map: Record<string, GithubProfile> = {};
  for (const r of rows) {
    map[r.login] = r;
  }
  return map;
}

export function computeScore(prs: number, loc: number, repos: number): number {
  return Math.round((prs * 5) + (loc / 100) + (repos * 10));
}

export async function getAvailableYears(): Promise<number[]> {
  const { rows } = await pool.query(
    `SELECT DISTINCT EXTRACT(YEAR FROM merged_at)::int AS year
     FROM meta.pull_requests
     ORDER BY year DESC`
  );
  return rows.map((r: { year: number }) => r.year);
}

export async function getYearlyLeaderboard(year: number) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);

  const { rows } = await pool.query(
    `SELECT
      author,
      COUNT(*) AS prs,
      COALESCE(SUM(additions + deletions), 0) AS loc,
      COUNT(DISTINCT repo_name) AS repos
    FROM meta.pull_requests
    WHERE merged_at >= $1 AND merged_at <= $2
    GROUP BY author`,
    [start, end]
  );

  const entries = rows.map((r: { author: string; prs: string; loc: string; repos: string }) => {
    const prs = Number(r.prs);
    const loc = Number(r.loc);
    const repos = Number(r.repos);
    return {
      rank: 0,
      author: r.author,
      prs,
      loc,
      repos,
      score: computeScore(prs, loc, repos),
    };
  });

  entries.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
  entries.forEach((e: { rank: number }, i: number) => { e.rank = i + 1; });

  return entries;
}

export async function getYearlyStats(year: number) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);

  const { rows } = await pool.query(
    `SELECT
      COUNT(DISTINCT author) AS engineers,
      COUNT(DISTINCT repo_name) AS repos,
      COUNT(*) AS total_prs,
      COALESCE(SUM(additions + deletions), 0) AS lines_added
    FROM meta.pull_requests
    WHERE merged_at >= $1 AND merged_at <= $2`,
    [start, end]
  );

  const r = rows[0];
  return {
    engineers: Number(r.engineers),
    repos: Number(r.repos),
    totalPrs: Number(r.total_prs),
    linesAdded: Number(r.lines_added),
  };
}

export interface ProfileAnalysis {
  tenure: {
    firstPr: string;
    lastPr: string;
    activeMonths: number;
    totalMonthsSpan: number;
  };
  allTimeStats: {
    totalPrs: number;
    totalLoc: number;
    totalFilesChanged: number;
    totalCommits: number;
    totalRepos: number;
  };
  orgContext: {
    totalOrgRepos: number;
    totalOrgEngineers: number;
    totalOrgPrs: number;
    totalOrgLoc: number;
  };
  repoBreakdown: {
    repoName: string;
    authorPrs: number;
    authorLoc: number;
    totalRepoPrs: number;
    totalRepoLoc: number;
    pctOfRepo: number;
    authorRank: number;
    totalContributors: number;
  }[];
  soleContributorRepos: number;
  top5ContributorRepos: number;
  repoRank: { rank: number; total: number };
  activityTimeline: {
    month: string;
    prs: number;
    loc: number;
  }[];
  prStyle: {
    avgLoc: number;
    avgFiles: number;
    avgCommits: number;
    medianLoc: number;
    smallPrs: number;
    mediumPrs: number;
    largePrs: number;
  };
  busiestDay: string;
  peerPercentile: {
    prPercentile: number;
    locPercentile: number;
    repoPercentile: number;
  };
}

export async function getProfileAnalysis(author: string): Promise<ProfileAnalysis> {
  const { rows: tenureRows } = await pool.query(
    `SELECT
      MIN(merged_at) AS first_pr,
      MAX(merged_at) AS last_pr,
      COUNT(DISTINCT to_char(merged_at, 'YYYY-MM')) AS active_months
    FROM meta.pull_requests WHERE author = $1`,
    [author]
  );
  const tenureRow = tenureRows[0];
  const firstPr = tenureRow.first_pr;
  const lastPr = tenureRow.last_pr;
  let totalMonthsSpan = 1;
  if (firstPr && lastPr) {
    const f = new Date(firstPr);
    const l = new Date(lastPr);
    totalMonthsSpan = Math.max(1,
      (l.getFullYear() - f.getFullYear()) * 12 + (l.getMonth() - f.getMonth()) + 1
    );
  }

  const { rows: statsRows } = await pool.query(
    `SELECT
      COUNT(*) AS total_prs,
      COALESCE(SUM(additions + deletions), 0) AS total_loc,
      COALESCE(SUM(files_changed), 0) AS total_files,
      COALESCE(SUM(commits), 0) AS total_commits,
      COUNT(DISTINCT repo_name) AS total_repos
    FROM meta.pull_requests WHERE author = $1`,
    [author]
  );
  const s = statsRows[0];

  const { rows: orgRows } = await pool.query(
    `SELECT
      COUNT(DISTINCT repo_name) AS total_repos,
      COUNT(DISTINCT author) AS total_engineers,
      COUNT(*) AS total_prs,
      COALESCE(SUM(additions + deletions), 0) AS total_loc
    FROM meta.pull_requests`
  );
  const org = orgRows[0];

  const { rows: repoRows } = await pool.query(
    `WITH author_stats AS (
      SELECT repo_name,
        COUNT(*) AS author_prs,
        COALESCE(SUM(additions + deletions), 0) AS author_loc
      FROM meta.pull_requests WHERE author = $1
      GROUP BY repo_name
    ),
    repo_totals AS (
      SELECT repo_name,
        COUNT(*) AS total_prs,
        COALESCE(SUM(additions + deletions), 0) AS total_loc
      FROM meta.pull_requests
      WHERE repo_name IN (SELECT repo_name FROM author_stats)
      GROUP BY repo_name
    ),
    repo_ranks AS (
      SELECT repo_name, author,
        ROW_NUMBER() OVER (PARTITION BY repo_name ORDER BY SUM(additions + deletions) DESC) AS rank,
        COUNT(*) OVER (PARTITION BY repo_name) AS total_contributors
      FROM meta.pull_requests
      WHERE repo_name IN (SELECT repo_name FROM author_stats)
      GROUP BY repo_name, author
    )
    SELECT
      a.repo_name,
      a.author_prs,
      a.author_loc,
      r.total_prs,
      r.total_loc,
      CASE WHEN r.total_loc > 0
        THEN ROUND((a.author_loc::numeric / r.total_loc) * 100, 1)
        ELSE 0 END AS pct_of_repo,
      rk.rank AS author_rank,
      rk.total_contributors
    FROM author_stats a
    JOIN repo_totals r ON r.repo_name = a.repo_name
    LEFT JOIN repo_ranks rk ON rk.repo_name = a.repo_name AND rk.author = $1
    ORDER BY a.author_loc DESC`,
    [author]
  );

  const repoBreakdown = repoRows.map((r: {
    repo_name: string; author_prs: string; author_loc: string;
    total_prs: string; total_loc: string; pct_of_repo: string;
    author_rank: string; total_contributors: string;
  }) => ({
    repoName: r.repo_name,
    authorPrs: Number(r.author_prs),
    authorLoc: Number(r.author_loc),
    totalRepoPrs: Number(r.total_prs),
    totalRepoLoc: Number(r.total_loc),
    pctOfRepo: Number(r.pct_of_repo),
    authorRank: Number(r.author_rank),
    totalContributors: Number(r.total_contributors),
  }));

  const soleContributorRepos = repoBreakdown.filter(
    (r) => r.totalContributors === 1
  ).length;
  const top5ContributorRepos = repoBreakdown.filter(
    (r) => r.authorRank <= 5 && r.totalContributors > 1
  ).length;

  const { rows: repoRankRows } = await pool.query(
    `WITH engineer_repos AS (
      SELECT author, COUNT(DISTINCT repo_name) AS repos
      FROM meta.pull_requests GROUP BY author
    )
    SELECT
      (SELECT COUNT(*) + 1 FROM engineer_repos WHERE repos > (SELECT repos FROM engineer_repos WHERE author = $1)) AS rank,
      (SELECT COUNT(*) FROM engineer_repos) AS total
    `,
    [author]
  );
  const repoRank = {
    rank: Number(repoRankRows[0].rank),
    total: Number(repoRankRows[0].total),
  };

  const { rows: timelineRows } = await pool.query(
    `SELECT
      to_char(month, 'YYYY-MM') AS month,
      COUNT(*) AS prs,
      COALESCE(SUM(additions + deletions), 0) AS loc
    FROM meta.pull_requests WHERE author = $1
    GROUP BY month
    ORDER BY month ASC`,
    [author]
  );
  const activityTimeline = timelineRows.map((r: { month: string; prs: string; loc: string }) => ({
    month: r.month,
    prs: Number(r.prs),
    loc: Number(r.loc),
  }));

  const { rows: prSizeRows } = await pool.query(
    `SELECT additions + deletions AS loc, files_changed, commits
    FROM meta.pull_requests WHERE author = $1
    ORDER BY loc ASC`,
    [author]
  );
  const locs = prSizeRows.map((r: { loc: string }) => Number(r.loc));
  const medianLoc = locs.length > 0 ? locs[Math.floor(locs.length / 2)] : 0;
  const avgLoc = locs.length > 0 ? Math.round(locs.reduce((a: number, b: number) => a + b, 0) / locs.length) : 0;
  const avgFiles = prSizeRows.length > 0
    ? Math.round(prSizeRows.reduce((a: number, r: { files_changed: number }) => a + Number(r.files_changed), 0) / prSizeRows.length)
    : 0;
  const avgCommits = prSizeRows.length > 0
    ? Math.round(prSizeRows.reduce((a: number, r: { commits: number }) => a + Number(r.commits), 0) / prSizeRows.length)
    : 0;
  const smallPrs = locs.filter((l: number) => l < 100).length;
  const mediumPrs = locs.filter((l: number) => l >= 100 && l < 500).length;
  const largePrs = locs.filter((l: number) => l >= 500).length;

  const { rows: dayRows } = await pool.query(
    `SELECT to_char(merged_at, 'Day') AS day, COUNT(*) AS cnt
    FROM meta.pull_requests WHERE author = $1
    GROUP BY day ORDER BY cnt DESC LIMIT 1`,
    [author]
  );
  const busiestDay = dayRows[0]?.day?.trim() || "N/A";

  const { rows: peerRows } = await pool.query(
    `WITH peer_stats AS (
      SELECT author,
        COUNT(*) AS prs,
        COALESCE(SUM(additions + deletions), 0) AS loc,
        COUNT(DISTINCT repo_name) AS repos
      FROM meta.pull_requests GROUP BY author
    )
    SELECT
      (SELECT COUNT(*) FROM peer_stats WHERE prs <= (SELECT prs FROM peer_stats WHERE author = $1)) * 100.0 /
        GREATEST((SELECT COUNT(*) FROM peer_stats), 1) AS pr_pct,
      (SELECT COUNT(*) FROM peer_stats WHERE loc <= (SELECT loc FROM peer_stats WHERE author = $1)) * 100.0 /
        GREATEST((SELECT COUNT(*) FROM peer_stats), 1) AS loc_pct,
      (SELECT COUNT(*) FROM peer_stats WHERE repos <= (SELECT repos FROM peer_stats WHERE author = $1)) * 100.0 /
        GREATEST((SELECT COUNT(*) FROM peer_stats), 1) AS repo_pct`,
    [author]
  );
  const p = peerRows[0];

  return {
    tenure: {
      firstPr: firstPr?.toISOString() ?? "",
      lastPr: lastPr?.toISOString() ?? "",
      activeMonths: Number(tenureRow.active_months),
      totalMonthsSpan,
    },
    allTimeStats: {
      totalPrs: Number(s.total_prs),
      totalLoc: Number(s.total_loc),
      totalFilesChanged: Number(s.total_files),
      totalCommits: Number(s.total_commits),
      totalRepos: Number(s.total_repos),
    },
    orgContext: {
      totalOrgRepos: Number(org.total_repos),
      totalOrgEngineers: Number(org.total_engineers),
      totalOrgPrs: Number(org.total_prs),
      totalOrgLoc: Number(org.total_loc),
    },
    repoBreakdown,
    soleContributorRepos,
    top5ContributorRepos,
    repoRank,
    activityTimeline,
    prStyle: { avgLoc, avgFiles, avgCommits, medianLoc, smallPrs, mediumPrs, largePrs },
    busiestDay,
    peerPercentile: {
      prPercentile: Math.round(Number(p.pr_pct)),
      locPercentile: Math.round(Number(p.loc_pct)),
      repoPercentile: Math.round(Number(p.repo_pct)),
    },
  };
}

export async function getEngineers(month: Date): Promise<string[]> {
  const start = startOfMonth(month);
  const end = endOfMonth(month);

  const { rows } = await pool.query(
    `SELECT DISTINCT author
    FROM meta.pull_requests
    WHERE merged_at >= $1 AND merged_at <= $2
    ORDER BY author ASC`,
    [start, end]
  );

  return rows.map((r: { author: string }) => r.author);
}
