import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";

// PATCH /api/hire — update the signed-in user's hire profile
export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const username = user.user_metadata?.user_name as string | undefined;
  if (!username) {
    return NextResponse.json({ error: "No GitHub login in session" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    for_hire: body.for_hire === true,
  };
  if (typeof body.hire_headline === "string") update.hire_headline = body.hire_headline.slice(0, 120) || null;
  if (typeof body.hire_bio === "string") update.hire_bio = body.hire_bio.slice(0, 500) || null;
  if (typeof body.hire_rate_usd_hourly === "number") update.hire_rate_usd_hourly = body.hire_rate_usd_hourly > 0 ? body.hire_rate_usd_hourly : null;
  if (typeof body.hire_availability === "string") update.hire_availability = body.hire_availability.slice(0, 60) || null;
  if (typeof body.hire_contact_url === "string") update.hire_contact_url = body.hire_contact_url.slice(0, 500) || null;
  if (Array.isArray(body.hire_skills)) {
    update.hire_skills = (body.hire_skills as unknown[])
      .filter((s): s is string => typeof s === "string")
      .slice(0, 12);
  }

  const service = createServiceSupabase();
  const { data, error } = await service
    .from("users")
    .update(update)
    .eq("github_login", username.toLowerCase())
    .select("github_login, for_hire, hire_headline, hire_rate_usd_hourly, hire_availability, hire_contact_url, hire_skills, hire_bio")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user: data });
}

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
