import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { generateBuildingParams } from "@/lib/services/building-generator";
import { getShareCardData } from "@/lib/services/share-card";
import { getKudosCount } from "@/lib/services/kudos";

// GET /api/share?username=xxx — Get share card data
export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");
  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("github_login", username)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const building = generateBuildingParams(user);
  const kudosCount = await getKudosCount(user.id);

  const { count: achievementCount } = await supabase
    .from("user_achievements")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const data = getShareCardData(user, building, kudosCount, achievementCount ?? 0);

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
