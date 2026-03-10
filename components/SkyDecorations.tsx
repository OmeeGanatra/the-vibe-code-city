"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Helpers ──────────────────────────────────────────────────

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s ^= s >>> 16;
    return (s >>> 0) / 0xffffffff;
  };
}

function makeRadialGradTex(
  size: number,
  innerColor: string,
  outerColor: string,
  innerAlpha: number,
  outerAlpha: number,
): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const r = size / 2;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, hexToRgba(innerColor, innerAlpha));
  g.addColorStop(1, hexToRgba(outerColor, outerAlpha));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

const _camPos = new THREE.Vector3();
const _tmpQ = new THREE.Quaternion();
const _fwd3 = new THREE.Vector3(0, 0, 1);

function billboard(mesh: THREE.Object3D, cameraPos: THREE.Vector3, meshWorldPos: THREE.Vector3) {
  _camPos.copy(cameraPos).sub(meshWorldPos).normalize();
  _tmpQ.setFromUnitVectors(_fwd3, _camPos);
  mesh.quaternion.copy(_tmpQ);
}

// ─── Stars ──────────────────────────────────────────────────

function Stars() {
  const pointsRef = useRef<THREE.Points>(null);
  const elapsed = useRef(0);

  const COUNT = 2200;
  const RADIUS = 3200;

  const { geo, mat, phases } = useMemo(() => {
    const rand = seeded(0xdeadbeef);
    const positions = new Float32Array(COUNT * 3);
    const phases = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      let x, y, z, len;
      do {
        x = rand() * 2 - 1;
        y = rand() * 2 - 1;
        z = rand() * 2 - 1;
        len = Math.sqrt(x * x + y * y + z * z);
      } while (len < 0.001 || len > 1);
      positions[i * 3] = (x / len) * RADIUS;
      positions[i * 3 + 1] = Math.abs(y / len) * RADIUS;
      positions[i * 3 + 2] = (z / len) * RADIUS;
      phases[i] = rand() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: new THREE.Color("#ffcba0"),
      size: 1.6,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      depthTest: true,
      fog: false,
    });
    return { geo, mat, phases };
  }, []);

  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);

  useFrame(({ camera }, delta) => {
    elapsed.current += delta;
    if (pointsRef.current) pointsRef.current.position.copy(camera.position);
    const t = elapsed.current;
    mat.opacity = 0.6 + 0.25 * Math.sin(t * 0.9 + phases[Math.floor(t * 3) % COUNT]);
  });

  return <points ref={pointsRef} geometry={geo} material={mat} renderOrder={-2} />;
}

// ─── Moon ──────────────────────────────────────────────────

function Moon() {
  const discRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const { discGeo, discMat, glowGeo, glowMat } = useMemo(() => {
    const size = 256;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d")!;
    const cx = size / 2, cy = size / 2, r = size / 2 - 2;

    // Warm-tinted moon
    const baseGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    baseGrad.addColorStop(0, "rgba(255,220,180,1)");
    baseGrad.addColorStop(0.85, "rgba(220,160,100,1)");
    baseGrad.addColorStop(1, "rgba(160,80,40,0)");
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Terminator shadow
    const shadowGrad = ctx.createLinearGradient(cx * 0.3, 0, cx * 1.7, 0);
    shadowGrad.addColorStop(0, "rgba(0,0,0,0)");
    shadowGrad.addColorStop(0.55, "rgba(13,4,0,0)");
    shadowGrad.addColorStop(0.72, "rgba(13,4,0,0.55)");
    shadowGrad.addColorStop(1, "rgba(13,4,0,0.92)");
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;

    const discGeo = new THREE.CircleGeometry(30, 48);
    const discMat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 1,
      depthWrite: false, depthTest: true, fog: false, side: THREE.DoubleSide,
    });

    const glowTex = makeRadialGradTex(256, "#c08060", "#0d0400", 0.4, 0);
    const glowGeo = new THREE.PlaneGeometry(200, 200);
    const glowMat = new THREE.MeshBasicMaterial({
      map: glowTex, transparent: true, opacity: 0.5,
      depthWrite: false, depthTest: false, fog: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    return { discGeo, discMat, glowGeo, glowMat };
  }, []);

  useEffect(() => () => {
    discMat.map?.dispose(); discMat.dispose();
    glowMat.map?.dispose(); glowMat.dispose();
    discGeo.dispose(); glowGeo.dispose();
  }, [discGeo, discMat, glowGeo, glowMat]);

  const LOCAL = useMemo(() => {
    const az = Math.PI * 0.35, el = Math.PI * 0.32, d = 3000;
    return new THREE.Vector3(
      Math.cos(el) * Math.sin(az) * d,
      Math.sin(el) * d,
      Math.cos(el) * Math.cos(az) * d
    );
  }, []);

  const worldPos = useRef(new THREE.Vector3());

  useFrame(({ camera }) => {
    worldPos.current.copy(camera.position).add(LOCAL);
    if (discRef.current) {
      discRef.current.position.copy(worldPos.current);
      billboard(discRef.current, camera.position, worldPos.current);
    }
    if (glowRef.current) {
      glowRef.current.position.copy(worldPos.current);
      billboard(glowRef.current, camera.position, worldPos.current);
    }
  });

  return (
    <>
      <mesh ref={glowRef} geometry={glowGeo} material={glowMat} renderOrder={-2} />
      <mesh ref={discRef} geometry={discGeo} material={discMat} renderOrder={-1} />
    </>
  );
}

// ─── Shooting Stars ─────────────────────────────────────────

function ShootingStars() {
  const POOL = 3;
  const meshRefs = useRef<(THREE.Mesh | null)[]>(Array(POOL).fill(null));
  const matRefs = useRef<(THREE.MeshBasicMaterial | null)[]>(Array(POOL).fill(null));

  const active = useRef<boolean[]>(Array(POOL).fill(false));
  const progress = useRef<number[]>(Array(POOL).fill(0));
  const duration = useRef<number[]>(Array(POOL).fill(1));
  const direction = useRef<THREE.Vector3[]>(Array.from({ length: POOL }, () => new THREE.Vector3()));
  const origin = useRef<THREE.Vector3[]>(Array.from({ length: POOL }, () => new THREE.Vector3()));
  const nextFire = useRef<number[]>(Array(POOL).fill(0));
  const elapsed = useRef(0);

  const { geo, mats } = useMemo(() => {
    const size = 256;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = 12;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, size, 0);
    g.addColorStop(0, "rgba(255,180,120,0)");
    g.addColorStop(0.3, "rgba(255,200,150,0.9)");
    g.addColorStop(0.85, "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(255,255,255,0.3)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, 12);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;

    const geo = new THREE.PlaneGeometry(220, 3);
    const mats = Array.from({ length: POOL }, () =>
      new THREE.MeshBasicMaterial({
        map: tex, transparent: true, opacity: 0,
        depthWrite: false, depthTest: false, fog: false,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      })
    );
    return { geo, mats };
  }, []);

  useEffect(() => () => {
    geo.dispose();
    mats.forEach(m => { m.map?.dispose(); m.dispose(); });
  }, [geo, mats]);

  const rand = useMemo(() => seeded(0x5eed1234), []);

  useFrame(({ camera }, delta) => {
    elapsed.current += delta;
    const t = elapsed.current;

    for (let i = 0; i < POOL; i++) {
      const mesh = meshRefs.current[i];
      const mat = matRefs.current[i];
      if (!mesh || !mat) continue;

      if (!active.current[i]) {
        if (t >= nextFire.current[i]) {
          active.current[i] = true;
          progress.current[i] = 0;
          duration.current[i] = 0.8 + rand() * 0.6;

          const az = rand() * Math.PI * 2;
          const el = 0.3 + rand() * 0.5;
          const d = 2800;
          origin.current[i].set(
            camera.position.x + Math.cos(el) * Math.sin(az) * d,
            camera.position.y + Math.sin(el) * d,
            camera.position.z + Math.cos(el) * Math.cos(az) * d,
          );
          direction.current[i].set(rand() - 0.5, -(0.2 + rand() * 0.4), rand() - 0.5).normalize();
        }
        mat.opacity = 0;
        mesh.visible = false;
        continue;
      }

      progress.current[i] += delta / duration.current[i];
      if (progress.current[i] >= 1) {
        active.current[i] = false;
        mat.opacity = 0;
        mesh.visible = false;
        nextFire.current[i] = t + 15 + rand() * 30;
        continue;
      }

      mesh.visible = true;
      const p = progress.current[i];
      mat.opacity = p < 0.15 ? p / 0.15 : (1 - (p - 0.15) / 0.85);

      const travel = p * 350;
      mesh.position.copy(origin.current[i]).addScaledVector(direction.current[i], travel);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction.current[i]);
    }
  });

  return (
    <>
      {Array.from({ length: POOL }, (_, i) => (
        <mesh
          key={i}
          ref={el => { meshRefs.current[i] = el; matRefs.current[i] = el?.material as THREE.MeshBasicMaterial ?? null; }}
          geometry={geo}
          material={mats[i]}
          renderOrder={-1}
          visible={false}
        />
      ))}
    </>
  );
}

// ─── Ember Particles (floating embers rising from the city) ─

function EmberParticles() {
  const COUNT = 80;
  const groupRef = useRef<THREE.Group>(null);
  const elapsed = useRef(0);

  const { geo, mat, particles } = useMemo(() => {
    const rand = seeded(0xE1BE7);
    const positions = new Float32Array(COUNT * 3);
    const phases = [];

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (rand() - 0.5) * 1200;
      positions[i * 3 + 1] = rand() * 400;
      positions[i * 3 + 2] = (rand() - 0.5) * 1200;
      phases.push({
        phase: rand() * Math.PI * 2,
        speed: 3 + rand() * 8,
        drift: (rand() - 0.5) * 0.5,
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: new THREE.Color("#ff6b35"),
      size: 3,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    });

    return { geo, mat, particles: phases };
  }, []);

  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);

  useFrame(({ camera }, delta) => {
    elapsed.current += delta;
    if (groupRef.current) groupRef.current.position.copy(camera.position);

    const posArr = geo.attributes.position.array as Float32Array;
    const t = elapsed.current;

    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];
      posArr[i * 3 + 1] += p.speed * delta;
      posArr[i * 3] += Math.sin(t * 0.5 + p.phase) * p.drift;

      // Reset when too high
      if (posArr[i * 3 + 1] > 500) {
        posArr[i * 3 + 1] = -50;
      }
    }
    geo.attributes.position.needsUpdate = true;

    // Pulse opacity
    mat.opacity = 0.45 + 0.2 * Math.sin(t * 1.2);
  });

  return (
    <group ref={groupRef}>
      <points geometry={geo} material={mat} renderOrder={-1} />
    </group>
  );
}

// ─── Root Export ──────────────────────────────────────────────

export default function SkyDecorations() {
  return (
    <>
      <Stars />
      <Moon />
      <ShootingStars />
      <EmberParticles />
    </>
  );
}
