import { NextRequest, NextResponse } from "next/server";

const AI_API_KEY = process.env.AI_API_KEY;

export async function POST(request: NextRequest) {
  if (!AI_API_KEY) {
    return NextResponse.json(
      { error: "AI_API_KEY not configured" },
      { status: 503 }
    );
  }

  const { prs } = (await request.json()) as {
    prs: Array<{ title: string; body?: string; repo_name?: string }>;
  };

  if (!prs || prs.length === 0) {
    return NextResponse.json(
      { error: "prs array is required" },
      { status: 400 }
    );
  }

  const prList = prs
    .map((pr) => {
      const repo = pr.repo_name ? ` [${pr.repo_name}]` : "";
      const body = pr.body ? `\n  Description: ${pr.body.slice(0, 200)}` : "";
      return `- ${pr.title}${repo}${body}`;
    })
    .join("\n");

  const prompt = `Summarize the work completed by this engineer during the week based on the following pull requests.
Focus on technical contributions and improvements.
Return the summary as bullet points (one per line, each starting with "- ").
Each bullet point MUST start with the repository name in bold using **repo-name** markdown syntax, followed by a colon and the description.
Group related PRs from the same repo into a single bullet when possible.
Keep each bullet concise (1 sentence).

Pull requests:
${prList}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": AI_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
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
  const summary: string = data.content[0].text.trim();

  return NextResponse.json({ summary });
}
