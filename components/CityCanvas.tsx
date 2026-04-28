"use client";

import { useRef, useEffect, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import CityScene from "./CityScene";
import DroneControls from "./DroneControls";
import RemoteDrones from "./RemoteDrones";
import { usePartyFly } from "@/lib/multiplayer";
import type { CityBuilding } from "@/lib/projects";

// ─── Sky Dome ────────────────────────────────────────────────

function SkyDome() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0.0, "#050205");
    gradient.addColorStop(0.4, "#1a0608");
    gradient.addColorStop(0.7, "#2a0c08");
    gradient.addColorStop(0.85, "#3a1208");
    gradient.addColorStop(1.0, "#0d0400");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(camera.position);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[3500, 32, 48]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

// ─── Camera Focus ─────────────────────────────────────────────

function CameraFocus({
  target,
  controlsRef,
}: {
  target: [number, number, number] | null;
  controlsRef: React.RefObject<{ target: THREE.Vector3 } | null>;
}) {
  const dest = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    if (target) {
      dest.current = new THREE.Vector3(...target);
    }
  }, [target]);

  useFrame(() => {
    if (!dest.current || !controlsRef.current) return;
    controlsRef.current.target.lerp(dest.current, 0.05);
    if (controlsRef.current.target.distanceTo(dest.current) < 0.5) {
      dest.current = null;
    }
  });

  return null;
}

// ─── Inner Scene ──────────────────────────────────────────────

interface InnerProps {
  buildings: CityBuilding[];
  focusTarget: [number, number, number] | null;
  droneMode: boolean;
  onDroneExit: () => void;
  onHover: (building: CityBuilding | null, x: number, y: number) => void;
  onClick: (building: CityBuilding) => void;
  onReady: () => void;
}

function InnerScene({ buildings, focusTarget, droneMode, onDroneExit, onHover, onClick, onReady }: InnerProps) {
  const controlsRef = useRef<{ target: THREE.Vector3 } | null>(null);
  const readyCalled = useRef(false);
  const { pilots, sendMove } = usePartyFly(droneMode);

  useEffect(() => {
    if (!readyCalled.current) {
      readyCalled.current = true;
      setTimeout(onReady, 400);
    }
  }, [onReady]);

  return (
    <>
      {/* Lighting */}
      <ambientLight color="#c07060" intensity={0.45} />
      <hemisphereLight args={["#f0c0a0", "#2a1a10", 0.5]} />
      <directionalLight
        color="#ffd0b0"
        intensity={0.8}
        position={[300, 200, -150]}
      />
      <directionalLight
        color="#a06040"
        intensity={0.25}
        position={[-200, 60, 200]}
      />

      {/* Fog */}
      <fog attach="fog" args={["#1a0e08", 500, 2200]} />

      <SkyDome />

      <CityScene
        buildings={buildings}
        groundColor="#181008"
        roadColor="#2a1a0f"
        onHover={onHover}
        onClick={onClick}
      />

      {!droneMode && (
        <OrbitControls
          ref={controlsRef as never}
          enableDamping
          dampingFactor={0.05}
          minDistance={80}
          maxDistance={2500}
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI / 2.1}
        />
      )}

      {!droneMode && (
        <CameraFocus target={focusTarget} controlsRef={controlsRef as never} />
      )}

      <DroneControls enabled={droneMode} onExit={onDroneExit} onMove={sendMove} />

      {droneMode && <RemoteDrones pilots={pilots} />}

      <EffectComposer>
        <Bloom
          intensity={0.35}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.025}
        />
      </EffectComposer>
    </>
  );
}

// ─── Main Export ──────────────────────────────────────────────

interface CityCanvasProps {
  buildings: CityBuilding[];
  focusTarget: [number, number, number] | null;
  droneMode: boolean;
  onDroneExit: () => void;
  onHover: (building: CityBuilding | null, x: number, y: number) => void;
  onClick: (building: CityBuilding) => void;
  onReady: () => void;
}

export default function CityCanvas({
  buildings,
  focusTarget,
  droneMode,
  onDroneExit,
  onHover,
  onClick,
  onReady,
}: CityCanvasProps) {
  return (
    <Canvas
      camera={{ fov: 60, near: 1, far: 5000, position: [0, 400, 600] }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      style={{ width: "100%", height: "100%" }}
    >
      <InnerScene
        buildings={buildings}
        focusTarget={focusTarget}
        droneMode={droneMode}
        onDroneExit={onDroneExit}
        onHover={onHover}
        onClick={onClick}
        onReady={onReady}
      />
    </Canvas>
  );
}
