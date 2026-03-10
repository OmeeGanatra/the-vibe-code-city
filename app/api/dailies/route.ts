import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

const GOALS = { visits: 3, districts: 2 };

/** Start of today in ISO string (UTC date only). */
function todayStart(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10) + "T00:00:00.000Z";
}

// GET /api/dailies — Today's progress for the current user (from session)
export async function GET() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to track dailies" }, { status: 401 });
  }

  const startOfDay = todayStart();

  const { data: visitEvents } = await supabase
    .from("activity_events")
    .select("payload")
    .eq("user_id", user.id)
    .eq("event_type", "daily_visit")
    .gte("created_at", startOfDay);

  const { data: districtEvents } = await supabase
    .from("activity_events")
    .select("payload")
    .eq("user_id", user.id)
    .eq("event_type", "daily_district")
    .gte("created_at", startOfDay);

  const visitIds = new Set(
    (visitEvents ?? [])
      .map((e) => (e.payload as { project_id?: string })?.project_id)
      .filter(Boolean)
  );
  const districtIds = new Set(
    (districtEvents ?? [])
      .map((e) => (e.payload as { district?: string })?.district)
      .filter(Boolean)
  );

  const visits = visitIds.size;
  const districts = districtIds.size;
  const completed =
    visits >= GOALS.visits && districts >= GOALS.districts;

  return NextResponse.json({
    visits,
    districts,
    goals: GOALS,
    completed,
  });
}
