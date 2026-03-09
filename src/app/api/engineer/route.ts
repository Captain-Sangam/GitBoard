import { NextRequest, NextResponse } from "next/server";
import { getEngineerStats, getEngineerPRs, getProfile } from "@/lib/queries";
import { startOfMonth } from "date-fns";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const author = searchParams.get("author");
  const monthStr = searchParams.get("month");

  if (!author) {
    return NextResponse.json({ error: "author is required" }, { status: 400 });
  }

  const month = monthStr ? new Date(monthStr) : startOfMonth(new Date());

  const [stats, prs, profile] = await Promise.all([
    getEngineerStats(author, month),
    getEngineerPRs(author, month),
    getProfile(author),
  ]);

  return NextResponse.json({ stats, prs, profile });
}
