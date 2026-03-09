"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { ArrowLeft, Loader2, MapPin, Building2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { StatCard } from "./stat-card";
import { formatNumber, formatDate, formatWeekLabel, formatOrdinal } from "@/lib/format";

interface EngineerStats {
  prs: number;
  linesAdded: number;
  repos: number;
  rank: number;
  totalEngineers: number;
  prRank: number;
  locRank: number;
  reposRank: number;
}

interface PR {
  repo_name: string;
  pr_number: number;
  title: string;
  body: string;
  additions: number;
  files_changed: number;
  commits: number;
  merged_at: string;
  week_start: string;
}

interface WeekBucket {
  weekIndex: number;
  prs: PR[];
  summary: string | null;
  loading: boolean;
}

interface Profile {
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

interface EngineerViewProps {
  author: string;
  month: string;
  onBack?: () => void;
  embedded?: boolean;
}

function buildMonthWeeks(month: string, prs: PR[]): WeekBucket[] {
  const weeks: WeekBucket[] = [
    { weekIndex: 0, prs: [], summary: null, loading: false },
    { weekIndex: 1, prs: [], summary: null, loading: false },
    { weekIndex: 2, prs: [], summary: null, loading: false },
    { weekIndex: 3, prs: [], summary: null, loading: false },
  ];

  for (const pr of prs) {
    const day = new Date(pr.merged_at).getUTCDate();
    let idx: number;
    if (day <= 7) idx = 0;
    else if (day <= 14) idx = 1;
    else if (day <= 21) idx = 2;
    else idx = 3;
    weeks[idx].prs.push(pr);
  }

  for (const w of weeks) {
    if (w.prs.length > 0) {
      w.loading = true;
    }
  }

  return weeks;
}

function rankLabel(rank: number, total: number): string {
  return `${formatOrdinal(rank)} of ${total}`;
}

function renderBoldSegments(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <span key={i} className="font-semibold">{part.slice(2, -2)}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

function SummaryBullets({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);

  return (
    <ul className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
          <span>{renderBoldSegments(line)}</span>
        </li>
      ))}
    </ul>
  );
}

export function EngineerView({ author, month, onBack, embedded }: EngineerViewProps) {
  const [stats, setStats] = useState<EngineerStats | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [prs, setPrs] = useState<PR[]>([]);
  const [weeks, setWeeks] = useState<WeekBucket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setWeeks([]);
    try {
      const res = await fetch(
        `/api/engineer?author=${encodeURIComponent(author)}&month=${month}`
      );
      const data = await res.json();
      setStats(data.stats);
      setPrs(data.prs);
      setProfile(data.profile ?? null);
    } finally {
      setLoading(false);
    }
  }, [author, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const buckets = buildMonthWeeks(month, prs);
    setWeeks(buckets);

    for (let i = 0; i < buckets.length; i++) {
      const bucket = buckets[i];
      if (bucket.prs.length === 0) continue;

      const payload = bucket.prs.map((pr) => ({
        title: pr.title,
        body: pr.body,
        repo_name: pr.repo_name,
      }));

      fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prs: payload }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          setWeeks((prev) =>
            prev.map((w, idx) =>
              idx === i
                ? { ...w, summary: data?.summary ?? null, loading: false }
                : w
            )
          );
        })
        .catch(() => {
          setWeeks((prev) =>
            prev.map((w, idx) =>
              idx === i ? { ...w, summary: null, loading: false } : w
            )
          );
        });
    }
  }, [prs, month]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {!embedded && (
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back to Team
          </Button>
        </div>
      )}

      {!embedded && (
        <div className="flex items-start gap-4">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.name || author}
              width={64}
              height={64}
              className="rounded-full"
            />
          ) : (
            <div className="h-16 w-16 shrink-0 rounded-full bg-muted flex items-center justify-center text-lg font-semibold text-muted-foreground">
              {author[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              {profile?.name || author}
            </h1>
            {profile?.name && (
              <p className="text-sm text-muted-foreground">{author}</p>
            )}
            {profile?.bio && (
              <p className="mt-1 text-sm text-muted-foreground">{profile.bio}</p>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {profile?.company && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {profile.company}
                </span>
              )}
              {profile?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {profile.location}
                </span>
              )}
              {profile?.html_url && (
                <a
                  href={profile.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  GitHub
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="PRs Merged"
            value={stats.prs}
            subtitle={rankLabel(stats.prRank, stats.totalEngineers)}
          />
          <StatCard
            label="Lines of Code Changed"
            value={formatNumber(stats.linesAdded)}
            subtitle={rankLabel(stats.locRank, stats.totalEngineers)}
          />
          <StatCard
            label="Repositories Contributed"
            value={stats.repos}
            subtitle={rankLabel(stats.reposRank, stats.totalEngineers)}
          />
        </div>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          Weekly Summaries
        </h2>
        <div className="space-y-3">
          {weeks.map((w) => (
            <Card key={w.weekIndex} className="border border-border/60">
              <CardContent>
                <p className="text-sm font-medium text-muted-foreground mb-1.5">
                  {formatWeekLabel("", w.weekIndex, month)}
                </p>
                {w.prs.length === 0 ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    No activity this week.
                  </p>
                ) : w.loading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Generating summary...
                  </div>
                ) : w.summary ? (
                  <SummaryBullets text={w.summary} />
                ) : (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Unable to generate summary.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          PR Activity
        </h2>
        <div className="rounded-md border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Repository</TableHead>
                <TableHead>PR</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="text-right">LOC Added</TableHead>
                <TableHead className="text-right">Files</TableHead>
                <TableHead className="text-right">Commits</TableHead>
                <TableHead className="text-right">Merged</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prs.map((pr) => (
                <TableRow key={`${pr.repo_name}-${pr.pr_number}`}>
                  <TableCell className="font-mono text-sm">
                    {pr.repo_name}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    #{pr.pr_number}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {pr.title}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(pr.additions)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {pr.files_changed}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {pr.commits}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatDate(pr.merged_at)}
                  </TableCell>
                </TableRow>
              ))}
              {prs.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    No PRs for this month
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
