"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect, useMemo } from "react";
import type { CityBuilding } from "@/lib/projects";
import { generateCityLayout } from "@/lib/cityLayout";
import projects from "@/data/projects.json";
import ProjectPanel from "@/components/ProjectPanel";
import HoverTooltip from "@/components/HoverTooltip";
import LoadingScreen from "@/components/LoadingScreen";
import CategoryLegend from "@/components/CategoryLegend";
import SignInButton from "@/components/SignInButton";
import Link from "next/link";

const CityCanvas = dynamic(() => import("@/components/CityCanvas"), {
  ssr: false,
});

const buildings = generateCityLayout(projects as never);

interface HireSummary {
  github_login: string;
  hire_headline: string | null;
  hire_rate_usd_hourly: number | null;
  hire_contact_url: string | null;
}

function extractGithubLogin(url: string | undefined): string | null {
  if (!url) return null;
  const m = url.match(/github\.com\/([^/?#]+)/i);
  return m ? m[1].toLowerCase() : null;
}

export default function Home() {
  const [selectedBuilding, setSelectedBuilding] = useState<CityBuilding | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<{
    building: CityBuilding;
    x: number;
    y: number;
  } | null>(null);
  const [focusTarget, setFocusTarget] = useState<[number, number, number] | null>(null);
  const [cityReady, setCityReady] = useState(false);
  const [droneMode, setDroneMode] = useState(false);
  const [hireMap, setHireMap] = useState<Map<string, HireSummary>>(new Map());
  const [pilotCount, setPilotCount] = useState(0);
  const [hireFilter, setHireFilter] = useState(false);

  const hireLogins = useMemo(() => new Set(hireMap.keys()), [hireMap]);

  useEffect(() => {
    fetch("/api/hire")
      .then((r) => r.json())
      .then((d: { users?: HireSummary[] }) => {
        const map = new Map<string, HireSummary>();
        for (const u of d.users ?? []) {
          map.set(u.github_login.toLowerCase(), u);
        }
        setHireMap(map);
      })
      .catch(() => {});
  }, []);

  const handleDroneToggle = useCallback(() => {
    setDroneMode((prev) => !prev);
    setSelectedBuilding(null);
  }, []);

  const handleDroneExit = useCallback(() => {
    setDroneMode(false);
  }, []);

  const handleHover = useCallback(
    (building: CityBuilding | null, x: number, y: number) => {
      if (building) {
        setHoveredBuilding({ building, x, y });
      } else {
        setHoveredBuilding(null);
      }
    },
    []
  );

  const handleClick = useCallback((building: CityBuilding) => {
    setSelectedBuilding(building);
    setFocusTarget(building.position);
  }, []);

  const handlePanelClose = useCallback(() => {
    setSelectedBuilding(null);
  }, []);

  const handleCanvasClick = useCallback(() => {
    // Close panel when clicking empty canvas area
    // (BuildingMesh clicks call stopPropagation so they won't bubble here)
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#0d0400]">
      {/* 3D City */}
      <div className="h-full w-full" onClick={handleCanvasClick}>
        <CityCanvas
          buildings={buildings}
          focusTarget={focusTarget}
          droneMode={droneMode}
          onDroneExit={handleDroneExit}
          onHover={handleHover}
          onClick={handleClick}
          onReady={() => setCityReady(true)}
          onPilotsChange={setPilotCount}
          hireFilter={hireFilter}
          hireLogins={hireLogins}
        />
      </div>

      {/* Loading screen */}
      <LoadingScreen ready={cityReady} />

      {/* Top-left title */}
      {cityReady && !droneMode && (
        <div
          className="pointer-events-none fixed left-4 top-4 z-30"
          style={{ animation: "fade-in 0.5s ease-out" }}
        >
          <div className="font-pixel text-lg tracking-widest text-[#ff6b35]">
            VIBE CODE CITY
          </div>
          <div className="font-pixel text-[9px] text-[#5a3a2a]">
            {buildings.length} projects
            {hireMap.size > 0 && (
              <span className="text-[#5a8a5a]"> · {hireMap.size} for hire</span>
            )}
          </div>
        </div>
      )}

      {/* Bottom-left legend */}
      {cityReady && !droneMode && (
        <div
          className="fixed bottom-4 left-4 z-30"
          style={{ animation: "fade-in 0.5s ease-out 0.2s both" }}
        >
          <div className="mb-1 font-pixel text-[9px] uppercase text-[#3a2a1f]">
            Category
          </div>
          <CategoryLegend />
          {hireMap.size > 0 && (
            <button
              onClick={() => setHireFilter((v) => !v)}
              className={`mt-2 btn-press px-2 py-1 font-pixel text-[9px] border transition-colors ${
                hireFilter
                  ? "bg-[#7fff6b] text-[#0d0400] border-[#7fff6b]"
                  : "bg-[#0d1f0d] text-[#7fff6b] border-[#7fff6b]/50 hover:border-[#7fff6b]"
              }`}
              style={{ boxShadow: "0 2px 0 #2a4a2a" }}
            >
              {hireFilter ? "● HIRE FILTER ON" : "○ HIRE FILTER"}
            </button>
          )}
        </div>
      )}

      {/* Bottom-right controls hint */}
      {cityReady && !droneMode && (
        <div
          className="pointer-events-none fixed bottom-4 right-4 z-30 text-right"
          style={{ animation: "fade-in 0.5s ease-out 0.3s both" }}
        >
          <div className="font-pixel text-[9px] text-[#3a2a1f]">
            drag to orbit · scroll to zoom
          </div>
          <div className="font-pixel text-[9px] text-[#3a2a1f]">
            click a building to explore
          </div>
        </div>
      )}

      {/* Drone mode HUD */}
      {cityReady && droneMode && (
        <div
          className="pointer-events-none fixed bottom-4 left-1/2 z-30 -translate-x-1/2"
        >
          <div className="border border-[#ff6b35]/30 bg-[#0d0400]/80 px-6 py-3 backdrop-blur-sm">
            <div className="mb-1 flex items-center justify-center gap-3">
              <span className="font-pixel text-[10px] tracking-widest text-[#ff6b35]">
                DRONE MODE
              </span>
              {pilotCount > 0 && (
                <span className="border border-[#7fff6b]/40 px-2 py-0.5 font-pixel text-[9px] text-[#7fff6b]">
                  ● {pilotCount} other pilot{pilotCount === 1 ? "" : "s"} flying
                </span>
              )}
            </div>
            <div className="flex gap-4 font-pixel text-[9px] text-[#8a5a3a]">
              <span>WASD move</span>
              <span>mouse look</span>
              <span>SPACE up</span>
              <span>Q down</span>
              <span>SHIFT sprint</span>
              <span>ESC exit</span>
            </div>
          </div>
        </div>
      )}

      {/* Drone crosshair */}
      {cityReady && droneMode && (
        <div className="pointer-events-none fixed left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
          <div className="font-pixel text-sm text-[#ff6b35]/40">+</div>
        </div>
      )}

      {/* Top-right buttons */}
      {cityReady && !droneMode && (
        <div
          className="fixed right-4 top-4 z-30 flex gap-2"
          style={{ animation: "fade-in 0.5s ease-out 0.1s both" }}
        >
          <SignInButton />
          <Link
            href="/hire"
            className="btn-press inline-block border border-[#7fff6b] bg-[#0d1f0d] px-4 py-2 font-pixel text-xs text-[#7fff6b] transition-colors hover:bg-[#7fff6b] hover:text-[#0d0400]"
            style={{ boxShadow: "0 4px 0 #2a4a2a" }}
          >
            ● HIRE A CODER
          </Link>
          <Link
            href="/jobs"
            className="btn-press inline-block border border-[#ffd166] bg-[#1a0a04] px-4 py-2 font-pixel text-xs text-[#ffd166] transition-colors hover:bg-[#ffd166] hover:text-[#0d0400]"
            style={{ boxShadow: "0 4px 0 #4a3a0a" }}
          >
            JOBS
          </Link>
          <Link
            href="/leaderboard"
            className="btn-press inline-block border border-[#5a3a2a] bg-[#1a0a04] px-4 py-2 font-pixel text-xs text-[#8a5a3a] transition-colors hover:border-[#ff6b35] hover:text-[#ff6b35]"
            style={{ boxShadow: "0 4px 0 #1a0a04" }}
          >
            TOP
          </Link>
          <button
            onClick={handleDroneToggle}
            className="btn-press pixel-shadow-coral bg-[#1a0a04] border border-[#ff6b35] px-4 py-2 font-pixel text-xs text-[#ff6b35] hover:bg-[#ff6b35] hover:text-[#0d0400] transition-colors"
          >
            FLY DRONE
          </button>
          <Link
            href="/submit"
            className="btn-press pixel-shadow-coral inline-block bg-[#ff6b35] px-4 py-2 font-pixel text-xs text-[#0d0400]"
          >
            + ADD PROJECT
          </Link>
        </div>
      )}

      {/* Hover tooltip */}
      {hoveredBuilding && !selectedBuilding && !droneMode && (
        <HoverTooltip
          building={hoveredBuilding.building}
          x={hoveredBuilding.x}
          y={hoveredBuilding.y}
          isHire={(() => {
            const login = extractGithubLogin(hoveredBuilding.building.project.githubUrl);
            return login ? hireMap.has(login) : false;
          })()}
        />
      )}

      {/* Project panel */}
      <ProjectPanel
        building={selectedBuilding}
        onClose={handlePanelClose}
        hireSummary={(() => {
          const login = extractGithubLogin(selectedBuilding?.project.githubUrl);
          return login ? hireMap.get(login) ?? null : null;
        })()}
      />
    </main>
  );
}
