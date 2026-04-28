import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";

const CONTACT_PATTERN = /^(https?:\/\/|mailto:|tel:)/i;

// GET /api/jobs — list active jobs (most recent first)
export async function GET(req: NextRequest) {
  const skill = req.nextUrl.searchParams.get("skill");
  const remote = req.nextUrl.searchParams.get("remote");

  const supabase = createServiceSupabase();
  let query = supabase
    .from("jobs")
    .select("*")
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (skill) query = query.contains("skills", [skill]);
  if (remote === "true") query = query.eq("remote", true);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { count: data?.length ?? 0, jobs: data ?? [] },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300",
      },
    }
  );
}

// POST /api/jobs — post a new job
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    company_name,
    poster_email,
    title,
    description,
    contact_url,
    budget_min_usd,
    budget_max_usd,
    budget_type,
    remote,
    location,
    skills,
  } = body;

  // Validation
  if (
    typeof company_name !== "string" ||
    typeof poster_email !== "string" ||
    typeof title !== "string" ||
    typeof description !== "string" ||
    typeof contact_url !== "string" ||
    !company_name.trim() ||
    !title.trim() ||
    !description.trim()
  ) {
    return NextResponse.json(
      { error: "company_name, poster_email, title, description, contact_url required" },
      { status: 400 }
    );
  }

  if (!CONTACT_PATTERN.test(contact_url)) {
    return NextResponse.json(
      { error: "contact_url must start with https://, http://, mailto:, or tel:" },
      { status: 400 }
    );
  }

  const skillsArr = Array.isArray(skills)
    ? skills.filter((s): s is string => typeof s === "string").slice(0, 12)
    : [];

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("jobs")
    .insert({
      company_name: company_name.slice(0, 80),
      poster_email: poster_email.slice(0, 200),
      title: title.slice(0, 120),
      description: description.slice(0, 3000),
      contact_url: contact_url.slice(0, 500),
      budget_min_usd: typeof budget_min_usd === "number" ? budget_min_usd : null,
      budget_max_usd: typeof budget_max_usd === "number" ? budget_max_usd : null,
      budget_type:
        budget_type === "hourly" || budget_type === "salary" ? budget_type : "project",
      remote: remote !== false,
      location: typeof location === "string" ? location.slice(0, 80) : null,
      skills: skillsArr,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ job: data }, { status: 201 });
}
