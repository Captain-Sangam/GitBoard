"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { GitPullRequest, ArrowLeft, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { StatCard } from "@/components/stat-card";
import { Leaderboard } from "@/components/leaderboard";
import { Podium } from "@/components/podium";
import { YearSelector } from "@/components/year-selector";
import { formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";

interface YearlyStats {
  engineers: number;
  repos: number;
  totalPrs: number;
  linesAdded: number;
}

interface LeaderboardEntry {
  rank: number;
  author: string;
  prs: number;
  loc: number;
  repos: number;
  score: number;
}

export default function YearlyLeaderboardPage() {
  const [stats, setStats] = useState<YearlyStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { avatar_url: string | null; name: string | null }>>({});
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/all-time?year=${selectedYear}`);
      const data = await res.json();
      setStats(data.stats);
      setLeaderboard(data.leaderboard);
      setProfiles(data.profiles ?? {});
      if (data.years?.length > 0) {
        setYears(data.years);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-base font-semibold tracking-tight hover:opacity-80 transition-opacity"
          >
            <GitPullRequest className="h-5 w-5" />
            Gitboard
          </Link>
          <div className="flex items-center gap-2">
            {years.length > 0 && (
              <YearSelector
                years={years}
                value={selectedYear}
                onChange={setSelectedYear}
              />
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div key={`yearly-${selectedYear}`} className="animate-fade-in">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Monthly
                </Button>
              </Link>
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {selectedYear} Leaderboard
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Yearly stats for {selectedYear}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                Loading...
              </div>
            ) : (
              <>
                {stats && (
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard
                      label="Engineers"
                      value={stats.engineers}
                    />
                    <StatCard
                      label="Repositories"
                      value={stats.repos}
                    />
                    <StatCard
                      label="PRs Merged"
                      value={stats.totalPrs.toLocaleString()}
                    />
                    <StatCard
                      label="Lines Changed"
                      value={formatNumber(stats.linesAdded)}
                    />
                  </div>
                )}

                {leaderboard.length >= 3 && (
                  <Podium
                    top3={leaderboard.slice(0, 3)}
                    profiles={profiles}
                  />
                )}

                <Card className="border border-border/60">
                  <CardContent className="flex gap-3 text-sm text-muted-foreground">
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="space-y-2">
                      <p className="font-medium text-foreground">How the score is calculated</p>
                      <p className="leading-relaxed">
                        Each engineer&apos;s score is computed using a weighted formula that rewards
                        shipping (PRs), cross-repo breadth, and code volume. Scores reset each year
                        so everyone starts on equal footing.
                      </p>
                      <div className="rounded-md bg-muted/60 px-3 py-2 font-mono text-xs text-foreground">
                        score = (PRs &times; 5) + (LOC &divide; 100) + (repos &times; 10)
                      </div>
                      <ul className="space-y-1 text-xs leading-relaxed">
                        <li><span className="font-medium text-foreground">PRs &times; 5</span> &mdash; shipping is the strongest signal, so merged PRs carry the most weight.</li>
                        <li><span className="font-medium text-foreground">LOC &divide; 100</span> &mdash; total lines changed (additions + deletions) adds incremental credit without rewarding verbosity.</li>
                        <li><span className="font-medium text-foreground">Repos &times; 10</span> &mdash; contributing across multiple repositories shows breadth of impact.</li>
                      </ul>
                      <p className="text-xs leading-relaxed">
                        You can click any column header in the table below to re-sort by a single metric instead.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                <Leaderboard
                  data={leaderboard}
                  profiles={profiles}
                />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
