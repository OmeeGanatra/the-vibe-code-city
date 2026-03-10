"use client";

import { CATEGORY_COLORS, type ProjectCategory } from "@/lib/projects";

const CATEGORIES: { key: ProjectCategory; label: string }[] = [
  { key: "tool", label: "Tool" },
  { key: "game", label: "Game" },
  { key: "app", label: "App" },
  { key: "agent", label: "Agent" },
  { key: "api", label: "API" },
  { key: "website", label: "Website" },
  { key: "other", label: "Other" },
];

export default function CategoryLegend() {
  return (
    <div className="flex flex-col gap-1">
      {CATEGORIES.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-2">
          <div
            className="h-2 w-2 flex-shrink-0"
            style={{ backgroundColor: CATEGORY_COLORS[key].windowLit[0] }}
          />
          <span className="font-pixel text-[9px] text-[#8a5a3a]">{label}</span>
        </div>
      ))}
    </div>
  );
}
