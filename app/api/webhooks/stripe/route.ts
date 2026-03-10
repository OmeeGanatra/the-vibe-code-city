import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { fulfillOrder } from "@/lib/services/shop";
import { activateCampaign } from "@/lib/services/ads";
import { createServiceSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const metadata = session.metadata ?? {};

    if (metadata.order_id) {
      // Shop purchase
      await fulfillOrder(session.id);
    }

    if (metadata.campaign_id && metadata.type === "ad_campaign") {
      // Ad campaign funding
      await activateCampaign(metadata.campaign_id);
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    const metadata = session.metadata ?? {};

    if (metadata.order_id) {
      const supabase = createServiceSupabase();
      await supabase
        .from("orders")
        .update({ status: "failed" })
        .eq("stripe_session_id", session.id);
    }
  }

  return NextResponse.json({ received: true });
}
