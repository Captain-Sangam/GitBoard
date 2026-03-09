CREATE SCHEMA IF NOT EXISTS meta;

CREATE TABLE IF NOT EXISTS meta.pull_requests (
  id            SERIAL PRIMARY KEY,
  pr_number     INTEGER NOT NULL,
  repo_name     TEXT NOT NULL,
  author        TEXT NOT NULL,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL DEFAULT '',
  merged_at     TIMESTAMP NOT NULL,
  additions     INTEGER NOT NULL DEFAULT 0,
  deletions     INTEGER NOT NULL DEFAULT 0,
  files_changed INTEGER NOT NULL DEFAULT 0,
  commits       INTEGER NOT NULL DEFAULT 0,
  week_start    DATE NOT NULL,
  month         DATE NOT NULL,
  ai_summary    TEXT,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE (repo_name, pr_number)
);

CREATE INDEX IF NOT EXISTS idx_pull_requests_month ON meta.pull_requests (month);
CREATE INDEX IF NOT EXISTS idx_pull_requests_author_month ON meta.pull_requests (author, month);
