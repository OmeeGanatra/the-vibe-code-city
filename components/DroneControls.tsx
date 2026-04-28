"use client";

import { useRef, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const MOVE_SPEED = 120;
const SPRINT_MULTIPLIER = 2.5;
const LOOK_SPEED = 0.002;
const MIN_HEIGHT = 8;
const CAM_DISTANCE = 35;
const CAM_HEIGHT = 14;
const CAM_LERP = 0.08;
const DRONE_TILT_SPEED = 0.1;
const MAX_TILT = 0.3;

interface DroneControlsProps {
  enabled: boolean;
  onExit: () => void;
  onMove?: (x: number, y: number, z: number, yaw: number, bank: number) => void;
}

// ─── Cyberpunk Drone Mesh ─────────────────────────────────────
function DroneMesh({ visible }: { visible: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const propRefs = useRef<THREE.Mesh[]>([]);
  const lightRef = useRef(0);

  // Pulsing glow
  const glowMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ff6b35",
        emissive: "#ff6b35",
        emissiveIntensity: 2,
        roughness: 0.3,
        metalness: 0.8,
      }),
    []
  );

  const cyanGlow = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#06d6a0",
        emissive: "#06d6a0",
        emissiveIntensity: 1.5,
        roughness: 0.3,
        metalness: 0.8,
      }),
    []
  );

  const bodyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1a1a2e",
        roughness: 0.4,
        metalness: 0.9,
      }),
    []
  );

  const darkMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0a0a14",
        roughness: 0.6,
        metalness: 0.7,
      }),
    []
  );

  const propMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#c77dff",
        emissive: "#c77dff",
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.6,
        roughness: 0.2,
        metalness: 0.5,
      }),
    []
  );

  // Spin propellers
  useFrame((_, delta) => {
    propRefs.current.forEach((p) => {
      if (p) p.rotation.y += delta * 40;
    });
    // Pulse the glow
    lightRef.current += delta * 3;
    glowMat.emissiveIntensity = 1.5 + Math.sin(lightRef.current) * 0.5;
  });

  const armPositions: [number, number, number][] = [
    [3.5, 0.3, 3.5],
    [-3.5, 0.3, 3.5],
    [3.5, 0.3, -3.5],
    [-3.5, 0.3, -3.5],
  ];

  return (
    <group ref={groupRef} visible={visible}>
      {/* Central body - flat hexagonal-ish shape */}
      <mesh material={bodyMat}>
        <boxGeometry args={[4, 1.2, 3]} />
      </mesh>

      {/* Top sensor dome */}
      <mesh position={[0, 0.8, 0]} material={darkMat}>
        <boxGeometry args={[2, 0.6, 1.5]} />
      </mesh>

      {/* Front camera eye */}
      <mesh position={[0, 0.2, -1.8]} material={glowMat}>
        <boxGeometry args={[1, 0.5, 0.4]} />
      </mesh>

      {/* Rear thruster strip */}
      <mesh position={[0, -0.1, 1.8]} material={cyanGlow}>
        <boxGeometry args={[2.5, 0.3, 0.3]} />
      </mesh>

      {/* Side accent strips */}
      <mesh position={[2.2, 0, 0]} material={glowMat}>
        <boxGeometry args={[0.2, 0.4, 2]} />
      </mesh>
      <mesh position={[-2.2, 0, 0]} material={glowMat}>
        <boxGeometry args={[0.2, 0.4, 2]} />
      </mesh>

      {/* Arms + propellers */}
      {armPositions.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Arm strut */}
          <mesh material={darkMat}>
            <boxGeometry args={[0.5, 0.4, 0.5]} />
          </mesh>

          {/* Motor housing */}
          <mesh position={[0, 0.5, 0]} material={bodyMat}>
            <cylinderGeometry args={[0.6, 0.8, 0.6, 6]} />
          </mesh>

          {/* Propeller disc */}
          <mesh
            position={[0, 0.9, 0]}
            ref={(el) => {
              if (el) propRefs.current[i] = el;
            }}
            material={propMat}
          >
            <cylinderGeometry args={[2, 2, 0.1, 8]} />
          </mesh>

          {/* LED ring under motor */}
          <mesh position={[0, 0.2, 0]} material={i < 2 ? glowMat : cyanGlow}>
            <torusGeometry args={[0.7, 0.08, 4, 6]} />
          </mesh>
        </group>
      ))}

      {/* Bottom landing pads */}
      <mesh position={[1.5, -0.8, 0]} material={darkMat}>
        <boxGeometry args={[0.3, 0.5, 2.5]} />
      </mesh>
      <mesh position={[-1.5, -0.8, 0]} material={darkMat}>
        <boxGeometry args={[0.3, 0.5, 2.5]} />
      </mesh>

      {/* Bottom scanner light */}
      <pointLight
        position={[0, -1.5, 0]}
        color="#ff6b35"
        intensity={8}
        distance={40}
        decay={2}
      />

      {/* Front headlight */}
      <spotLight
        position={[0, -0.5, -3]}
        target-position={[0, -10, -30]}
        color="#ff8c5a"
        intensity={15}
        distance={80}
        angle={0.5}
        penumbra={0.5}
        decay={2}
      />
    </group>
  );
}

// ─── Main Controller ──────────────────────────────────────────
export default function DroneControls({ enabled, onExit, onMove }: DroneControlsProps) {
  const { camera, gl } = useThree();
  const keys = useRef<Set<string>>(new Set());
  const yaw = useRef(0);
  const pitch = useRef(-0.3);
  const dronePos = useRef(new THREE.Vector3());
  const droneQuat = useRef(new THREE.Quaternion());
  const velocity = useRef(new THREE.Vector3());
  const tilt = useRef({ x: 0, z: 0 });
  const droneGroupRef = useRef<THREE.Group>(null);
  const initialized = useRef(false);
  const bobPhase = useRef(0);

  // Initialize drone position from camera when entering
  useEffect(() => {
    if (enabled) {
      // Place drone in front of camera
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      dronePos.current.copy(camera.position).add(forward.multiplyScalar(50));
      dronePos.current.y = Math.max(MIN_HEIGHT + 20, dronePos.current.y - 100);

      // Face same direction as camera
      const camEuler = new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ");
      yaw.current = camEuler.y;
      pitch.current = -0.3;

      initialized.current = true;
      gl.domElement.requestPointerLock();
    } else {
      initialized.current = false;
      velocity.current.set(0, 0, 0);
      if (document.pointerLockElement === gl.domElement) {
        document.exitPointerLock();
      }
    }
  }, [enabled, camera, gl]);

  // Pointer lock exit
  useEffect(() => {
    const handleLockChange = () => {
      if (enabled && document.pointerLockElement !== gl.domElement) {
        onExit();
      }
    };
    document.addEventListener("pointerlockchange", handleLockChange);
    return () => document.removeEventListener("pointerlockchange", handleLockChange);
  }, [enabled, gl, onExit]);

  // Mouse look
  useEffect(() => {
    if (!enabled) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== gl.domElement) return;
      yaw.current -= e.movementX * LOOK_SPEED;
      pitch.current -= e.movementY * LOOK_SPEED;
      pitch.current = Math.max(-1.2, Math.min(0.6, pitch.current));
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [enabled, gl]);

  // Keyboard
  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.code);
      if (e.code === "Escape") onExit();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.code);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      keys.current.clear();
    };
  }, [enabled, onExit]);

  // Frame update: move drone, position camera behind it
  useFrame((_, delta) => {
    if (!enabled || !initialized.current || !droneGroupRef.current) return;

    const sprinting =
      keys.current.has("ShiftLeft") || keys.current.has("ShiftRight");
    const speed = sprinting ? MOVE_SPEED * SPRINT_MULTIPLIER : MOVE_SPEED;

    // Direction vectors (yaw only for horizontal movement)
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
    const right = new THREE.Vector3(1, 0, 0);
    right.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);

    // Input
    const moveInput = new THREE.Vector3();
    let movingForward = 0;
    let movingRight = 0;
    if (keys.current.has("KeyW") || keys.current.has("ArrowUp")) {
      moveInput.add(forward);
      movingForward = 1;
    }
    if (keys.current.has("KeyS") || keys.current.has("ArrowDown")) {
      moveInput.sub(forward);
      movingForward = -1;
    }
    if (keys.current.has("KeyD") || keys.current.has("ArrowRight")) {
      moveInput.add(right);
      movingRight = 1;
    }
    if (keys.current.has("KeyA") || keys.current.has("ArrowLeft")) {
      moveInput.sub(right);
      movingRight = -1;
    }
    if (keys.current.has("Space")) moveInput.y += 1;
    if (keys.current.has("KeyQ")) moveInput.y -= 1;

    if (moveInput.lengthSq() > 0) {
      moveInput.normalize().multiplyScalar(speed * delta);
    }

    // Smooth velocity
    velocity.current.lerp(moveInput, 0.12);
    dronePos.current.add(velocity.current);

    // Floor clamp
    if (dronePos.current.y < MIN_HEIGHT) {
      dronePos.current.y = MIN_HEIGHT;
    }

    // Hover bob
    bobPhase.current += delta * 2.5;
    const bob = Math.sin(bobPhase.current) * 0.3;

    // Tilt drone based on movement (lean into turns)
    const targetTiltX = -movingForward * MAX_TILT;
    const targetTiltZ = movingRight * MAX_TILT;
    tilt.current.x += (targetTiltX - tilt.current.x) * DRONE_TILT_SPEED;
    tilt.current.z += (targetTiltZ - tilt.current.z) * DRONE_TILT_SPEED;

    // Update drone group
    droneGroupRef.current.position.set(
      dronePos.current.x,
      dronePos.current.y + bob,
      dronePos.current.z
    );

    // Broadcast position to multiplayer server (rate-limited inside the hook)
    if (onMove) {
      onMove(
        dronePos.current.x,
        dronePos.current.y + bob,
        dronePos.current.z,
        yaw.current,
        tilt.current.z
      );
    }

    // Drone rotation: yaw + tilt
    const droneEuler = new THREE.Euler(
      tilt.current.x,
      yaw.current + Math.PI,
      tilt.current.z,
      "YXZ"
    );
    droneQuat.current.setFromEuler(droneEuler);
    droneGroupRef.current.quaternion.slerp(droneQuat.current, 0.15);

    // Camera: third-person chase behind and above drone
    const camOffset = new THREE.Vector3(0, CAM_HEIGHT, CAM_DISTANCE);
    camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);

    // Vertical offset from pitch
    camOffset.y += -pitch.current * 20;

    const desiredCamPos = dronePos.current.clone().add(camOffset);
    camera.position.lerp(desiredCamPos, CAM_LERP);

    // Look at drone (slightly ahead of it)
    const lookTarget = dronePos.current
      .clone()
      .add(forward.clone().multiplyScalar(10));
    lookTarget.y = dronePos.current.y;
    camera.lookAt(lookTarget);
  });

  return (
    <group ref={droneGroupRef}>
      <DroneMesh visible={enabled} />
    </group>
  );
}
