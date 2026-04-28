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
  hireFilter?: boolean;
  hireLogins?: Set<string>;
}

function getLogin(githubUrl: string | undefined): string | null {
  return githubUrl?.match(/github\.com\/([^/?#]+)/i)?.[1]?.toLowerCase() ?? null;
}

export default function CityScene({
  buildings,
  groundColor,
  roadColor,
  onHover,
  onClick,
  hireFilter,
  hireLogins,
}: CitySceneProps) {
  return (
    <group>
      <CityGround groundColor={groundColor} roadColor={roadColor} />
      {buildings.map((building) => {
        const login = getLogin(building.project.githubUrl);
        const isHire = !!login && !!hireLogins?.has(login);
        return (
          <BuildingMesh
            key={building.id}
            building={building}
            onHover={onHover}
            onClick={onClick}
            isHire={isHire}
            hireFilter={!!hireFilter}
          />
        );
      })}
    </group>
  );
}
