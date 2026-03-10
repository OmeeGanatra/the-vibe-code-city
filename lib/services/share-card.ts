import type { User } from "@/lib/supabase/types";
import type { BuildingParams } from "./building-generator";

// ── SYSTEM 11: Share Card Generator ─────────────────────────
// Generates a canvas-based social share image as a PNG buffer.
// Renders: username, building preview silhouette, stats.

export function generateShareCardHTML(
  user: User,
  building: BuildingParams,
  kudosCount: number,
  achievementCount: number
): string {
  const height = building.height;
  const maxBarH = 200;
  const barH = Math.min(maxBarH, (height / 600) * maxBarH);

  return `
    <div style="
      width: 1200px; height: 630px;
      background: #0d0400;
      display: flex;
      font-family: monospace;
      color: #c09878;
      position: relative;
      overflow: hidden;
    ">
      <!-- Background grid -->
      <div style="
        position: absolute; inset: 0;
        background-image:
          linear-gradient(rgba(42,26,15,0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(42,26,15,0.3) 1px, transparent 1px);
        background-size: 40px 40px;
      "></div>

      <!-- Left: User info -->
      <div style="flex: 1; padding: 60px; display: flex; flex-direction: column; justify-content: center; z-index: 1;">
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 24px;">
          ${user.avatar_url ? `<img src="${user.avatar_url}" width="80" height="80" style="border: 3px solid #ff6b35;" />` : ""}
          <div>
            <div style="font-size: 36px; color: #ff6b35; font-weight: bold;">${user.github_login}</div>
            ${user.name ? `<div style="font-size: 18px; color: #8a5a3a;">${user.name}</div>` : ""}
          </div>
        </div>

        <div style="display: flex; gap: 40px; margin-top: 20px;">
          <div>
            <div style="font-size: 32px; color: #ff6b35;">${user.total_contributions.toLocaleString()}</div>
            <div style="font-size: 14px; color: #5a3a2a;">contributions</div>
          </div>
          <div>
            <div style="font-size: 32px; color: #ff6b35;">${user.total_stars.toLocaleString()}</div>
            <div style="font-size: 14px; color: #5a3a2a;">stars</div>
          </div>
          <div>
            <div style="font-size: 32px; color: #ff6b35;">${user.public_repos}</div>
            <div style="font-size: 14px; color: #5a3a2a;">repos</div>
          </div>
        </div>

        <div style="display: flex; gap: 40px; margin-top: 16px;">
          <div>
            <div style="font-size: 24px; color: #ff8c5a;">${kudosCount}</div>
            <div style="font-size: 12px; color: #5a3a2a;">kudos</div>
          </div>
          <div>
            <div style="font-size: 24px; color: #ff8c5a;">${achievementCount}</div>
            <div style="font-size: 12px; color: #5a3a2a;">achievements</div>
          </div>
        </div>

        <div style="margin-top: 32px; font-size: 14px; color: #3a2a1f;">
          VIBE CODE CITY
        </div>
      </div>

      <!-- Right: Building silhouette -->
      <div style="width: 400px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 60px; z-index: 1;">
        <div style="display: flex; align-items: flex-end; gap: 4px;">
          ${Array.from({ length: 5 }, (_, i) => {
            const h = Math.max(30, barH * (0.4 + Math.random() * 0.6));
            const w = 40 + Math.random() * 20;
            const color = building.windowLitColors[i % building.windowLitColors.length];
            return `<div style="
              width: ${w}px; height: ${h}px;
              background: ${building.faceColor};
              border-top: 3px solid ${building.roofColor};
              position: relative;
              display: flex; flex-wrap: wrap; gap: 3px; padding: 4px;
              align-content: flex-start;
            ">
              ${Array.from({ length: Math.floor(h / 12) * 2 }, () =>
                `<div style="width: 6px; height: 6px; background: ${Math.random() > 0.4 ? color : building.windowOffColor};"></div>`
              ).join("")}
            </div>`;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

// For the API route, return the HTML and let the client/OG service render it
export function getShareCardData(
  user: User,
  building: BuildingParams,
  kudosCount: number,
  achievementCount: number
) {
  return {
    username: user.github_login,
    name: user.name,
    avatar_url: user.avatar_url,
    stats: {
      contributions: user.total_contributions,
      stars: user.total_stars,
      repos: user.public_repos,
      kudos: kudosCount,
      achievements: achievementCount,
    },
    building: {
      height: building.height,
      width: building.width,
      faceColor: building.faceColor,
      roofColor: building.roofColor,
      windowLitColors: building.windowLitColors,
    },
  };
}
