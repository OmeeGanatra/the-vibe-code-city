import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { syncUser } from "@/lib/services/github";

// GET /api/user?username=xxx — Fetch user profile + stats
export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");
  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  // Try DB first
  let { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("github_login", username)
    .single();

  // If not found or stale (>24h), sync from GitHub
  if (
    !user ||
    !user.last_synced_at ||
    Date.now() - new Date(user.last_synced_at).getTime() > 24 * 60 * 60 * 1000
  ) {
    try {
      user = await syncUser(username);
    } catch (err) {
      if (!user) {
        return NextResponse.json(
          { error: "User not found", detail: String(err) },
          { status: 404 }
        );
      }
      // Use stale data if sync fails
    }
  }

  // Fetch top repos
  const { data: repos } = await supabase
    .from("repositories")
    .select("*")
    .eq("user_id", user!.id)
    .order("stars", { ascending: false })
    .limit(10);

  return NextResponse.json({ user, repositories: repos ?? [] });
}
