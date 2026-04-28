"use client";

import { useMemo, useRef, useCallback, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CityBuilding } from "@/lib/projects";
import { hashStr, seededRandom } from "@/lib/utils";

const SHARED_BOX_GEO = new THREE.BoxGeometry(1, 1, 1);

function createWindowTexture(
  rows: number,
  cols: number,
  litPct: number,
  seed: number,
  litColors: string[],
  offColor: string,
  faceColor: string
): THREE.CanvasTexture {
  const WS = 6;
  const GAP = 2;
  const PAD = 3;
  const w = PAD * 2 + cols * WS + Math.max(0, cols - 1) * GAP;
  const h = PAD * 2 + rows * WS + Math.max(0, rows - 1) * GAP;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = faceColor;
  ctx.fillRect(0, 0, w, h);

  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = PAD + c * (WS + GAP);
      const y = PAD + r * (WS + GAP);
      const isLit = rand() < litPct;
      ctx.fillStyle = isLit
        ? litColors[Math.floor(rand() * litColors.length)]
        : offColor;
      ctx.fillRect(x, y, WS, WS);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = false;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createLabelTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  const fontSize = 20;
  const padding = 12;
  canvas.height = fontSize + padding * 2;

  // Measure text width
  const tempCtx = canvas.getContext("2d")!;
  tempCtx.font = `${fontSize}px monospace`;
  const metrics = tempCtx.measureText(text);
  canvas.width = Math.ceil(metrics.width) + padding * 2;

  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ff6b35";
  ctx.font = `${fontSize}px monospace`;
  ctx.fillText(text, padding, fontSize + padding / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface BuildingMeshProps {
  building: CityBuilding;
  onHover: (building: CityBuilding | null, x: number, y: number) => void;
  onClick: (building: CityBuilding) => void;
  isHire?: boolean;
  hireFilter?: boolean;
}

export default function BuildingMesh({
  building,
  onHover,
  onClick,
  isHire,
  hireFilter,
}: BuildingMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const scaleRef = useRef(0);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  // Animate rise on mount
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (scaleRef.current < 1) {
      scaleRef.current = Math.min(1, scaleRef.current + delta * 1.5);
      // Cubic ease-out
      const t = scaleRef.current;
      const eased = 1 - Math.pow(1 - t, 3);
      groupRef.current.scale.y = eased;
      groupRef.current.position.y = -(1 - eased) * building.height * 0.5;
    }
  });

  const seed = hashStr(building.id);

  const { frontTex, sideTex, roofMat, bodyMats, labelTex } = useMemo(() => {
    const front = createWindowTexture(
      building.floors,
      building.windowsPerFloor,
      building.litPercentage,
      seed,
      building.windowLitColors,
      building.windowOffColor,
      building.faceColor
    );
    const side = createWindowTexture(
      building.floors,
      building.sideWindowsPerFloor,
      building.litPercentage,
      seed + 1000,
      building.windowLitColors,
      building.windowOffColor,
      building.faceColor
    );

    const roofM = new THREE.MeshStandardMaterial({
      color: building.roofColor,
      roughness: 1,
      metalness: 0,
    });

    const bodyFaceMat = new THREE.MeshStandardMaterial({
      map: front,
      emissiveMap: front,
      emissive: new THREE.Color(1, 1, 1),
      emissiveIntensity: 0.6,
      roughness: 0.9,
    });
    const bodySideMat = new THREE.MeshStandardMaterial({
      map: side,
      emissiveMap: side,
      emissive: new THREE.Color(1, 1, 1),
      emissiveIntensity: 0.6,
      roughness: 0.9,
    });

    // [px, nx, py, ny, pz, nz] = [right, left, top, bottom, front, back]
    const mats = [bodySideMat, bodySideMat, roofM, roofM, bodyFaceMat, bodyFaceMat];

    const label = createLabelTexture(building.name);

    return { frontTex: front, sideTex: side, roofMat: roofM, bodyMats: mats, labelTex: label };
  }, [building]);

  const dimmed = !!hireFilter && !isHire;
  const hiring = !!hireFilter && !!isHire;

  useEffect(() => {
    const opacity = dimmed ? 0.08 : 1.0;
    for (const m of bodyMats) {
      m.transparent = dimmed;
      m.opacity = opacity;
      m.needsUpdate = true;
    }
  }, [dimmed, bodyMats]);

  const handlePointerDown = useCallback((e: { clientX: number; clientY: number }) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleClick = useCallback(
    (e: { clientX: number; clientY: number; stopPropagation: () => void }) => {
      e.stopPropagation();
      if (!pointerDownPos.current) return;
      const dx = e.clientX - pointerDownPos.current.x;
      const dy = e.clientY - pointerDownPos.current.y;
      if (dx * dx + dy * dy > 25) return; // drag threshold
      onClick(building);
    },
    [building, onClick]
  );

  const handlePointerEnter = useCallback(
    (e: { clientX: number; clientY: number; stopPropagation: () => void }) => {
      e.stopPropagation();
      document.body.style.cursor = "pointer";
      onHover(building, e.clientX, e.clientY);
    },
    [building, onHover]
  );

  const handlePointerLeave = useCallback(() => {
    document.body.style.cursor = "auto";
    onHover(null, 0, 0);
  }, [onHover]);

  const handlePointerMove = useCallback(
    (e: { clientX: number; clientY: number }) => {
      onHover(building, e.clientX, e.clientY);
    },
    [building, onHover]
  );

  const [px, , pz] = building.position;
  const labelScale = building.width * 1.8;
  const labelAspect = labelTex.image ? labelTex.image.width / labelTex.image.height : 4;

  return (
    <group
      ref={groupRef}
      position={[px, building.height / 2, pz]}
      onPointerDown={handlePointerDown as never}
      onClick={handleClick as never}
      onPointerEnter={handlePointerEnter as never}
      onPointerLeave={handlePointerLeave as never}
      onPointerMove={handlePointerMove as never}
    >
      {/* Main building body */}
      <mesh
        geometry={SHARED_BOX_GEO}
        material={bodyMats}
        scale={[building.width, building.height, building.depth]}
      />

      {/* Label sprite above building */}
      <sprite
        position={[0, building.height / 2 + 15, 0]}
        scale={[labelScale * labelAspect * 0.15, labelScale * 0.15, 1]}
      >
        <spriteMaterial map={labelTex} transparent depthTest={false} />
      </sprite>

      {/* FOR HIRE glow beacon */}
      {hiring && (
        <>
          <pointLight
            position={[0, building.height / 2 + 50, 0]}
            color="#7fff6b"
            intensity={4}
            distance={150}
            decay={2}
          />
          <sprite position={[0, building.height / 2 + 30, 0]} scale={[12, 12, 1]}>
            <spriteMaterial color="#7fff6b" transparent opacity={0.6} depthTest={false} />
          </sprite>
        </>
      )}
    </group>
  );
}
