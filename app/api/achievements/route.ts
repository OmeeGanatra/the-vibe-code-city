import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import {
  evaluateAchievements,
  getUserAchievements,
} from "@/lib/services/achievements";

// GET /api/achievements?user_id=xxx — List user's achievements
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  const username = req.nextUrl.searchParams.get("username");

  let resolvedId = userId;

  if (!resolvedId && username) {
    const supabase = createServiceSupabase();
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("github_login", username)
      .single();
    resolvedId = user?.id ?? null;
  }

  if (!resolvedId) {
    return NextResponse.json({ error: "user_id or username required" }, { status: 400 });
  }

  const achievements = await getUserAchievements(resolvedId);
  return NextResponse.json({ achievements });
}

// POST /api/achievements — Trigger achievement evaluation
export async function POST(req: NextRequest) {
  const { user_id } = await req.json();
  if (!user_id) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const newlyEarned = await evaluateAchievements(user_id);
  return NextResponse.json({ newly_earned: newlyEarned });
}
