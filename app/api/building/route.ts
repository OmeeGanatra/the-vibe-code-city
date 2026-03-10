import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import {
  generateBuildingParams,
  buildingParamsToJSON,
} from "@/lib/services/building-generator";

// GET /api/building?username=xxx — Get building params for a user
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

  // Fetch equipped items
  const { data: equipped } = await supabase
    .from("equipped_items")
    .select("slot, item:items(slug)")
    .eq("user_id", user.id);

  const equippedItems = (equipped ?? []).map((e: { slot: string; item: unknown }) => ({
    slot: e.slot,
    slug: (e.item as unknown as { slug: string })?.slug ?? "",
  }));

  // Fetch global max stats for normalization
  const { data: maxStats } = await supabase
    .from("users")
    .select("total_contributions, total_stars")
    .order("total_contributions", { ascending: false })
    .limit(1)
    .single();

  const params = generateBuildingParams(
    user,
    maxStats?.total_contributions ?? 10000,
    maxStats?.total_stars ?? 50000,
    equippedItems
  );

  return NextResponse.json(buildingParamsToJSON(params), {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
