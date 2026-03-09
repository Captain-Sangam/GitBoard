import { NextRequest, NextResponse } from "next/server";
import { getYearlyStats, getYearlyLeaderboard, getAvailableYears, getProfileMap } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const yearParam = searchParams.get("year");
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();

  const [stats, leaderboard, years] = await Promise.all([
    getYearlyStats(year),
    getYearlyLeaderboard(year),
    getAvailableYears(),
  ]);

  const logins = leaderboard.map((e) => e.author);
  const profiles = await getProfileMap(logins);

  return NextResponse.json({ stats, leaderboard, profiles, years });
}
