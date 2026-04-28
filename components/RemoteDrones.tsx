"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RemotePilot } from "@/lib/multiplayer";

interface RemoteDronesProps {
  pilots: Map<string, RemotePilot>;
}

const MAX_DRONES = 32;
const LERP = 0.18;

/**
 * Renders other connected pilots as glowing drones.
 *
 * Uses an InstancedMesh per material so we can show ~32 concurrent pilots cheaply.
 * Reads the live pilots map each frame so updates don't cause re-renders.
 */
export default function RemoteDrones({ pilots }: RemoteDronesProps) {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.InstancedMesh>(null);
  const labelGroupRef = useRef<THREE.Group>(null);

  // Per-instance color arrays
  const bodyColors = useMemo(() => new Float32Array(MAX_DRONES * 3), []);
  const glowColors = useMemo(() => new Float32Array(MAX_DRONES * 3), []);

  // Smoothed positions (so motion looks fluid even with 80ms server tick)
  const smoothed = useRef(new Map<string, THREE.Vector3>());

  // Reusable matrix
  const tempObj = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  // Label sprites — one Group child per drone, pooled
  const labelMats = useMemo(() => {
    const arr: THREE.SpriteMaterial[] = [];
    for (let i = 0; i < MAX_DRONES; i++) {
      arr.push(new THREE.SpriteMaterial({ depthTest: false, transparent: true }));
    }
    return arr;
  }, []);

  useFrame(() => {
    if (!bodyRef.current || !glowRef.current || !labelGroupRef.current) return;

    const entries = [...pilots.entries()].slice(0, MAX_DRONES);

    // Pre-zero all visible counts; we'll set per-instance below
    bodyRef.current.count = entries.length;
    glowRef.current.count = entries.length;

    let i = 0;
    for (const [id, pilot] of entries) {
      // Smooth position
      let pos = smoothed.current.get(id);
      if (!pos) {
        pos = new THREE.Vector3(pilot.x, pilot.y, pilot.z);
        smoothed.current.set(id, pos);
      } else {
        pos.x += (pilot.x - pos.x) * LERP;
        pos.y += (pilot.y - pos.y) * LERP;
        pos.z += (pilot.z - pos.z) * LERP;
      }

      // Body — small box, banked
      tempObj.position.copy(pos);
      tempObj.rotation.set(0, pilot.yaw + Math.PI, pilot.bank);
      tempObj.scale.set(4, 1.2, 4);
      tempObj.updateMatrix();
      bodyRef.current.setMatrixAt(i, tempObj.matrix);

      // Glow — slightly larger, set behind body for halo effect
      tempObj.scale.set(5, 1.6, 5);
      tempObj.updateMatrix();
      glowRef.current.setMatrixAt(i, tempObj.matrix);

      // Color from hue
      tempColor.setHSL(pilot.hue / 360, 0.9, 0.6);
      bodyColors[i * 3] = tempColor.r;
      bodyColors[i * 3 + 1] = tempColor.g;
      bodyColors[i * 3 + 2] = tempColor.b;

      tempColor.setHSL(pilot.hue / 360, 0.9, 0.5);
      glowColors[i * 3] = tempColor.r;
      glowColors[i * 3 + 1] = tempColor.g;
      glowColors[i * 3 + 2] = tempColor.b;

      // Label sprite
      const sprite = labelGroupRef.current.children[i] as THREE.Sprite | undefined;
      if (sprite) {
        sprite.visible = true;
        sprite.position.set(pos.x, pos.y + 6, pos.z);
        const mat = sprite.material as THREE.SpriteMaterial;
        if (!mat.map || (mat.userData.name as string) !== pilot.name) {
          const tex = makeNameTexture(pilot.name, pilot.hue);
          mat.map?.dispose();
          mat.map = tex;
          mat.userData.name = pilot.name;
          mat.needsUpdate = true;
        }
      }

      i++;
    }

    // Hide any unused label sprites
    for (let j = i; j < MAX_DRONES; j++) {
      const sprite = labelGroupRef.current.children[j] as THREE.Sprite | undefined;
      if (sprite) sprite.visible = false;
    }

    bodyRef.current.instanceMatrix.needsUpdate = true;
    glowRef.current.instanceMatrix.needsUpdate = true;

    // Update instance colors
    if (bodyRef.current.instanceColor) bodyRef.current.instanceColor.needsUpdate = true;
    if (glowRef.current.instanceColor) glowRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh
        ref={bodyRef}
        args={[undefined, undefined, MAX_DRONES]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          metalness={0.7}
          roughness={0.3}
          emissiveIntensity={1.2}
          toneMapped={false}
          vertexColors
        />
        <instancedBufferAttribute
          attach="instanceColor"
          args={[bodyColors, 3]}
        />
      </instancedMesh>

      <instancedMesh
        ref={glowRef}
        args={[undefined, undefined, MAX_DRONES]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial transparent opacity={0.18} toneMapped={false} vertexColors />
        <instancedBufferAttribute
          attach="instanceColor"
          args={[glowColors, 3]}
        />
      </instancedMesh>

      <group ref={labelGroupRef}>
        {Array.from({ length: MAX_DRONES }).map((_, i) => (
          <sprite key={i} material={labelMats[i]} scale={[16, 4, 1]} visible={false} />
        ))}
      </group>
    </group>
  );
}

// ─── Name texture ─────────────────────────────────────────────

function makeNameTexture(name: string, hue: number): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();

  ctx.clearRect(0, 0, 256, 64);
  ctx.fillStyle = `hsla(${hue}, 90%, 12%, 0.85)`;
  ctx.fillRect(0, 16, 256, 32);
  ctx.fillStyle = `hsl(${hue}, 90%, 75%)`;
  ctx.font = "bold 20px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name.toUpperCase(), 128, 32);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}
