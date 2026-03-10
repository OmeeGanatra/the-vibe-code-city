import { createServiceSupabase } from "@/lib/supabase/server";

// ── SYSTEM 5: Social Layer — Kudos ──────────────────────────

export async function sendKudos(
  fromUserId: string,
  toUserId: string,
  message?: string
) {
  const supabase = createServiceSupabase();

  // Rate limit: max 10 kudos per user per day
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("kudos")
    .select("*", { count: "exact", head: true })
    .eq("from_user_id", fromUserId)
    .gte("created_at", dayAgo);

  if ((count ?? 0) >= 10) {
    throw new Error("Daily kudos limit reached (10 per day)");
  }

  const { data, error } = await supabase
    .from("kudos")
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      message: message?.slice(0, 280),
    })
    .select()
    .single();

  if (error) throw error;

  // Log activity events for both sender and receiver
  await supabase.from("activity_events").insert([
    {
      user_id: fromUserId,
      event_type: "kudos_sent",
      payload: { to_user_id: toUserId, kudos_id: data.id },
    },
    {
      user_id: toUserId,
      event_type: "kudos_received",
      payload: { from_user_id: fromUserId, kudos_id: data.id },
    },
  ]);

  return data;
}

export async function getKudosForUser(userId: string, limit = 20) {
  const supabase = createServiceSupabase();

  const { data } = await supabase
    .from("kudos")
    .select("*, from_user:users!kudos_from_user_id_fkey(github_login, name, avatar_url)")
    .eq("to_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function getKudosCount(userId: string): Promise<number> {
  const supabase = createServiceSupabase();
  const { count } = await supabase
    .from("kudos")
    .select("*", { count: "exact", head: true })
    .eq("to_user_id", userId);
  return count ?? 0;
}

// ── Activity Feed ───────────────────────────────────────────

export async function getActivityFeed(userId?: string, limit = 50) {
  const supabase = createServiceSupabase();

  let query = supabase
    .from("activity_events")
    .select("*, user:users(github_login, name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data } = await query;
  return data ?? [];
}

// ── Referrals ───────────────────────────────────────────────

export async function createReferral(referrerCode: string, referredUserId: string) {
  const supabase = createServiceSupabase();

  // Look up referrer by code
  const { data: referrer } = await supabase
    .from("users")
    .select("id")
    .eq("referral_code", referrerCode)
    .single();

  if (!referrer) throw new Error("Invalid referral code");
  if (referrer.id === referredUserId) throw new Error("Cannot refer yourself");

  const { error } = await supabase.from("referrals").insert({
    referrer_id: referrer.id,
    referred_id: referredUserId,
  });

  if (error) {
    if (error.code === "23505") throw new Error("Already referred");
    throw error;
  }

  // Update referred_by on user
  await supabase
    .from("users")
    .update({ referred_by: referrer.id })
    .eq("id", referredUserId);

  // Log activity
  await supabase.from("activity_events").insert({
    user_id: referrer.id,
    event_type: "referral_completed",
    payload: { referred_user_id: referredUserId },
  });

  return { referrer_id: referrer.id };
}
