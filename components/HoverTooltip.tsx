"use client";

import type { CityBuilding } from "@/lib/projects";

interface HoverTooltipProps {
  building: CityBuilding;
  x: number;
  y: number;
  isHire?: boolean;
}

function extractLogin(url: string | undefined): string | null {
  return url?.match(/github\.com\/([^/?#]+)/i)?.[1] ?? null;
}

export default function HoverTooltip({ building, x, y, isHire }: HoverTooltipProps) {
  const login = extractLogin(building.project.githubUrl);
  const upvotes = building.project.upvotes ?? 0;

  return (
    <div
      style={{ left: x + 14, top: y - 10 }}
      className="pointer-events-none fixed z-50 border border-[#ff6b35] bg-[#0d0400]/95 px-3 py-2 backdrop-blur-sm"
    >
      <div className="font-pixel text-xs text-[#ffd166]">{building.name}</div>
      <div className="mt-1 flex items-center gap-2 font-pixel text-[9px] text-[#8a5a3a]">
        {upvotes > 0 && <span className="text-[#ff8c5a]">▲ {upvotes}</span>}
        {login && <span>@{login}</span>}
        {isHire && (
          <span className="border border-[#7fff6b]/50 px-1 text-[#7fff6b]">● HIRE</span>
        )}
      </div>
    </div>
  );
}
