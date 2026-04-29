"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 80;
const SPAWN_RADIUS = 280;  // tighter cluster → more visible from default camera
const MAX_HEIGHT = 480;
const PALETTE = [
  "#ff8c5a", "#ffd166", "#ff6b35",
  "#ffd166", "#ff8c5a", "#7fff6b",
  "#ffaa44", "#ffe080", "#ff5500",
];

export default function FlyingLights() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const t = useRef(0);

  const particles = useMemo(() => {
    const r = (i: number, n: number) =>
      ((i * 1234567 + n * 9876543) % 99999983) / 99999983;
    return Array.from({ length: COUNT }, (_, i) => ({
      ox: (r(i, 0) * 2 - 1) * SPAWN_RADIUS,
      oy: r(i, 1) * MAX_HEIGHT,
      oz: (r(i, 2) * 2 - 1) * SPAWN_RADIUS,
      speed: 28 + r(i, 3) * 55,      // 28–83 units/sec (fast!)
      driftX: (r(i, 4) - 0.5) * 18,
      driftZ: (r(i, 5) - 0.5) * 18,
      wobble: r(i, 6) * Math.PI * 2, // horizontal sine phase
      wobbleSpeed: 0.8 + r(i, 7) * 1.4,
      wobbleAmp: 8 + r(i, 8) * 22,
      color: new THREE.Color(PALETTE[i % PALETTE.length]),
    }));
  }, []);

  const pos = useRef(particles.map((p) => ({ x: p.ox, y: p.oy, z: p.oz })));

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    t.current += delta;

    for (let i = 0; i < COUNT; i++) {
      const p = pos.current[i];
      const def = particles[i];

      p.y += def.speed * delta;
      // Sine drift for organic floating motion
      p.x = def.ox + Math.sin(t.current * def.wobbleSpeed + def.wobble) * def.wobbleAmp;
      p.z = def.oz + Math.cos(t.current * def.wobbleSpeed * 0.7 + def.wobble) * def.wobbleAmp * 0.6;

      if (p.y > MAX_HEIGHT) {
        p.y = 0;
      }

      dummy.position.set(p.x, p.y, p.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, def.color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[10, 6, 4]} />
      <meshBasicMaterial vertexColors />
    </instancedMesh>
  );
}
