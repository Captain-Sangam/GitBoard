"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  GitPullRequest,
  ArrowLeft,
  MapPin,
  Building2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProfileAnalysis } from "@/components/profile-analysis";

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

export default function AnalysisPage() {
  const params = useParams<{ author: string }>();
  const author = decodeURIComponent(params.author);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const res = await fetch(
        `/api/profile-analysis?author=${encodeURIComponent(author)}`
      );
      const data = await res.json();
      setProfile(data.profile ?? null);
    } finally {
      setProfileLoading(false);
    }
  }, [author]);

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
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="animate-fade-in">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <Link href={`/profile/${encodeURIComponent(author)}`}>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Profile
                </Button>
              </Link>
            </div>

            {!profileLoading && (
              <div className="flex items-start justify-between gap-4 min-w-0">
                <div className="flex items-start gap-4 min-w-0">
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
                <div className="shrink-0 self-center flex items-center gap-2 text-muted-foreground">
                  <GitPullRequest className="h-5 w-5" />
                  <span className="text-sm font-semibold tracking-tight">Gitboard</span>
                </div>
              </div>
            )}

            <ProfileAnalysis author={author} displayName={profile?.name || undefined} />
          </div>
        </div>
      </main>
    </div>
  );
}
