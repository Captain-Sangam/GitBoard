"use client";

import Image from "next/image";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { formatNumber } from "@/lib/format";

interface PodiumEntry {
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

interface PodiumProps {
  top3: PodiumEntry[];
  profiles: Record<string, ProfileInfo>;
  onSelectEngineer?: (author: string) => void;
}

const podiumConfig = [
  { position: 0, order: "order-2", height: "h-32", avatarSize: 80, ring: "ring-yellow-400", bg: "bg-yellow-400/10", accent: "text-yellow-500", medal: "🥇" },
  { position: 1, order: "order-1", height: "h-24", avatarSize: 64, ring: "ring-zinc-400", bg: "bg-zinc-400/10", accent: "text-zinc-400", medal: "🥈" },
  { position: 2, order: "order-3", height: "h-20", avatarSize: 64, ring: "ring-amber-600", bg: "bg-amber-600/10", accent: "text-amber-600", medal: "🥉" },
] as const;

export function Podium({ top3, profiles }: PodiumProps) {
  if (top3.length < 3) return null;

  return (
    <div className="flex items-end justify-center gap-4 pt-8 pb-4">
      {podiumConfig.map(({ position, order, height, avatarSize, ring, bg, accent, medal }) => {
        const entry = top3[position];
        const profile = profiles[entry.author];
        const displayName = profile?.name || entry.author;

        return (
          <Link
            key={entry.author}
            href={`/profile/${encodeURIComponent(entry.author)}`}
            className={`${order} flex w-44 flex-col items-center gap-3 rounded-xl border border-border/60 ${bg} px-4 pb-4 pt-5 transition-all hover:scale-[1.03] hover:shadow-md`}
          >
            <div className="relative">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={displayName}
                  width={avatarSize}
                  height={avatarSize}
                  className={`rounded-full ring-2 ${ring}`}
                />
              ) : (
                <div
                  className={`flex items-center justify-center rounded-full bg-muted ring-2 ${ring} text-lg font-semibold text-muted-foreground`}
                  style={{ width: avatarSize, height: avatarSize }}
                >
                  {entry.author[0]?.toUpperCase()}
                </div>
              )}
              <span className="absolute -top-2 -right-2 text-xl">
                {medal}
              </span>
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold truncate max-w-[140px]">{displayName}</p>
              {profile?.name && (
                <p className="text-xs text-muted-foreground truncate max-w-[140px]">{entry.author}</p>
              )}
            </div>

            <div className={`flex items-center gap-1 text-lg font-bold ${accent}`}>
              <Trophy className="h-4 w-4" />
              {entry.score?.toLocaleString()}
            </div>

            <div className={`w-full rounded-md ${bg} ${height} flex flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground`}>
              <span>{entry.prs} PRs</span>
              <span>{formatNumber(entry.loc)} LOC</span>
              <span>{entry.repos} repos</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
