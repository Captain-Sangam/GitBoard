"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, GitFork, Calendar, TrendingUp, BarChart3, Flame, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "./stat-card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatNumber, formatOrdinal } from "@/lib/format";
import { format as fmtDate, parseISO } from "date-fns";

interface ProfileAnalysisData {
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
  busiestDay: string;
}

interface ProfileAnalysisProps {
  author: string;
  displayName?: string;
}

const CHART_HEIGHT = 96;

function TimelineChart({ data }: { data: { month: string; prs: number }[] }) {
  if (data.length === 0) return null;
  const maxPrs = Math.max(...data.map((d) => d.prs));

  const yearStarts: { index: number; year: string }[] = [];
  data.forEach((d, i) => {
    const year = d.month.slice(0, 4);
    if (i === 0 || year !== data[i - 1].month.slice(0, 4)) {
      yearStarts.push({ index: i, year });
    }
  });

  return (
    <div>
      <div className="flex items-end gap-[2px]" style={{ height: CHART_HEIGHT }}>
        {data.map((d) => {
          const barHeight = maxPrs > 0
            ? Math.max(2, Math.round((d.prs / maxPrs) * CHART_HEIGHT))
            : 2;
          return (
            <div
              key={d.month}
              className="group relative flex-1"
              style={{ height: CHART_HEIGHT }}
            >
              <div
                className="absolute bottom-0 w-full rounded-t-sm bg-foreground/60 group-hover:bg-foreground/90 transition-colors"
                style={{ height: barHeight }}
              />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-popover border border-border rounded px-2 py-1 text-[10px] font-mono whitespace-nowrap shadow-md z-10">
                {d.month}: {d.prs} PRs
              </div>
            </div>
          );
        })}
      </div>
      <div className="relative mt-1.5 h-4">
        {yearStarts.map(({ index, year }) => {
          const pct = (index / data.length) * 100;
          return (
            <span
              key={year}
              className="absolute text-[10px] font-mono text-muted-foreground"
              style={{ left: `${pct}%` }}
            >
              {year}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function ProfileAnalysis({ author, displayName }: ProfileAnalysisProps) {
  const [data, setData] = useState<ProfileAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bannerTone, setBannerTone] = useState<"roast" | "spotlight">("roast");
  const [banners, setBanners] = useState<Record<string, string>>({});
  const [bannerLoading, setBannerLoading] = useState<Record<string, boolean>>({});
  const fetchedTones = useRef(new Set<string>());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/profile-analysis?author=${encodeURIComponent(author)}`);
      const json = await res.json();
      setData(json.analysis);
    } finally {
      setLoading(false);
    }
  }, [author]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const triggerBannerFetch = useCallback((tone: "roast" | "spotlight", analysisData: ProfileAnalysisData) => {
    if (fetchedTones.current.has(tone)) return;
    fetchedTones.current.add(tone);
    setBannerLoading((prev) => ({ ...prev, [tone]: true }));
    const topRepos = analysisData.repoBreakdown.slice(0, 5).map((r) => r.repoName);
    fetch("/api/profile-banner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: displayName || author,
        author,
        tone,
        firstPr: analysisData.tenure.firstPr,
        activeMonths: analysisData.tenure.activeMonths,
        totalMonthsSpan: analysisData.tenure.totalMonthsSpan,
        totalPrs: analysisData.allTimeStats.totalPrs,
        totalLoc: analysisData.allTimeStats.totalLoc,
        totalCommits: analysisData.allTimeStats.totalCommits,
        totalRepos: analysisData.allTimeStats.totalRepos,
        totalOrgEngineers: analysisData.orgContext.totalOrgEngineers,
        soleContributorRepos: analysisData.soleContributorRepos,
        top5ContributorRepos: analysisData.top5ContributorRepos,
        repoRank: analysisData.repoRank.rank,
        topRepos,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.banner) setBanners((prev) => ({ ...prev, [tone]: json.banner }));
      })
      .catch(() => {})
      .finally(() => setBannerLoading((prev) => ({ ...prev, [tone]: false })));
  }, [author, displayName]);

  useEffect(() => {
    if (data) triggerBannerFetch("roast", data);
  }, [data, triggerBannerFetch]);

  const handleToneChange = useCallback((tone: "roast" | "spotlight") => {
    setBannerTone(tone);
    if (data) triggerBannerFetch(tone, data);
  }, [data, triggerBannerFetch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Analyzing contribution history...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        No contribution data found.
      </div>
    );
  }

  const consistencyPct = data.tenure.totalMonthsSpan > 0
    ? Math.round((data.tenure.activeMonths / data.tenure.totalMonthsSpan) * 100)
    : 0;

  const remainingRepos = data.repoBreakdown.length - data.soleContributorRepos - data.top5ContributorRepos;

  return (
    <div className="space-y-8">
      {/* AI Banner */}
      <Card className="border border-border/60 bg-muted/30">
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-1 rounded-md bg-muted p-0.5">
              <button
                onClick={() => handleToneChange("roast")}
                className={cn(
                  "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  bannerTone === "roast"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Flame className="h-3 w-3 text-orange-500" />
                Roast
              </button>
              <button
                onClick={() => handleToneChange("spotlight")}
                className={cn(
                  "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  bannerTone === "spotlight"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="h-3 w-3" />
                Spotlight
              </button>
            </div>
            <Badge variant="secondary" className="text-[10px] font-normal text-muted-foreground">
              AI-generated {bannerTone === "roast" ? "— all in good fun" : "summary"}
            </Badge>
          </div>
          {bannerLoading[bannerTone] ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {bannerTone === "roast" ? "Cooking up a roast..." : "Writing a spotlight..."}
            </div>
          ) : banners[bannerTone] ? (
            <p className="text-sm leading-relaxed">{banners[bannerTone]}</p>
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {bannerTone === "roast" ? "Couldn\u2019t think of anything mean enough." : "Summary unavailable."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tenure & Org Context */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">Tenure & Reach</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Contributing Since"
            value={data.tenure.firstPr ? fmtDate(parseISO(data.tenure.firstPr), "MMM yyyy") : "N/A"}
            subtitle={data.tenure.lastPr ? `Latest: ${fmtDate(parseISO(data.tenure.lastPr), "MMM yyyy")}` : undefined}
          />
          <StatCard
            label="Consistency"
            value={`${consistencyPct}%`}
            subtitle={`Active in ${data.tenure.activeMonths} of ${data.tenure.totalMonthsSpan} months`}
          />
          <StatCard
            label="Repos Contributed"
            value={data.allTimeStats.totalRepos}
            subtitle={`${formatOrdinal(data.repoRank.rank)} of ${data.repoRank.total} engineers`}
          />
        </div>
      </div>

      <Separator />

      {/* All-Time Volume */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">All-Time Contributions</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="PRs Merged" value={data.allTimeStats.totalPrs.toLocaleString()} />
          <StatCard label="Lines Changed" value={formatNumber(data.allTimeStats.totalLoc)} />
          <StatCard label="Files Touched" value={formatNumber(data.allTimeStats.totalFilesChanged)} />
          <StatCard label="Commits" value={data.allTimeStats.totalCommits.toLocaleString()} />
        </div>
      </div>

      <Separator />

      {/* Repository Breakdown */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <GitFork className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">Repository Breakdown</h2>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Sole Contributor"
            value={data.soleContributorRepos}
            subtitle={`${data.soleContributorRepos === 1 ? "repo" : "repos"} with no other contributors`}
          />
          <StatCard
            label="Top 5 Contributor"
            value={data.top5ContributorRepos}
            subtitle={`${data.top5ContributorRepos === 1 ? "repo" : "repos"} where ranked in top 5`}
          />
          <StatCard
            label="Other Repos"
            value={remainingRepos}
            subtitle={`additional ${remainingRepos === 1 ? "repository" : "repositories"} contributed to`}
          />
        </div>
      </div>

      <Separator />

      {/* Activity Timeline */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">Activity Timeline</h2>
        </div>
        <Card className="border border-border/60">
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">PRs merged per month</p>
              {data.activityTimeline.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {data.activityTimeline[0].month} — {data.activityTimeline[data.activityTimeline.length - 1].month}
                </p>
              )}
            </div>
            <TimelineChart data={data.activityTimeline} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
