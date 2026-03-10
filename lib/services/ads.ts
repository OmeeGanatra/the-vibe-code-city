import { createServiceSupabase } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

// ── SYSTEM 10: Advertising Platform ─────────────────────────

export async function createAdCampaign(
  advertiserId: string,
  campaign: {
    name: string;
    headline: string;
    body?: string;
    cta_text?: string;
    cta_url: string;
    image_url?: string;
    target_category?: string;
    budget_cents: number;
    cpc_cents?: number;
  }
) {
  const supabase = createServiceSupabase();

  const { data, error } = await supabase
    .from("ad_campaigns")
    .insert({
      advertiser_id: advertiserId,
      name: campaign.name,
      headline: campaign.headline,
      body: campaign.body,
      cta_text: campaign.cta_text ?? "Learn More",
      cta_url: campaign.cta_url,
      image_url: campaign.image_url,
      target_category: campaign.target_category,
      budget_cents: campaign.budget_cents,
      cpc_cents: campaign.cpc_cents ?? 10,
      status: "draft",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fundCampaign(campaignId: string, returnUrl: string) {
  const supabase = createServiceSupabase();

  const { data: campaign } = await supabase
    .from("ad_campaigns")
    .select("*, advertiser:users(stripe_customer_id, email, github_login)")
    .eq("id", campaignId)
    .single();

  if (!campaign) throw new Error("Campaign not found");

  const advertiser = campaign.advertiser as unknown as {
    stripe_customer_id: string | null;
    email: string | null;
    github_login: string;
  };

  let customerId = advertiser.stripe_customer_id;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: advertiser.email ?? undefined,
      metadata: { user_id: campaign.advertiser_id },
    });
    customerId = customer.id;
    await supabase
      .from("users")
      .update({ stripe_customer_id: customerId })
      .eq("id", campaign.advertiser_id);
  }

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Ad Campaign: ${campaign.name}`,
            description: `Budget: $${(campaign.budget_cents / 100).toFixed(2)}`,
          },
          unit_amount: campaign.budget_cents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      campaign_id: campaignId,
      type: "ad_campaign",
    },
    success_url: `${returnUrl}?funded=true&campaign=${campaignId}`,
    cancel_url: `${returnUrl}?canceled=true`,
  });

  await supabase
    .from("ad_campaigns")
    .update({ stripe_payment_intent: session.id, status: "pending" })
    .eq("id", campaignId);

  return { url: session.url };
}

export async function activateCampaign(campaignId: string) {
  const supabase = createServiceSupabase();
  await supabase
    .from("ad_campaigns")
    .update({ status: "active", starts_at: new Date().toISOString() })
    .eq("id", campaignId);
}

export async function getActiveAds(category?: string) {
  const supabase = createServiceSupabase();

  let query = supabase
    .from("ad_campaigns")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (category) {
    query = query.or(`target_category.eq.${category},target_category.is.null`);
  }

  const { data } = await query;
  return data ?? [];
}

export async function recordAdClick(
  campaignId: string,
  userId?: string,
  buildingId?: string
) {
  const supabase = createServiceSupabase();

  // Record click
  await supabase.from("ad_clicks").insert({
    campaign_id: campaignId,
    user_id: userId ?? null,
    building_id: buildingId ?? null,
  });

  // Increment spent
  const { data: campaign } = await supabase
    .from("ad_campaigns")
    .select("cpc_cents, spent_cents, budget_cents")
    .eq("id", campaignId)
    .single();

  if (!campaign) return;

  const newSpent = campaign.spent_cents + campaign.cpc_cents;
  const update: Record<string, unknown> = { spent_cents: newSpent };

  // Auto-pause if budget exhausted
  if (newSpent >= campaign.budget_cents) {
    update.status = "completed";
    update.ends_at = new Date().toISOString();
  }

  await supabase.from("ad_campaigns").update(update).eq("id", campaignId);
}

export async function recordAdImpression(
  campaignId: string,
  userId?: string,
  buildingId?: string
) {
  const supabase = createServiceSupabase();
  await supabase.from("ad_impressions").insert({
    campaign_id: campaignId,
    user_id: userId ?? null,
    building_id: buildingId ?? null,
  });
}

export async function getCampaignStats(campaignId: string) {
  const supabase = createServiceSupabase();

  const [{ count: clicks }, { count: impressions }, { data: campaign }] =
    await Promise.all([
      supabase
        .from("ad_clicks")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaignId),
      supabase
        .from("ad_impressions")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaignId),
      supabase
        .from("ad_campaigns")
        .select("*")
        .eq("id", campaignId)
        .single(),
    ]);

  return {
    campaign,
    clicks: clicks ?? 0,
    impressions: impressions ?? 0,
    ctr: (impressions ?? 0) > 0
      ? ((clicks ?? 0) / (impressions ?? 1)) * 100
      : 0,
    spent: campaign?.spent_cents ?? 0,
    remaining: (campaign?.budget_cents ?? 0) - (campaign?.spent_cents ?? 0),
  };
}
