"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 30;
const CITY_RADIUS = 520;
const MAX_HEIGHT = 360;
const PALETTE = ["#ff8c5a", "#ffd166", "#ff6b35", "#ffd166", "#ff8c5a", "#7fff6b"];

export default function FlyingLights() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const r = (i: number, n: number) =>
      ((i * 1234567 + n * 9876543) % 99999983) / 99999983;
    return Array.from({ length: COUNT }, (_, i) => ({
      ox: (r(i, 0) * 2 - 1) * CITY_RADIUS,
      oy: r(i, 1) * MAX_HEIGHT,
      oz: (r(i, 2) * 2 - 1) * CITY_RADIUS,
      speed: 12 + r(i, 3) * 22,
      driftX: (r(i, 4) - 0.5) * 7,
      driftZ: (r(i, 5) - 0.5) * 7,
      color: new THREE.Color(PALETTE[i % PALETTE.length]),
    }));
  }, []);

  const pos = useRef(particles.map((p) => ({ x: p.ox, y: p.oy, z: p.oz })));

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < COUNT; i++) {
      const p = pos.current[i];
      const def = particles[i];
      p.y += def.speed * delta;
      p.x += def.driftX * delta;
      p.z += def.driftZ * delta;
      if (p.y > MAX_HEIGHT) {
        p.y = 0;
        p.x = def.ox;
        p.z = def.oz;
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
      <sphereGeometry args={[1.8, 4, 3]} />
      <meshBasicMaterial vertexColors />
    </instancedMesh>
  );
}
