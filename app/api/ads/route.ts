import { NextRequest, NextResponse } from "next/server";
import {
  createAdCampaign,
  fundCampaign,
  getActiveAds,
  recordAdClick,
  recordAdImpression,
  getCampaignStats,
} from "@/lib/services/ads";

// GET /api/ads — Get active ads (optionally filtered by category)
export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category") ?? undefined;
  const campaignId = req.nextUrl.searchParams.get("campaign_id");

  if (campaignId) {
    const stats = await getCampaignStats(campaignId);
    return NextResponse.json(stats);
  }

  const ads = await getActiveAds(category);
  return NextResponse.json({ ads });
}

// POST /api/ads — Create campaign, fund, or track clicks/impressions
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "create") {
    const { advertiser_id, ...campaign } = body;
    if (!advertiser_id) {
      return NextResponse.json({ error: "advertiser_id required" }, { status: 400 });
    }
    try {
      const result = await createAdCampaign(advertiser_id, campaign);
      return NextResponse.json(result);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed" },
        { status: 400 }
      );
    }
  }

  if (action === "fund") {
    const { campaign_id, return_url } = body;
    if (!campaign_id) {
      return NextResponse.json({ error: "campaign_id required" }, { status: 400 });
    }
    const result = await fundCampaign(
      campaign_id,
      return_url || `${process.env.NEXT_PUBLIC_URL}/advertise`
    );
    return NextResponse.json(result);
  }

  if (action === "click") {
    const { campaign_id, user_id, building_id } = body;
    if (!campaign_id) {
      return NextResponse.json({ error: "campaign_id required" }, { status: 400 });
    }
    await recordAdClick(campaign_id, user_id, building_id);
    return NextResponse.json({ ok: true });
  }

  if (action === "impression") {
    const { campaign_id, user_id, building_id } = body;
    if (!campaign_id) {
      return NextResponse.json({ error: "campaign_id required" }, { status: 400 });
    }
    await recordAdImpression(campaign_id, user_id, building_id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
