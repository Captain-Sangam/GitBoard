import { NextRequest, NextResponse } from "next/server";

const AI_API_KEY = process.env.AI_API_KEY;

interface BannerInput {
  name: string;
  author: string;
  tone: "roast" | "spotlight";
  firstPr: string;
  activeMonths: number;
  totalMonthsSpan: number;
  totalPrs: number;
  totalLoc: number;
  totalCommits: number;
  totalRepos: number;
  totalOrgEngineers: number;
  soleContributorRepos: number;
  top5ContributorRepos: number;
  repoRank: number;
  topRepos: string[];
}

const FACTS_BLOCK = (input: BannerInput) => `
- Name: ${input.name} (GitHub: ${input.author})
- First contribution: ${input.firstPr}
- Active for ${input.activeMonths} months (out of ${input.totalMonthsSpan} months since joining)
- Total PRs merged: ${input.totalPrs.toLocaleString()}
- Total lines of code changed: ${input.totalLoc.toLocaleString()}
- Total commits: ${input.totalCommits.toLocaleString()}
- Contributed to ${input.totalRepos} repositories
- Ranked ${input.repoRank} out of ${input.totalOrgEngineers} engineers by repo breadth
- Sole contributor in ${input.soleContributorRepos} repos, top-5 contributor in ${input.top5ContributorRepos} repos
- Top repos: ${input.topRepos.join(", ")}`;

const PROMPTS: Record<string, (input: BannerInput) => string> = {
  roast: (input) =>
    `You are writing a short, engaging profile banner for an engineer's contribution highlights page on a team analytics dashboard.

Here are the facts:${FACTS_BLOCK(input)}

Write a 2-3 sentence lighthearted roast of this engineer based on their contribution data. Think comedy roast meets code review — affectionate trash talk grounded in real numbers. Poke fun at the absurd volume, the questionable consistency, the repos they've colonized, or the sheer audacity of their line counts. Be specific with the data, be witty, keep it punchy. The tone should be "your teammates roasting you at a team dinner" — never mean, always funny. No emojis. Return ONLY the roast text, nothing else.`,

  spotlight: (input) =>
    `You are writing a short, engaging profile banner for an engineer's contribution highlights page on a team analytics dashboard.

Here are the facts:${FACTS_BLOCK(input)}

Write a 2-3 sentence profile summary that feels warm, specific, and celebratory — like a contributor spotlight. Highlight what makes this person's contributions distinctive (breadth, consistency, volume, ownership, etc.). Use concrete numbers. Don't use buzzwords. Don't be generic. No emojis. Return ONLY the summary text, nothing else.`,
};

export async function POST(request: NextRequest) {
  if (!AI_API_KEY) {
    return NextResponse.json(
      { error: "AI_API_KEY not configured" },
      { status: 503 }
    );
  }

  const input = (await request.json()) as BannerInput;
  const tone = input.tone === "spotlight" ? "spotlight" : "roast";
  const prompt = PROMPTS[tone](input);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": AI_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { error: `AI API error: ${response.status} – ${text}` },
      { status: 502 }
    );
  }

  const data = await response.json();
  const banner: string = data.content[0].text.trim();

  return NextResponse.json({ banner });
}
