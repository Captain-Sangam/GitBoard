"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format, startOfMonth } from "date-fns";
import {
  GitPullRequest,
  ArrowLeft,
  MapPin,
  Building2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonthSelector } from "@/components/month-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { EngineerView } from "@/components/engineer-view";
import { formatMonthValue } from "@/lib/format";

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

export default function ProfilePage() {
  const params = useParams<{ author: string }>();
  const searchParams = useSearchParams();
  const author = decodeURIComponent(params.author);
  const monthFromUrl = searchParams.get("month");

  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    monthFromUrl || format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    fetch("/api/months")
      .then((r) => r.json())
      .then((data: string[]) => {
        setMonths(data);
        if (!monthFromUrl && data.length > 0) {
          setSelectedMonth(formatMonthValue(data[0]));
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const res = await fetch(
        `/api/engineer?author=${encodeURIComponent(author)}&month=${selectedMonth}`
      );
      const data = await res.json();
      setProfile(data.profile ?? null);
    } finally {
      setProfileLoading(false);
    }
  }, [author, selectedMonth]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
        <div key={`${author}-${selectedMonth}`} className="animate-fade-in">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Team
                </Button>
              </Link>
              <Link href={`/profile/${encodeURIComponent(author)}/analysis`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Highlights
                </Button>
              </Link>
            </div>

            {!profileLoading && (
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
                    <p className="mt-1 text-sm text-muted-foreground">
                      {profile.bio}
                    </p>
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

            <EngineerView
              author={author}
              month={selectedMonth}
              embedded
            />
          </div>
        </div>
      </main>
    </div>
  );
}
