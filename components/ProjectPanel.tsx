"use client";

import { useEffect, useCallback } from "react";
import type { CityBuilding } from "@/lib/projects";
import { CATEGORY_COLORS } from "@/lib/projects";

interface HireSummary {
  github_login: string;
  hire_headline: string | null;
  hire_rate_usd_hourly: number | null;
  hire_contact_url: string | null;
}

interface ProjectPanelProps {
  building: CityBuilding | null;
  onClose: () => void;
  hireSummary?: HireSummary | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  tool: "Tool",
  game: "Game",
  app: "App",
  agent: "Agent",
  api: "API",
  website: "Website",
  other: "Other",
};

export default function ProjectPanel({ building, onClose, hireSummary }: ProjectPanelProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const project = building?.project;

  return (
    <div
      className={`fixed right-0 top-0 z-40 flex h-full w-80 flex-col border-l border-[#2a1a0f] bg-[#0d0400]/95 backdrop-blur-sm transition-transform duration-300 ${
        building ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {project && building && (
        <>
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#2a1a0f] p-4">
            <div className="flex-1 pr-2">
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="rounded-none px-2 py-0.5 font-pixel text-[10px]"
                  style={{
                    backgroundColor: CATEGORY_COLORS[building.category].windowLit[0] + "33",
                    color: CATEGORY_COLORS[building.category].windowLit[0],
                    border: `1px solid ${CATEGORY_COLORS[building.category].windowLit[0]}66`,
                  }}
                >
                  {CATEGORY_LABELS[building.category]}
                </span>
              </div>
              <h2 className="font-pixel text-sm leading-tight text-[#ff8c5a]">
                {project.name}
              </h2>
              <p className="mt-0.5 font-pixel text-[10px] text-[#8a5a3a]">
                by {project.builderName}
                {project.builderTwitter && (
                  <span className="ml-1 opacity-70">{project.builderTwitter}</span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="font-pixel text-[#5a3a2a] transition-colors hover:text-[#ff6b35]"
            >
              [X]
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
            <p className="font-pixel text-[11px] leading-relaxed text-[#c09878]">
              {project.description}
            </p>

            {/* Stats */}
            <div className="mt-4 flex gap-4">
              <div className="font-pixel text-[10px]">
                <div className="text-[#ff6b35]">{project.upvotes}</div>
                <div className="text-[#5a3a2a]">upvotes</div>
              </div>
              <div className="font-pixel text-[10px]">
                <div className="text-[#ff6b35]">{building.height.toFixed(0)}u</div>
                <div className="text-[#5a3a2a]">height</div>
              </div>
              <div className="font-pixel text-[10px]">
                <div className="text-[#ff6b35]">{building.floors}</div>
                <div className="text-[#5a3a2a]">floors</div>
              </div>
            </div>

            {/* Tags */}
            {project.tags.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 font-pixel text-[9px] uppercase text-[#5a3a2a]">
                  Tags
                </div>
                <div className="flex flex-wrap gap-1">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="border border-[#2a1a0f] bg-[#1a0a04] px-2 py-0.5 font-pixel text-[9px] text-[#8a5a3a]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Date */}
            <div className="mt-4 font-pixel text-[9px] text-[#5a3a2a]">
              Submitted{" "}
              {new Date(project.submittedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>

          {/* Hire CTA — shown when builder is for_hire */}
          {hireSummary && hireSummary.hire_contact_url && (
            <div className="border-t border-[#2a4a2a] bg-gradient-to-br from-[#0d1f0d] to-[#1a0a04] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-pixel text-[9px] uppercase tracking-widest text-[#7fff6b]">
                  ● Builder for hire
                </span>
                {hireSummary.hire_rate_usd_hourly && (
                  <span className="font-pixel text-xs text-[#7fff6b]">
                    ${hireSummary.hire_rate_usd_hourly}
                    <span className="text-[8px] text-[#5a8a5a]">/hr</span>
                  </span>
                )}
              </div>
              {hireSummary.hire_headline && (
                <p className="mb-3 font-pixel text-[10px] leading-snug text-[#a0c0a0]">
                  {hireSummary.hire_headline}
                </p>
              )}
              <a
                href={hireSummary.hire_contact_url}
                className="block bg-[#7fff6b] px-4 py-2 text-center font-pixel text-xs text-[#0d0400] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-[#a0ff80]"
                style={{ boxShadow: "3px 3px 0 #2a4a2a" }}
              >
                → HIRE {hireSummary.github_login.toUpperCase()}
              </a>
            </div>
          )}

          {/* Footer links */}
          <div className="border-t border-[#2a1a0f] p-4">
            <div className="flex flex-col gap-2">
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-[#ff6b35] px-4 py-2 text-center font-pixel text-xs text-[#0d0400] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-[#ff8c5a]"
                style={{ boxShadow: "3px 3px 0 #3a1a0a" }}
              >
                → VIEW PROJECT
              </a>
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border border-[#2a1a0f] px-4 py-2 text-center font-pixel text-xs text-[#8a5a3a] transition-colors hover:border-[#ff6b35] hover:text-[#ff6b35]"
                >
                  → GITHUB REPO
                </a>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
