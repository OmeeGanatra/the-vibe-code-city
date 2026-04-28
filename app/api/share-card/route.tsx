import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const W = 1200;
const H = 630;

const BG_DARK = "#0d0400";
const BG_GRAD = "#2a0c08";
const ORANGE = "#ff6b35";
const ORANGE_LIGHT = "#ff8c5a";
const GREEN = "#7fff6b";
const TEXT_DIM = "#8a5a3a";
const TEXT_LIGHT = "#c09878";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");
  if (!username) {
    return new Response("username required", { status: 400 });
  }

  const supabase = createServiceSupabase();
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("github_login", username)
    .single();

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(180deg, ${BG_DARK} 0%, ${BG_GRAD} 100%)`,
          padding: 60,
          fontFamily: "monospace",
        }}
      >
        {/* Top: brand */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: ORANGE, fontSize: 32, fontWeight: 700, letterSpacing: 2 }}>
            VIBE CODE CITY
          </div>
          <div style={{ color: TEXT_DIM, fontSize: 18, marginTop: 4 }}>
            thevibecodecity.com
          </div>
        </div>

        {/* Center: avatar + name + headline */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 40,
            marginTop: 60,
            flex: 1,
          }}
        >
          {user.avatar_url && (
            <img
              src={user.avatar_url}
              width={200}
              height={200}
              style={{
                borderRadius: 100,
                border: `6px solid ${user.for_hire ? GREEN : ORANGE}`,
              }}
            />
          )}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ color: ORANGE, fontSize: 56, fontWeight: 700 }}>
              {user.github_login}
            </div>
            {user.name && (
              <div style={{ color: TEXT_LIGHT, fontSize: 24, marginTop: 4 }}>
                {user.name}
              </div>
            )}

            {user.for_hire ? (
              <div style={{ display: "flex", flexDirection: "column", marginTop: 24, gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    style={{
                      background: GREEN,
                      color: BG_DARK,
                      padding: "8px 16px",
                      fontSize: 22,
                      fontWeight: 700,
                    }}
                  >
                    ● FOR HIRE
                  </div>
                  {user.hire_rate_usd_hourly && (
                    <div style={{ color: GREEN, fontSize: 38, fontWeight: 700 }}>
                      ${user.hire_rate_usd_hourly}/hr
                    </div>
                  )}
                </div>
                {user.hire_headline && (
                  <div
                    style={{
                      color: ORANGE_LIGHT,
                      fontSize: 22,
                      lineHeight: 1.3,
                      maxWidth: 720,
                    }}
                  >
                    {user.hire_headline}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", gap: 48, marginTop: 32 }}>
                {[
                  [user.total_contributions.toLocaleString(), "contributions"],
                  [user.total_stars.toLocaleString(), "stars"],
                  [user.public_repos.toString(), "repos"],
                ].map(([val, label]) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ color: ORANGE, fontSize: 36, fontWeight: 700 }}>{val}</div>
                    <div style={{ color: TEXT_DIM, fontSize: 14 }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom: URL */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: `1px solid ${ORANGE}33`,
            paddingTop: 16,
            color: TEXT_DIM,
            fontSize: 18,
          }}
        >
          <span>thevibecodecity.com/user/{user.github_login}</span>
          {user.for_hire && user.hire_availability && (
            <span style={{ color: GREEN }}>● {user.hire_availability}</span>
          )}
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
      },
    }
  );
}
