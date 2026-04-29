import { createServiceSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard — Vibe Code City",
  description: "Top vibe coders ranked by GitHub contributions, stars, and availability for hire.",
};

export const revalidate = 300;

export default async function LeaderboardPage() {
  const supabase = createServiceSupabase();

  const [{ data: byContribs }, { data: byStars }, { data: forHire }] = await Promise.all([
    supabase
      .from("users")
      .select("github_login, avatar_url, total_contributions, total_stars, claimed")
      .order("total_contributions", { ascending: false })
      .limit(20),
    supabase
      .from("users")
      .select("github_login, avatar_url, total_contributions, total_stars, claimed")
      .order("total_stars", { ascending: false })
      .limit(20),
    supabase
      .from("users")
      .select("github_login, avatar_url, hire_headline, hire_rate_usd_hourly, total_contributions")
      .eq("for_hire", true)
      .order("total_contributions", { ascending: false })
      .limit(9),
  ]);

  const Medal = ({ rank }: { rank: number }) => {
    const colors = ["#ffd166", "#c0c0c0", "#cd7f32"];
    if (rank <= 3) {
      return <span style={{ color: colors[rank - 1] }} className="w-6 shrink-0 font-pixel text-sm">#{rank}</span>;
    }
    return <span className="w-6 shrink-0 font-pixel text-xs text-[#5a3a2a]">#{rank}</span>;
  };

  const Row = ({ login, avatar, claimed, right }: { login: string; avatar: string | null; claimed: boolean; right: string }) => (
    <Link
      href={`/user/${login}`}
      className="flex items-center gap-3 border border-[#2a1a0f] bg-[#1a0a04] px-3 py-2 transition-colors hover:border-[#ffd166]"
    >
      {avatar && <img src={avatar} alt="" width={24} height={24} className="shrink-0 border border-[#2a1a0f]" />}
      <span className="flex-1 font-pixel text-xs text-[#ff8c5a] truncate">{login}</span>
      {claimed && <span className="font-pixel text-[8px] text-[#ff6b35]">✓</span>}
      <span className="font-pixel text-[10px] text-[#ffd166] shrink-0">{right}</span>
    </Link>
  );

  return (
    <main className="min-h-screen overflow-auto bg-[#0d0400]">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-2">
          <Link href="/" className="font-pixel text-[10px] text-[#5a3a2a] hover:text-[#ff6b35]">
            ← BACK TO CITY
          </Link>
        </div>

        <h1 className="mb-1 font-pixel text-2xl text-[#ffd166]">LEADERBOARD</h1>
        <p className="mb-8 font-pixel text-[10px] text-[#8a5a3a]">
          Top builders in the city, ranked by what they ship.
        </p>

        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 font-pixel text-xs uppercase text-[#5a3a2a]">Most Active</h2>
            <div className="flex flex-col gap-1">
              {(byContribs ?? []).map((u, i) => (
                <div key={u.github_login} className="flex items-center gap-2">
                  <Medal rank={i + 1} />
                  <Row
                    login={u.github_login}
                    avatar={u.avatar_url}
                    claimed={u.claimed}
                    right={`${u.total_contributions.toLocaleString()} commits`}
                  />
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-pixel text-xs uppercase text-[#5a3a2a]">Most Starred</h2>
            <div className="flex flex-col gap-1">
              {(byStars ?? []).map((u, i) => (
                <div key={u.github_login} className="flex items-center gap-2">
                  <Medal rank={i + 1} />
                  <Row
                    login={u.github_login}
                    avatar={u.avatar_url}
                    claimed={u.claimed}
                    right={`★ ${u.total_stars.toLocaleString()}`}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        {(forHire ?? []).length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 font-pixel text-xs uppercase text-[#5a3a2a]">Available for Hire</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(forHire ?? []).map((u) => (
                <Link
                  key={u.github_login}
                  href={`/user/${u.github_login}`}
                  className="block border border-[#2a4a2a] bg-gradient-to-br from-[#0d1f0d] to-[#1a0a04] p-3 transition-colors hover:border-[#7fff6b]"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex-1 font-pixel text-xs text-[#7fff6b]">{u.github_login}</span>
                    {u.hire_rate_usd_hourly && (
                      <span className="font-pixel text-[10px] text-[#7fff6b]">${u.hire_rate_usd_hourly}/hr</span>
                    )}
                  </div>
                  {u.hire_headline && (
                    <p className="mt-1 font-pixel text-[9px] text-[#a0c0a0] line-clamp-1">{u.hire_headline}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-8 flex gap-4 border-t border-[#2a1a0f] pt-4">
          <Link href="/hire" className="font-pixel text-[10px] text-[#7fff6b] hover:underline">Browse hire directory →</Link>
          <Link href="/jobs" className="font-pixel text-[10px] text-[#ffd166] hover:underline">View open jobs →</Link>
        </div>
      </div>
    </main>
  );
}
