import { createServiceSupabase } from "@/lib/supabase/server";
import { generateBuildingParams } from "@/lib/services/building-generator";
import { syncUser } from "@/lib/services/github";
import { getKudosCount } from "@/lib/services/kudos";
import Link from "next/link";
import type { Metadata } from "next";
import type { User } from "@/lib/supabase/types";
import type { BuildingParams } from "@/lib/services/building-generator";

// ── SYSTEM 9: Compare Mode ─────────────────────────────────

interface Props {
  params: Promise<{ user1: string; user2: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { user1, user2 } = await params;
  return {
    title: `${user1} vs ${user2} — Vibe Code City`,
    description: `Compare ${user1} and ${user2} buildings side by side`,
  };
}

export const revalidate = 300;

async function resolveUser(username: string): Promise<User | null> {
  const supabase = createServiceSupabase();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("github_login", username)
    .single();

  if (data) return data;

  try {
    return await syncUser(username);
  } catch {
    return null;
  }
}

function StatBar({
  label,
  left,
  right,
}: {
  label: string;
  left: number;
  right: number;
}) {
  const max = Math.max(left, right, 1);
  const leftPct = (left / max) * 100;
  const rightPct = (right / max) * 100;

  return (
    <div className="mb-3">
      <div className="mb-1 text-center font-pixel text-[9px] uppercase text-[#5a3a2a]">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <div className="font-pixel text-[10px] text-[#ff6b35] w-16 text-right">
          {left.toLocaleString()}
        </div>
        <div className="flex flex-1 gap-1">
          <div className="flex h-4 flex-1 justify-end bg-[#1a0a04]">
            <div
              className="h-full bg-[#ff6b35]"
              style={{ width: `${leftPct}%` }}
            />
          </div>
          <div className="flex h-4 flex-1 bg-[#1a0a04]">
            <div
              className="h-full bg-[#c77dff]"
              style={{ width: `${rightPct}%` }}
            />
          </div>
        </div>
        <div className="font-pixel text-[10px] text-[#c77dff] w-16">
          {right.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

export default async function ComparePage({ params }: Props) {
  const { user1: username1, user2: username2 } = await params;

  const [user1, user2] = await Promise.all([
    resolveUser(username1),
    resolveUser(username2),
  ]);

  if (!user1 || !user2) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d0400]">
        <div className="text-center">
          <div className="mb-4 font-pixel text-xl text-[#ff6b35]">Cannot Compare</div>
          <p className="font-pixel text-xs text-[#8a5a3a]">
            {!user1 ? `${username1} not found` : `${username2} not found`}
          </p>
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

  const [building1, building2, kudos1, kudos2] = await Promise.all([
    generateBuildingParams(user1) as BuildingParams,
    generateBuildingParams(user2) as BuildingParams,
    getKudosCount(user1.id),
    getKudosCount(user2.id),
  ]);

  return (
    <main className="min-h-screen overflow-auto bg-[#0d0400]">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-2">
          <Link href="/" className="font-pixel text-[10px] text-[#5a3a2a] hover:text-[#ff6b35]">
            ← BACK TO CITY
          </Link>
        </div>

        <h1 className="mb-6 text-center font-pixel text-lg text-[#ff6b35]">
          COMPARE BUILDINGS
        </h1>

        {/* User Headers */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user1.avatar_url && (
              <img
                src={user1.avatar_url}
                alt=""
                width={48}
                height={48}
                className="border-2 border-[#ff6b35]"
              />
            )}
            <div>
              <Link
                href={`/user/${user1.github_login}`}
                className="font-pixel text-sm text-[#ff6b35] hover:text-[#ff8c5a]"
              >
                {user1.github_login}
              </Link>
              {user1.name && (
                <div className="font-pixel text-[9px] text-[#5a3a2a]">{user1.name}</div>
              )}
            </div>
          </div>

          <div className="font-pixel text-sm text-[#5a3a2a]">VS</div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <Link
                href={`/user/${user2.github_login}`}
                className="font-pixel text-sm text-[#c77dff] hover:text-[#b39ddb]"
              >
                {user2.github_login}
              </Link>
              {user2.name && (
                <div className="font-pixel text-[9px] text-[#5a3a2a]">{user2.name}</div>
              )}
            </div>
            {user2.avatar_url && (
              <img
                src={user2.avatar_url}
                alt=""
                width={48}
                height={48}
                className="border-2 border-[#c77dff]"
              />
            )}
          </div>
        </div>

        {/* Stat Bars */}
        <div className="border border-[#2a1a0f] bg-[#1a0a04] p-4">
          <StatBar label="Contributions" left={user1.total_contributions} right={user2.total_contributions} />
          <StatBar label="Stars" left={user1.total_stars} right={user2.total_stars} />
          <StatBar label="Repositories" left={user1.public_repos} right={user2.public_repos} />
          <StatBar label="Followers" left={user1.followers} right={user2.followers} />
          <StatBar label="Kudos" left={kudos1} right={kudos2} />
        </div>

        {/* Building Comparison */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          {[
            { building: building1, user: user1, color: "#ff6b35" },
            { building: building2, user: user2, color: "#c77dff" },
          ].map(({ building, user, color }) => (
            <div key={user.id} className="border border-[#2a1a0f] bg-[#1a0a04] p-4">
              <div className="mb-2 font-pixel text-xs" style={{ color }}>
                Building
              </div>
              <div className="grid grid-cols-2 gap-2 font-pixel text-[10px]">
                <div>
                  <div style={{ color }}>{building.height}u</div>
                  <div className="text-[#5a3a2a]">height</div>
                </div>
                <div>
                  <div style={{ color }}>{building.width}u</div>
                  <div className="text-[#5a3a2a]">width</div>
                </div>
                <div>
                  <div style={{ color }}>{building.floors}</div>
                  <div className="text-[#5a3a2a]">floors</div>
                </div>
                <div>
                  <div style={{ color }}>
                    {Math.round(building.litPercentage * 100)}%
                  </div>
                  <div className="text-[#5a3a2a]">lit</div>
                </div>
              </div>
              <div className="mt-2 flex gap-1">
                {building.windowLitColors.map((c, i) => (
                  <div key={i} className="h-3 w-3" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
