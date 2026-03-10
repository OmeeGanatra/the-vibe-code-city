"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect } from "react";
import type { CityBuilding } from "@/lib/projects";
import { generateCityLayout } from "@/lib/cityLayout";
import projects from "@/data/projects.json";
import ProjectPanel from "@/components/ProjectPanel";
import HoverTooltip from "@/components/HoverTooltip";
import LoadingScreen from "@/components/LoadingScreen";
import CategoryLegend from "@/components/CategoryLegend";
import Link from "next/link";

const CityCanvas = dynamic(() => import("@/components/CityCanvas"), {
  ssr: false,
});

const buildings = generateCityLayout(projects as never);

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
            {buildings.length} projects · built by vibe coders
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
            <div className="mb-1 text-center font-pixel text-[10px] tracking-widest text-[#ff6b35]">
              DRONE MODE
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
          name={hoveredBuilding.building.name}
          x={hoveredBuilding.x}
          y={hoveredBuilding.y}
        />
      )}

      {/* Project panel */}
      <ProjectPanel building={selectedBuilding} onClose={handlePanelClose} />
    </main>
  );
}
