import { createServiceSupabase } from "@/lib/supabase/server";
import type { User } from "@/lib/supabase/types";

// ── SYSTEM 4: Achievement System ────────────────────────────
// Checks user stats against achievement thresholds and awards
// any milestones that haven't been earned yet.

interface AchievementCheck {
  id: string;
  check: (user: User, context: AchievementContext) => boolean;
}

interface AchievementContext {
  kudosReceivedCount: number;
  kudosSentCount: number;
  purchaseCount: number;
  referralCount: number;
  hasEquippedItems: boolean;
}

const ACHIEVEMENT_CHECKS: AchievementCheck[] = [
  // Contribution milestones
  { id: "first_commit", check: (u) => u.total_contributions >= 1 },
  { id: "100_commits", check: (u) => u.total_contributions >= 100 },
  { id: "500_commits", check: (u) => u.total_contributions >= 500 },
  { id: "1000_commits", check: (u) => u.total_contributions >= 1000 },
  { id: "5000_commits", check: (u) => u.total_contributions >= 5000 },

  // Repository milestones
  { id: "1_repository", check: (u) => u.public_repos >= 1 },
  { id: "10_repositories", check: (u) => u.public_repos >= 10 },
  { id: "50_repositories", check: (u) => u.public_repos >= 50 },
  { id: "100_repositories", check: (u) => u.public_repos >= 100 },

  // Star milestones
  { id: "1_star", check: (u) => u.total_stars >= 1 },
  { id: "10_stars", check: (u) => u.total_stars >= 10 },
  { id: "100_stars", check: (u) => u.total_stars >= 100 },
  { id: "1000_stars", check: (u) => u.total_stars >= 1000 },
  { id: "10000_stars", check: (u) => u.total_stars >= 10000 },

  // Social milestones
  { id: "claimed_building", check: (u) => u.claimed },
  { id: "first_kudos_sent", check: (_, ctx) => ctx.kudosSentCount >= 1 },
  { id: "10_kudos_received", check: (_, ctx) => ctx.kudosReceivedCount >= 10 },
  { id: "first_purchase", check: (_, ctx) => ctx.purchaseCount >= 1 },
  { id: "first_referral", check: (_, ctx) => ctx.referralCount >= 1 },
  { id: "customized_building", check: (_, ctx) => ctx.hasEquippedItems },
];

export async function evaluateAchievements(userId: string): Promise<string[]> {
  const supabase = createServiceSupabase();

  // Fetch user
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (!user) return [];

  // Fetch existing achievements
  const { data: existing } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  const earnedSet = new Set(existing?.map((a: { achievement_id: string }) => a.achievement_id) ?? []);

  // Build context
  const { count: kudosReceived } = await supabase
    .from("kudos")
    .select("*", { count: "exact", head: true })
    .eq("to_user_id", userId);

  const { count: kudosSent } = await supabase
    .from("kudos")
    .select("*", { count: "exact", head: true })
    .eq("from_user_id", userId);

  const { count: purchases } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed");

  const { count: referrals } = await supabase
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", userId);

  const { count: equippedCount } = await supabase
    .from("equipped_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const context: AchievementContext = {
    kudosReceivedCount: kudosReceived ?? 0,
    kudosSentCount: kudosSent ?? 0,
    purchaseCount: purchases ?? 0,
    referralCount: referrals ?? 0,
    hasEquippedItems: (equippedCount ?? 0) > 0,
  };

  // Check each achievement
  const newlyEarned: string[] = [];

  for (const check of ACHIEVEMENT_CHECKS) {
    if (earnedSet.has(check.id)) continue;
    if (!check.check(user, context)) continue;

    const { error } = await supabase.from("user_achievements").insert({
      user_id: userId,
      achievement_id: check.id,
    });

    if (!error) {
      newlyEarned.push(check.id);

      // Log activity event
      await supabase.from("activity_events").insert({
        user_id: userId,
        event_type: "achievement_earned",
        payload: { achievement_id: check.id },
      });
    }
  }

  return newlyEarned;
}

export async function getUserAchievements(userId: string) {
  const supabase = createServiceSupabase();

  const { data } = await supabase
    .from("user_achievements")
    .select("*, achievements(*)")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });

  return data ?? [];
}
