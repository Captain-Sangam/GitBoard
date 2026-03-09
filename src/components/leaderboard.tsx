"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/format";

interface LeaderboardEntry {
  rank: number;
  author: string;
  prs: number;
  loc: number;
  repos: number;
  score?: number;
}

interface ProfileInfo {
  avatar_url: string | null;
  name: string | null;
}

interface LeaderboardProps {
  data: LeaderboardEntry[];
  profiles: Record<string, ProfileInfo>;
  onSelectEngineer?: (author: string) => void;
  selectedMonth?: string;
}

type SortColumn = "prs" | "loc" | "repos" | "author" | "score";
type SortDirection = "asc" | "desc";

function SortIcon({ column, activeColumn, direction }: {
  column: SortColumn;
  activeColumn: SortColumn;
  direction: SortDirection;
}) {
  if (column !== activeColumn) {
    return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 text-muted-foreground/50" />;
  }
  return direction === "asc"
    ? <ArrowUp className="ml-1 inline h-3.5 w-3.5" />
    : <ArrowDown className="ml-1 inline h-3.5 w-3.5" />;
}

function profileHref(author: string, month?: string) {
  const base = `/profile/${encodeURIComponent(author)}`;
  return month ? `${base}?month=${month}` : base;
}

export function Leaderboard({ data, profiles, selectedMonth }: LeaderboardProps) {
  const hasScore = data.length > 0 && data[0].score != null;
  const [sortColumn, setSortColumn] = useState<SortColumn>(hasScore ? "score" : "prs");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection(column === "author" ? "asc" : "desc");
    }
  };

  const sorted = useMemo(() => {
    const items = [...data];
    items.sort((a, b) => {
      if (sortColumn === "author") {
        const cmp = a.author.localeCompare(b.author);
        return sortDirection === "asc" ? cmp : -cmp;
      }
      if (sortColumn === "score") {
        const cmp = (a.score ?? 0) - (b.score ?? 0);
        return sortDirection === "asc" ? cmp : -cmp;
      }
      const cmp = a[sortColumn] - b[sortColumn];
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return items.map((item, i) => ({ ...item, rank: i + 1 }));
  }, [data, sortColumn, sortDirection]);

  const headerClass =
    "cursor-pointer select-none hover:text-foreground transition-colors";

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold tracking-tight">Leaderboard</h2>
      <div className="rounded-md border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Rank</TableHead>
              <TableHead
                className={headerClass}
                onClick={() => handleSort("author")}
              >
                Engineer
                <SortIcon column="author" activeColumn={sortColumn} direction={sortDirection} />
              </TableHead>
              <TableHead
                className={`text-right ${headerClass}`}
                onClick={() => handleSort("prs")}
              >
                PRs
                <SortIcon column="prs" activeColumn={sortColumn} direction={sortDirection} />
              </TableHead>
              <TableHead
                className={`text-right ${headerClass}`}
                onClick={() => handleSort("loc")}
              >
                LOC
                <SortIcon column="loc" activeColumn={sortColumn} direction={sortDirection} />
              </TableHead>
              <TableHead
                className={`text-right ${headerClass}`}
                onClick={() => handleSort("repos")}
              >
                Repos
                <SortIcon column="repos" activeColumn={sortColumn} direction={sortDirection} />
              </TableHead>
              {hasScore && (
                <TableHead
                  className={`text-right ${headerClass}`}
                  onClick={() => handleSort("score")}
                >
                  Score
                  <SortIcon column="score" activeColumn={sortColumn} direction={sortDirection} />
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((entry) => (
              <TableRow
                key={entry.author}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell>
                  <Link href={profileHref(entry.author, selectedMonth)} className="block">
                    {entry.rank <= 3 ? (
                      <Badge variant="secondary" className="font-mono text-xs">
                        {entry.rank}
                      </Badge>
                    ) : (
                      <span className="pl-2 font-mono text-sm text-muted-foreground">
                        {entry.rank}
                      </span>
                    )}
                  </Link>
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={profileHref(entry.author, selectedMonth)} className="flex items-center gap-2">
                    {profiles[entry.author]?.avatar_url ? (
                      <Image
                        src={profiles[entry.author].avatar_url!}
                        alt={entry.author}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-6 w-6 shrink-0 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                        {entry.author[0]?.toUpperCase()}
                      </div>
                    )}
                    <span>{profiles[entry.author]?.name || entry.author}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-right font-mono">
                  <Link href={profileHref(entry.author, selectedMonth)} className="block">
                    {entry.prs}
                  </Link>
                </TableCell>
                <TableCell className="text-right font-mono">
                  <Link href={profileHref(entry.author, selectedMonth)} className="block">
                    {formatNumber(entry.loc)}
                  </Link>
                </TableCell>
                <TableCell className="text-right font-mono">
                  <Link href={profileHref(entry.author, selectedMonth)} className="block">
                    {entry.repos}
                  </Link>
                </TableCell>
                {hasScore && (
                  <TableCell className="text-right font-mono font-semibold">
                    <Link href={profileHref(entry.author, selectedMonth)} className="block">
                      {entry.score?.toLocaleString()}
                    </Link>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={hasScore ? 6 : 5} className="text-center text-muted-foreground py-8">
                  No data for this month
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
