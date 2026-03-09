import { NextRequest, NextResponse } from "next/server";
import { getTeamStats, getLeaderboard, getProfileMap } from "@/lib/queries";
import { startOfMonth } from "date-fns";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const monthStr = searchParams.get("month");
  const month = monthStr ? new Date(monthStr) : startOfMonth(new Date());

  const [stats, leaderboard] = await Promise.all([
    getTeamStats(month),
    getLeaderboard(month),
  ]);

  const logins = leaderboard.map((e) => e.author);
  const profiles = await getProfileMap(logins);

  return NextResponse.json({ stats, leaderboard, profiles });
}
