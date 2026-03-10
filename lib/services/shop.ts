import { createServiceSupabase } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

// ── SYSTEM 8: Shop System with Stripe ───────────────────────

export async function getShopItems() {
  const supabase = createServiceSupabase();
  const { data } = await supabase
    .from("items")
    .select("*")
    .eq("active", true)
    .order("price_cents", { ascending: true });
  return data ?? [];
}

export async function getUserInventory(userId: string) {
  const supabase = createServiceSupabase();
  const { data } = await supabase
    .from("inventories")
    .select("*, item:items(*)")
    .eq("user_id", userId);
  return data ?? [];
}

export async function getEquippedItems(userId: string) {
  const supabase = createServiceSupabase();
  const { data } = await supabase
    .from("equipped_items")
    .select("*, item:items(*)")
    .eq("user_id", userId);
  return data ?? [];
}

export async function equipItem(userId: string, itemId: string, slot: string) {
  const supabase = createServiceSupabase();

  // Verify ownership
  const { data: owned } = await supabase
    .from("inventories")
    .select("id")
    .eq("user_id", userId)
    .eq("item_id", itemId)
    .single();

  if (!owned) throw new Error("Item not in inventory");

  // Verify item type matches slot
  const { data: item } = await supabase
    .from("items")
    .select("item_type")
    .eq("id", itemId)
    .single();

  if (!item || item.item_type !== slot) throw new Error("Item type does not match slot");

  // Upsert equipped (replaces previous item in slot)
  await supabase.from("equipped_items").upsert(
    { user_id: userId, item_id: itemId, slot },
    { onConflict: "user_id,slot" }
  );

  return { success: true };
}

export async function unequipSlot(userId: string, slot: string) {
  const supabase = createServiceSupabase();
  await supabase
    .from("equipped_items")
    .delete()
    .eq("user_id", userId)
    .eq("slot", slot);
  return { success: true };
}

// ── Checkout Flow ───────────────────────────────────────────

export async function createCheckoutSession(
  userId: string,
  itemIds: string[],
  returnUrl: string
) {
  const supabase = createServiceSupabase();

  // Fetch items
  const { data: items } = await supabase
    .from("items")
    .select("*")
    .in("id", itemIds)
    .eq("active", true);

  if (!items || items.length === 0) throw new Error("No valid items selected");

  // Check user doesn't already own them
  const { data: owned } = await supabase
    .from("inventories")
    .select("item_id")
    .eq("user_id", userId)
    .in("item_id", itemIds);

  const ownedSet = new Set(owned?.map((i: { item_id: string }) => i.item_id) ?? []);
  const purchasableItems = items.filter((i: { id: string }) => !ownedSet.has(i.id));

  if (purchasableItems.length === 0) throw new Error("You already own all selected items");

  const totalCents = purchasableItems.reduce((s: number, i: { price_cents: number }) => s + i.price_cents, 0);

  // Get or create Stripe customer
  const { data: user } = await supabase
    .from("users")
    .select("stripe_customer_id, email, github_login")
    .eq("id", userId)
    .single();

  let customerId = user?.stripe_customer_id;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user?.email ?? undefined,
      metadata: { user_id: userId, github_login: user?.github_login ?? "" },
    });
    customerId = customer.id;
    await supabase
      .from("users")
      .update({ stripe_customer_id: customerId })
      .eq("id", userId);
  }

  // Create order record
  const { data: order } = await supabase
    .from("orders")
    .insert({ user_id: userId, total_cents: totalCents })
    .select()
    .single();

  if (!order) throw new Error("Failed to create order");

  // Create order items
  await supabase.from("order_items").insert(
    purchasableItems.map((item: { id: string; price_cents: number }) => ({
      order_id: order.id,
      item_id: item.id,
      price_cents: item.price_cents,
    }))
  );

  // Create Stripe checkout session
  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: purchasableItems.map((item: { name: string; description: string | null; price_cents: number }) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          description: item.description ?? undefined,
        },
        unit_amount: item.price_cents,
      },
      quantity: 1,
    })),
    metadata: {
      order_id: order.id,
      user_id: userId,
    },
    success_url: `${returnUrl}?success=true&order=${order.id}`,
    cancel_url: `${returnUrl}?canceled=true`,
  });

  // Store session ID on order
  await supabase
    .from("orders")
    .update({ stripe_session_id: session.id })
    .eq("id", order.id);

  return { sessionId: session.id, url: session.url };
}

// ── Webhook: Fulfill Order ──────────────────────────────────

export async function fulfillOrder(sessionId: string) {
  const supabase = createServiceSupabase();

  // Find the order
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items:order_items(item_id)")
    .eq("stripe_session_id", sessionId)
    .single();

  if (!order || order.status === "completed") return;

  // Mark completed
  await supabase
    .from("orders")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", order.id);

  // Add items to inventory
  const itemIds = (order as unknown as { order_items: { item_id: string }[] }).order_items.map(
    (oi) => oi.item_id
  );

  for (const itemId of itemIds) {
    await supabase.from("inventories").upsert(
      {
        user_id: order.user_id,
        item_id: itemId,
        acquired_via: "purchase",
      },
      { onConflict: "user_id,item_id" }
    );
  }

  // Log activity
  await supabase.from("activity_events").insert({
    user_id: order.user_id,
    event_type: "purchase_completed",
    payload: { order_id: order.id, item_count: itemIds.length },
  });
}
