import { createServiceSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vibe Coders for Hire — Vibe Code City",
  description:
    "AI-native developers available for short-term builds, MVPs, and production launches. Browse vibe coders ranked by what they ship.",
  openGraph: {
    title: "Vibe Coders for Hire",
    description:
      "AI-native devs ready to build. Browse vibe coders by rate, availability, and skills.",
    type: "website",
  },
};

export const revalidate = 60;

export default async function HirePage() {
  const supabase = createServiceSupabase();

  const { data: coders } = await supabase
    .from("users")
    .select("*")
    .eq("for_hire", true)
    .order("total_contributions", { ascending: false });

  const list = coders ?? [];

  return (
    <main className="min-h-screen overflow-auto bg-[#0d0400]">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-2">
          <Link
            href="/"
            className="font-pixel text-[10px] text-[#5a3a2a] hover:text-[#ff6b35]"
          >
            ← BACK TO CITY
          </Link>
        </div>

        <div className="mb-2 flex items-center gap-3">
          <h1 className="font-pixel text-2xl text-[#7fff6b]">VIBE CODERS FOR HIRE</h1>
          <span className="border border-[#7fff6b] px-2 py-0.5 font-pixel text-[9px] text-[#7fff6b]">
            {list.length} AVAILABLE
          </span>
        </div>
        <p className="mb-6 max-w-2xl font-pixel text-[10px] leading-relaxed text-[#8a5a3a]">
          AI-native developers ready to ship. Each profile is a real GitHub builder.
          Pick one, click hire, get back to building.
        </p>

        {list.length === 0 ? (
          <div className="border border-[#2a1a0f] bg-[#1a0a04] p-8 text-center">
            <p className="font-pixel text-xs text-[#8a5a3a]">
              No vibe coders for hire yet. Be the first.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {list.map((coder) => (
              <Link
                key={coder.id}
                href={`/user/${coder.github_login}`}
                className="group block border border-[#2a4a2a] bg-gradient-to-br from-[#0d1f0d] to-[#1a0a04] p-5 transition-all hover:border-[#7fff6b] hover:shadow-[0_4px_0_#2a4a2a]"
              >
                {/* Top row: avatar + name + rate */}
                <div className="mb-3 flex items-start gap-3">
                  {coder.avatar_url && (
                    <img
                      src={coder.avatar_url}
                      alt={coder.github_login}
                      width={56}
                      height={56}
                      className="border-2 border-[#7fff6b]"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-pixel text-sm text-[#7fff6b]">
                      {coder.github_login}
                    </div>
                    {coder.name && (
                      <div className="font-pixel text-[10px] text-[#8a5a3a] truncate">
                        {coder.name}
                      </div>
                    )}
                  </div>
                  {coder.hire_rate_usd_hourly && (
                    <div className="text-right">
                      <div className="font-pixel text-lg text-[#7fff6b]">
                        ${coder.hire_rate_usd_hourly}
                      </div>
                      <div className="font-pixel text-[8px] text-[#5a8a5a]">/hr</div>
                    </div>
                  )}
                </div>

                {/* Headline */}
                {coder.hire_headline && (
                  <p className="mb-3 font-pixel text-xs leading-snug text-[#ff8c5a]">
                    {coder.hire_headline}
                  </p>
                )}

                {/* Skills */}
                {coder.hire_skills && coder.hire_skills.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {coder.hire_skills.slice(0, 6).map((skill: string) => (
                      <span
                        key={skill}
                        className="border border-[#2a4a2a] bg-[#0d1408] px-1.5 py-0.5 font-pixel text-[8px] text-[#a0c0a0]"
                      >
                        {skill}
                      </span>
                    ))}
                    {coder.hire_skills.length > 6 && (
                      <span className="font-pixel text-[8px] text-[#5a8a5a]">
                        +{coder.hire_skills.length - 6}
                      </span>
                    )}
                  </div>
                )}

                {/* GitHub stats */}
                <div className="mb-3 flex gap-3 font-pixel text-[9px] text-[#3a2a1f]">
                  {coder.total_contributions > 0 && (
                    <span>{coder.total_contributions.toLocaleString()} commits</span>
                  )}
                  {coder.total_stars > 0 && (
                    <span>★ {coder.total_stars.toLocaleString()}</span>
                  )}
                </div>

                {/* Bottom row: availability + view profile */}
                <div className="flex items-center justify-between border-t border-[#2a4a2a] pt-3">
                  {coder.hire_availability && (
                    <span className="font-pixel text-[9px] text-[#5a8a5a]">
                      ● {coder.hire_availability}
                    </span>
                  )}
                  <span className="font-pixel text-[10px] text-[#7fff6b] group-hover:text-[#a0ff80]">
                    VIEW PROFILE →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Self-listing CTA */}
        <div className="mt-8 border-t border-[#2a1a0f] pt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-pixel text-[10px] text-[#5a3a2a]">
            Want to be listed? Sign in with GitHub on your profile page and toggle{" "}
            <span className="text-[#7fff6b]">FOR HIRE</span>.
          </p>
          <div className="flex gap-3 shrink-0">
            <Link href="/jobs" className="font-pixel text-[10px] text-[#ffd166] hover:underline">
              Browse open jobs →
            </Link>
            <Link href="/leaderboard" className="font-pixel text-[10px] text-[#8a5a3a] hover:underline">
              Leaderboard →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
