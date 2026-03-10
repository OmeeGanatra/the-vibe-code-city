"use client";

import { useMemo } from "react";
import * as THREE from "three";

interface CityGroundProps {
  groundColor: string;
  roadColor: string;
  cityRadius?: number;
}

export default function CityGround({
  groundColor,
  roadColor,
  cityRadius = 800,
}: CityGroundProps) {
  const groundMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: groundColor,
        roughness: 1,
        metalness: 0,
      }),
    [groundColor]
  );

  const roadMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: roadColor,
        roughness: 1,
        metalness: 0,
      }),
    [roadColor]
  );

  const size = cityRadius * 2;
  const step = 57; // SLOT_W + ROAD_W = 45 + 12
  const roadW = 2;
  const roadH = 0.3;

  const roadLines = useMemo(() => {
    const lines: { x: number; z: number; rx: boolean }[] = [];
    const count = Math.floor(size / step / 2) + 2;
    for (let i = -count; i <= count; i++) {
      lines.push({ x: i * step, z: 0, rx: false }); // Z-axis roads
      lines.push({ x: 0, z: i * step, rx: true });   // X-axis roads
    }
    return lines;
  }, [size, step]);

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <primitive object={groundMat} />
      </mesh>

      {/* Road grid lines */}
      {roadLines.map((line, i) =>
        line.rx ? (
          <mesh key={i} position={[line.x, 0, line.z]} rotation={[0, 0, 0]}>
            <boxGeometry args={[roadW, roadH, size]} />
            <primitive object={roadMat} />
          </mesh>
        ) : (
          <mesh key={i} position={[line.x, 0, line.z]} rotation={[0, 0, 0]}>
            <boxGeometry args={[size, roadH, roadW]} />
            <primitive object={roadMat} />
          </mesh>
        )
      )}
    </group>
  );
}
