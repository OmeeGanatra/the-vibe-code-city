import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
import { syncUser } from "@/lib/services/github";

// GET /api/auth/callback — GitHub OAuth callback
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = req.nextUrl.searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const supabase = await createServerSupabase();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(new URL("/?error=auth_failed", req.url));
  }

  // Sync and claim the user's city profile, then land on their building
  const { data: { user } } = await supabase.auth.getUser();
  const username = user?.user_metadata?.user_name as string | undefined;

  if (username) {
    try {
      await syncUser(username);
      const service = createServiceSupabase();
      await service
        .from("users")
        .update({ claimed: true, claimed_at: new Date().toISOString() })
        .eq("github_login", username.toLowerCase())
        .is("claimed_at", null);
      return NextResponse.redirect(new URL(`/user/${username}`, req.url));
    } catch {
      // Fall through to next param
    }
  }

  return NextResponse.redirect(new URL(next, req.url));
}
