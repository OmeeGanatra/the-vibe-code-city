"use client";

import CityGround from "./CityGround";
import BuildingMesh from "./BuildingMesh";
import type { CityBuilding } from "@/lib/projects";

interface CitySceneProps {
  buildings: CityBuilding[];
  groundColor: string;
  roadColor: string;
  onHover: (building: CityBuilding | null, x: number, y: number) => void;
  onClick: (building: CityBuilding) => void;
}

export default function CityScene({
  buildings,
  groundColor,
  roadColor,
  onHover,
  onClick,
}: CitySceneProps) {
  return (
    <group>
      <CityGround groundColor={groundColor} roadColor={roadColor} />
      {buildings.map((building) => (
        <BuildingMesh
          key={building.id}
          building={building}
          onHover={onHover}
          onClick={onClick}
        />
      ))}
    </group>
  );
}
