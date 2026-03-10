import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { name, description, url, builderName, builderTwitter, githubUrl, category, tags } = body;

    // Basic validation
    if (!name || !description || !url || !builderName || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Format submission for review
    const submission = {
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      name,
      description,
      url,
      builderName,
      ...(builderTwitter && { builderTwitter }),
      ...(githubUrl && { githubUrl }),
      category,
      tags: tags ? tags.split(",").map((t: string) => t.trim()).filter(Boolean).slice(0, 5) : [],
      submittedAt: new Date().toISOString(),
      upvotes: 0,
    };

    // Send to Discord webhook if configured
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: `New The Vibe Code City Submission: ${name}`,
              color: 0xff6b35,
              fields: [
                { name: "Builder", value: builderName, inline: true },
                { name: "Category", value: category, inline: true },
                { name: "URL", value: url },
                ...(githubUrl ? [{ name: "GitHub", value: githubUrl }] : []),
                { name: "Description", value: description },
                {
                  name: "JSON to add to projects.json",
                  value: "```json\n" + JSON.stringify(submission, null, 2) + "\n```",
                },
              ],
            },
          ],
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Submit error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
