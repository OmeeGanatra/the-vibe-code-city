import { NextRequest, NextResponse } from "next/server";
import { syncAllUsers, syncUser } from "@/lib/services/github";
import { evaluateAchievements } from "@/lib/services/achievements";

// POST /api/sync — Trigger daily sync job
// Secured by a shared secret in the Authorization header
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  // Single user sync
  if (body.username) {
    const user = await syncUser(body.username);
    const achievements = await evaluateAchievements(user.id);
    return NextResponse.json({ user: user.github_login, achievements });
  }

  // Batch sync
  const result = await syncAllUsers();
  return NextResponse.json(result);
}
