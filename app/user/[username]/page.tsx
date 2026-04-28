import { createServiceSupabase } from "@/lib/supabase/server";
import { generateBuildingParams } from "@/lib/services/building-generator";
import { getUserAchievements } from "@/lib/services/achievements";
import { getKudosForUser, getKudosCount } from "@/lib/services/kudos";
import { syncUser } from "@/lib/services/github";
import Link from "next/link";
import type { Metadata } from "next";
import allProjects from "@/data/projects.json";

// ── SYSTEM 3 & 13: Developer Profile with ISR ──────────────

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const cardUrl = `${process.env.NEXT_PUBLIC_URL ?? ""}/api/share-card?username=${username}`;
  return {
    title: `${username} — Vibe Code City`,
    description: `${username}'s building in Vibe Code City`,
    openGraph: {
      title: `${username} — Vibe Code City`,
      description: `Check out ${username}'s building`,
      images: [{ url: cardUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      images: [cardUrl],
    },
  };
}

export const revalidate = 300; // ISR: revalidate every 5 minutes

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = createServiceSupabase();

  // Fetch or sync user
  let { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("github_login", username)
    .single();

  if (!user) {
    try {
      user = await syncUser(username);
    } catch {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#0d0400]">
          <div className="text-center">
            <div className="mb-4 font-pixel text-2xl text-[#ff6b35]">404</div>
            <p className="font-pixel text-sm text-[#8a5a3a]">User not found</p>
            <Link
              href="/"
              className="mt-4 inline-block font-pixel text-xs text-[#5a3a2a] hover:text-[#ff6b35]"
            >
              ← Back to City
            </Link>
          </div>
        </main>
      );
    }
  }

  // Fetch related data
  const [{ data: repos }, achievements, kudos, kudosCount] = await Promise.all([
    supabase
      .from("repositories")
      .select("*")
      .eq("user_id", user.id)
      .order("stars", { ascending: false })
      .limit(8),
    getUserAchievements(user.id),
    getKudosForUser(user.id, 10),
    getKudosCount(user.id),
  ]);

  const building = generateBuildingParams(user);

  const vibeProjects = (allProjects as { id: string; name: string; description: string; url: string; githubUrl?: string; category: string; upvotes: number }[]).filter((p) => {
    const owner = p.githubUrl?.match(/github\.com\/([^/?#]+)/i)?.[1]?.toLowerCase();
    return owner === username.toLowerCase();
  });

  const rarityColors: Record<string, string> = {
    common: "#8a5a3a",
    rare: "#6b8cff",
    epic: "#c77dff",
    legendary: "#ffd166",
  };

  return (
    <main className="min-h-screen overflow-auto bg-[#0d0400]">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-2">
          <Link href="/" className="font-pixel text-[10px] text-[#5a3a2a] hover:text-[#ff6b35]">
            ← BACK TO CITY
          </Link>
        </div>

        <div className="flex items-start gap-6 border-b border-[#2a1a0f] pb-6">
          {/* Avatar */}
          {user.avatar_url && (
            <img
              src={user.avatar_url}
              alt={user.github_login}
              width={80}
              height={80}
              className="border-2 border-[#ff6b35]"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-pixel text-xl text-[#ff6b35]">{user.github_login}</h1>
              {user.for_hire && (
                <span className="animate-pulse border border-[#7fff6b] bg-[#0d1f0d] px-2 py-0.5 font-pixel text-[9px] text-[#7fff6b]">
                  ● FOR HIRE
                </span>
              )}
            </div>
            {user.name && (
              <p className="font-pixel text-xs text-[#8a5a3a]">{user.name}</p>
            )}
            {user.bio && (
              <p className="mt-1 font-pixel text-[10px] leading-relaxed text-[#c09878]">
                {user.bio}
              </p>
            )}
            {user.claimed && (
              <span className="mt-1 inline-block border border-[#ff6b35] px-2 py-0.5 font-pixel text-[9px] text-[#ff6b35]">
                CLAIMED
              </span>
            )}
          </div>
        </div>

        {/* FOR HIRE Panel */}
        {user.for_hire && (
          <div className="mt-6 border-2 border-[#7fff6b] bg-gradient-to-br from-[#0d1f0d] to-[#1a0a04] p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="font-pixel text-[10px] uppercase tracking-widest text-[#7fff6b]">
                ● Available for hire
              </span>
              {user.hire_rate_usd_hourly && (
                <span className="font-pixel text-lg text-[#7fff6b]">
                  ${user.hire_rate_usd_hourly}
                  <span className="text-[10px] text-[#5a8a5a]">/hr</span>
                </span>
              )}
            </div>
            {user.hire_headline && (
              <h2 className="mb-2 font-pixel text-base leading-snug text-[#ff8c5a]">
                {user.hire_headline}
              </h2>
            )}
            {user.hire_bio && (
              <p className="mb-3 font-pixel text-[10px] leading-relaxed text-[#c09878]">
                {user.hire_bio}
              </p>
            )}
            {user.hire_skills && user.hire_skills.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1">
                {user.hire_skills.map((skill) => (
                  <span
                    key={skill}
                    className="border border-[#2a4a2a] bg-[#0d1408] px-2 py-0.5 font-pixel text-[9px] text-[#a0c0a0]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between">
              {user.hire_availability && (
                <span className="font-pixel text-[9px] text-[#5a8a5a]">
                  {user.hire_availability}
                </span>
              )}
              {user.hire_contact_url && (
                <a
                  href={user.hire_contact_url}
                  className="btn-press inline-block bg-[#7fff6b] px-5 py-2 font-pixel text-xs text-[#0d0400] hover:bg-[#a0ff80]"
                  style={{ boxShadow: "0 4px 0 #2a4a2a" }}
                >
                  HIRE {user.github_login.toUpperCase()} →
                </a>
              )}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Contributions", value: user.total_contributions.toLocaleString() },
            { label: "Stars", value: user.total_stars.toLocaleString() },
            { label: "Repos", value: user.public_repos.toString() },
            { label: "Kudos", value: kudosCount.toString() },
          ].map((stat) => (
            <div key={stat.label} className="border border-[#2a1a0f] bg-[#1a0a04] p-3">
              <div className="font-pixel text-lg text-[#ff6b35]">{stat.value}</div>
              <div className="font-pixel text-[9px] uppercase text-[#5a3a2a]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Building Preview Stats */}
        <div className="mt-6 border border-[#2a1a0f] bg-[#1a0a04] p-4">
          <div className="mb-2 font-pixel text-xs uppercase text-[#5a3a2a]">
            Building Stats
          </div>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
            <div>
              <div className="font-pixel text-sm text-[#ff8c5a]">{building.height}u</div>
              <div className="font-pixel text-[9px] text-[#5a3a2a]">height</div>
            </div>
            <div>
              <div className="font-pixel text-sm text-[#ff8c5a]">{building.width}u</div>
              <div className="font-pixel text-[9px] text-[#5a3a2a]">width</div>
            </div>
            <div>
              <div className="font-pixel text-sm text-[#ff8c5a]">{building.floors}</div>
              <div className="font-pixel text-[9px] text-[#5a3a2a]">floors</div>
            </div>
            <div>
              <div className="font-pixel text-sm text-[#ff8c5a]">
                {Math.round(building.litPercentage * 100)}%
              </div>
              <div className="font-pixel text-[9px] text-[#5a3a2a]">lit</div>
            </div>
            <div>
              <div className="font-pixel text-sm text-[#ff8c5a]">
                {building.decorations.length}
              </div>
              <div className="font-pixel text-[9px] text-[#5a3a2a]">decor</div>
            </div>
          </div>

          {/* Mini building color preview */}
          <div className="mt-3 flex gap-1">
            {building.windowLitColors.map((c, i) => (
              <div key={i} className="h-4 w-4" style={{ backgroundColor: c }} />
            ))}
            <div className="h-4 w-4" style={{ backgroundColor: building.faceColor }} />
            <div className="h-4 w-4" style={{ backgroundColor: building.roofColor }} />
          </div>
        </div>

        {/* Top Repositories */}
        {repos && repos.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 font-pixel text-xs uppercase text-[#5a3a2a]">
              Top Repositories
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {repos.map((repo) => (
                <a
                  key={repo.id}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border border-[#2a1a0f] bg-[#1a0a04] p-3 transition-colors hover:border-[#ff6b35]"
                >
                  <div className="font-pixel text-xs text-[#ff8c5a]">{repo.name}</div>
                  {repo.description && (
                    <p className="mt-1 font-pixel text-[9px] text-[#8a5a3a] line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                  <div className="mt-2 flex gap-3 font-pixel text-[9px] text-[#5a3a2a]">
                    {repo.language && <span>{repo.language}</span>}
                    <span>★ {repo.stars}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Vibe Projects in the City */}
        {vibeProjects.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 font-pixel text-xs uppercase text-[#5a3a2a]">
              In the City ({vibeProjects.length})
            </h2>
            <div className="flex flex-col gap-2">
              {vibeProjects.map((p) => (
                <a
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border border-[#2a1a0f] bg-[#1a0a04] p-3 transition-colors hover:border-[#ffd166]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-pixel text-xs text-[#ffd166]">{p.name}</div>
                    {p.upvotes > 0 && (
                      <span className="font-pixel text-[9px] text-[#ff8c5a]">▲ {p.upvotes.toLocaleString()}</span>
                    )}
                  </div>
                  <p className="mt-1 font-pixel text-[9px] leading-relaxed text-[#8a5a3a] line-clamp-2">
                    {p.description}
                  </p>
                  <div className="mt-1 font-pixel text-[9px] text-[#3a2a1f]">{p.category}</div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 font-pixel text-xs uppercase text-[#5a3a2a]">
              Achievements ({achievements.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {achievements.map((ua) => {
                const a = (ua as unknown as { achievements: { icon: string; name: string; rarity: string; description: string } }).achievements;
                return (
                  <div
                    key={ua.id}
                    className="border px-3 py-2"
                    style={{
                      borderColor: rarityColors[a.rarity] ?? "#2a1a0f",
                      backgroundColor: "#1a0a04",
                    }}
                    title={a.description}
                  >
                    <span className="mr-1">{a.icon}</span>
                    <span
                      className="font-pixel text-[10px]"
                      style={{ color: rarityColors[a.rarity] }}
                    >
                      {a.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Kudos Received */}
        {kudos.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 font-pixel text-xs uppercase text-[#5a3a2a]">
              Recent Kudos
            </h2>
            <div className="flex flex-col gap-2">
              {kudos.map((k) => {
                const sender = k.from_user as unknown as {
                  github_login: string;
                  avatar_url: string | null;
                };
                return (
                  <div
                    key={k.id}
                    className="flex items-start gap-2 border border-[#2a1a0f] bg-[#1a0a04] p-3"
                  >
                    {sender?.avatar_url && (
                      <img
                        src={sender.avatar_url}
                        alt=""
                        width={24}
                        height={24}
                        className="border border-[#2a1a0f]"
                      />
                    )}
                    <div>
                      <span className="font-pixel text-[10px] text-[#ff8c5a]">
                        {sender?.github_login}
                      </span>
                      {k.message && (
                        <p className="mt-0.5 font-pixel text-[9px] text-[#8a5a3a]">
                          {k.message}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
