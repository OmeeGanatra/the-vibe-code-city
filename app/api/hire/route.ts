import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";

// GET /api/hire — list of for-hire vibe coders (lightweight, for client filtering)
export async function GET() {
  const supabase = createServiceSupabase();

  const { data } = await supabase
    .from("users")
    .select(
      "github_login, name, avatar_url, hire_headline, hire_rate_usd_hourly, hire_availability, hire_contact_url, hire_skills"
    )
    .eq("for_hire", true)
    .order("total_contributions", { ascending: false });

  const users = data ?? [];
  return NextResponse.json(
    {
      count: users.length,
      logins: users.map((u) => u.github_login),
      users,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
