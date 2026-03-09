import { NextRequest, NextResponse } from "next/server";
import { getProfileAnalysis, getProfile } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const author = searchParams.get("author");

  if (!author) {
    return NextResponse.json({ error: "author is required" }, { status: 400 });
  }

  const [analysis, profile] = await Promise.all([
    getProfileAnalysis(author),
    getProfile(author),
  ]);

  return NextResponse.json({ analysis, profile });
}
