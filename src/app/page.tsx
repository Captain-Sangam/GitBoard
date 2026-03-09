"use client";

import { useEffect, useState, useCallback } from "react";
import { startOfMonth, format } from "date-fns";
import Link from "next/link";
import { GitPullRequest, Trophy } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { MonthSelector } from "@/components/month-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { StatCard } from "@/components/stat-card";
import { Leaderboard } from "@/components/leaderboard";
import { formatMonth, formatNumber, formatMonthValue } from "@/lib/format";

interface TeamStats {
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
}

export default function Dashboard() {
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { avatar_url: string | null; name: string | null }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/months")
      .then((r) => r.json())
      .then((data: string[]) => {
        setMonths(data);
        if (data.length > 0) {
          setSelectedMonth(formatMonthValue(data[0]));
        }
      });
  }, []);

  const fetchTeamData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/team?month=${selectedMonth}`);
      const data = await res.json();
      setStats(data.stats);
      setLeaderboard(data.leaderboard);
      setProfiles(data.profiles ?? {});
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

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
            <MonthSelector
              months={months}
              value={selectedMonth}
              onChange={setSelectedMonth}
            />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div key={selectedMonth} className="animate-fade-in">
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Team Activity
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatMonth(selectedMonth)}
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
                      label="Engineers Contributing"
                      value={stats.engineers}
                    />
                    <StatCard
                      label="Repositories Contributed"
                      value={stats.repos}
                    />
                    <StatCard
                      label="Total PRs Merged"
                      value={stats.totalPrs.toLocaleString()}
                    />
                    <StatCard
                      label="Lines of Code Changed"
                      value={formatNumber(stats.linesAdded)}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div />
                  <Link href="/all-time">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Trophy className="h-3.5 w-3.5" />
                      Yearly Leaderboard
                    </Button>
                  </Link>
                </div>

                <Separator />

                <Leaderboard
                  data={leaderboard}
                  profiles={profiles}
                  selectedMonth={selectedMonth}
                />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
