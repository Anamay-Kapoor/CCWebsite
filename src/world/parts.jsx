import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useCanvasTexture, useLabel, drawLid, drawClock } from './textures';
import { step } from './motion';
import { CLUB } from '../data/club';

export const RED = '#f50000';
export const GLOW = new THREE.Color(4, 0.12, 0.08); // > 1 so bloom picks it up
const AMBER = new THREE.Color(3, 1.2, 0.1);
export const SOFT = new THREE.Color(0.85, 0.04, 0.03); // plain red, below the bloom threshold

/* ---------- shared materials ---------- */
let materials = null;
export function useMaterials() {
  if (!materials) materials = makeMaterials();
  return materials;
}

function makeMaterials() {
  return ({
    pcb: new THREE.MeshStandardMaterial({ color: '#141515', roughness: 0.75, metalness: 0.1 }),
    plastic: new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.6, metalness: 0.05 }),
    plasticHi: new THREE.MeshStandardMaterial({ color: '#1c1c1c', roughness: 0.45, metalness: 0.1 }),
    steel: new THREE.MeshStandardMaterial({ color: '#c4c6c9', roughness: 0.28, metalness: 1 }),
    darkSteel: new THREE.MeshStandardMaterial({ color: '#4b4e52', roughness: 0.35, metalness: 1 }),
    gold: new THREE.MeshStandardMaterial({ color: '#d4a64a', roughness: 0.25, metalness: 1 }),
    copper: new THREE.MeshStandardMaterial({ color: '#b8683a', roughness: 0.3, metalness: 1 }),
    rubber: new THREE.MeshStandardMaterial({ color: '#0e0e0e', roughness: 0.9, metalness: 0 }),
    ceramic: new THREE.MeshStandardMaterial({ color: '#b89a6a', roughness: 0.5, metalness: 0.2 }),
    cream: new THREE.MeshStandardMaterial({ color: '#d8d2c4', roughness: 0.55, metalness: 0 }),
    glow: new THREE.MeshBasicMaterial({ color: GLOW, toneMapped: false }),
    glowDim: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.02, 0.02), toneMapped: false }),
    black: new THREE.MeshBasicMaterial({ color: '#030303' }),
  });
}

/* Instanced boxes placed by a list of [x, y, z] (optionally [sx, sy, sz]). */
export function Instances({ items, size, material }) {
  const ref = useRef();
  useEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    items.forEach(([x, y, z, sx = 1, sy = 1, sz = 1], i) => {
      m.compose(new THREE.Vector3(x, y, z), q, s.set(sx, sy, sz));
      ref.current.setMatrixAt(i, m);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [items]);
  return (
    <instancedMesh ref={ref} args={[null, material, items.length]} castShadow receiveShadow>
      <boxGeometry args={size} />
    </instancedMesh>
  );
}

const ring = (n, half, y, fn) => {
  const out = [];
  for (let s = 0; s < 4; s++) {
    for (let i = 0; i < n; i++) {
      const t = -half + ((i + 0.5) * (2 * half)) / n;
      out.push(fn(s, t, y));
    }
  }
  return out;
};

function Led({ position, color = GLOW, blink = 0, phase = 0, size = 0.1 }) {
  const ref = useRef();
  const t = useRef(phase);
  useFrame((_, dt) => {
    if (!blink) return;
    t.current += step(dt);
    ref.current.visible = Math.sin(t.current * blink) > -0.2;
  });
  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[size, size * 0.5, size]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

/* =================== U1: CPU =================== */
export function Cpu() {
  const M = useMaterials();
  const lid = useCanvasTexture(1024, 1024, drawLid);
  const pads = useMemo(() => ring(18, 1.5, 0.215, (s, t, y) => (
    s < 2 ? [t, y, s ? 1.56 : -1.56, 1, 1, 1] : [s === 2 ? -1.56 : 1.56, y, t, 1, 1, 1]
  )), []);
  const smd = useMemo(() => ring(7, 0.9, 0.29, (s, t, y) => (
    s < 2 ? [t, y, s ? 1.32 : -1.32] : [s === 2 ? -1.32 : 1.32, y, t]
  )), []);

  return (
    <group>
      {/* socket frame */}
      <RoundedBox args={[3.7, 0.14, 3.7]} radius={0.05} position-y={0.12} material={M.plastic} castShadow receiveShadow />
      {/* substrate */}
      <RoundedBox args={[3.1, 0.1, 3.1]} radius={0.03} position-y={0.24} castShadow receiveShadow>
        <meshStandardMaterial color="#0f2018" roughness={0.6} metalness={0.2} />
      </RoundedBox>
      <Instances items={pads} size={[0.07, 0.02, 0.07]} material={M.gold} />
      <Instances items={smd} size={[0.12, 0.07, 0.07]} material={M.ceramic} />
      {/* heat spreader */}
      <RoundedBox args={[2.3, 0.2, 2.3]} radius={0.07} position-y={0.39} material={M.steel} castShadow receiveShadow />
      <mesh position-y={0.492} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[2.16, 2.16]} />
        <meshStandardMaterial map={lid} roughness={0.32} metalness={0.85} />
      </mesh>
      {/* retention lever */}
      <mesh position={[1.95, 0.2, 0]} material={M.steel} castShadow>
        <boxGeometry args={[0.05, 0.05, 3.4]} />
      </mesh>
      <mesh position={[1.95, 0.2, 1.75]} rotation-z={Math.PI / 2} material={M.steel}>
        <cylinderGeometry args={[0.06, 0.06, 0.3, 10]} />
      </mesh>
      <Led position={[-1.75, 0.21, 1.75]} blink={2.2} />
    </group>
  );
}

/* =================== ANT1: RF module =================== */
export function Antenna({ hot }) {
  const M = useMaterials();
  const label = useLabel(['RF-2.4G · CC', 'FCC ID 2AC-C2026'], { w: 512, h: 256, bg: '#b9bcc0', fg: 'rgba(30,32,35,0.85)', size: 0.2 });
  const rings = useRef([]);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += step(dt);
    rings.current.forEach((r, i) => {
      if (!r) return;
      const p = (t.current * 0.45 + i / 3) % 1;
      r.scale.setScalar(0.3 + p * 2.2);
      r.material.opacity = (1 - p) * (hot ? 0.95 : 0.5);
    });
  });
  return (
    <group>
      <RoundedBox args={[2.1, 0.08, 1.7]} radius={0.03} position-y={0.12} material={M.pcb} castShadow receiveShadow />
      <RoundedBox args={[1.35, 0.2, 1.05]} radius={0.04} position={[-0.25, 0.26, 0.1]} material={M.steel} castShadow />
      <mesh position={[-0.25, 0.362, 0.1]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1.2, 0.9]} />
        <meshStandardMaterial map={label} roughness={0.35} metalness={0.7} />
      </mesh>
      {/* SMA connector */}
      <mesh position={[0.7, 0.32, -0.4]} material={M.gold} castShadow><cylinderGeometry args={[0.16, 0.16, 0.36, 6]} /></mesh>
      <mesh position={[0.7, 0.55, -0.4]} material={M.gold}><cylinderGeometry args={[0.1, 0.1, 0.2, 16]} /></mesh>
      {/* whip */}
      <mesh position={[0.7, 0.72, -0.4]} material={M.rubber} castShadow><cylinderGeometry args={[0.13, 0.13, 0.2, 16]} /></mesh>
      <mesh position={[0.7, 1.95, -0.4]} material={M.rubber} castShadow><cylinderGeometry args={[0.05, 0.11, 2.3, 16]} /></mesh>
      <mesh position={[0.7, 3.12, -0.4]} material={M.glow}><sphereGeometry args={[0.08, 16, 16]} /></mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => { rings.current[i] = el; }} position={[0.7, 3.12, -0.4]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.36, 0.4, 48]} />
          <meshBasicMaterial color={GLOW} transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
      <Instances items={[[0.6, 0.2, 0.55], [0.85, 0.2, 0.55], [0.6, 0.2, 0.3]]} size={[0.14, 0.08, 0.08]} material={M.ceramic} />
      <Led position={[0.85, 0.19, 0.3]} blink={7} />
      <Led position={[-0.85, 0.19, -0.7]} blink={3} phase={1} color={AMBER} />
    </group>
  );
}

/* =================== Y1: clock module =================== */
export function Clock({ hot }) {
  const M = useMaterials();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const clock = useCanvasTexture(1024, 256, drawClock, [tick]);
  const xtal = useLabel(['32.768K', 'CC'], { w: 256, h: 128, bg: '#c9cbce', fg: 'rgba(30,30,30,0.8)', size: 0.3 });

  return (
    <group>
      <RoundedBox args={[2.3, 0.08, 1.8]} radius={0.03} position-y={0.12} material={M.pcb} castShadow receiveShadow />
      {/* display, standing up and facing the camera */}
      <RoundedBox args={[2.05, 0.82, 0.32]} radius={0.05} position={[0, 0.58, -0.15]} material={M.plastic} castShadow />
      <mesh position={[0, 0.6, 0.013]}>
        <planeGeometry args={[1.85, 0.6]} />
        <meshBasicMaterial map={clock} color={hot ? new THREE.Color(2.6, 2.6, 2.6) : new THREE.Color(1.7, 1.7, 1.7)} toneMapped={false} />
      </mesh>
      {/* HC-49 crystal */}
      <RoundedBox args={[0.95, 0.34, 0.36]} radius={0.16} position={[-0.45, 0.33, 0.55]} material={M.steel} castShadow />
      <mesh position={[-0.45, 0.502, 0.55]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.6, 0.22]} />
        <meshStandardMaterial map={xtal} metalness={0.6} roughness={0.35} />
      </mesh>
      <Instances items={[[0.45, 0.2, 0.55], [0.7, 0.2, 0.55], [0.95, 0.2, 0.55]]} size={[0.14, 0.08, 0.08]} material={M.ceramic} />
      <Led position={[0.95, 0.19, 0.25]} blink={Math.PI} />
    </group>
  );
}

/* =================== U2-U4: RAM =================== */
function Dimm({ x, i, hot }) {
  const M = useMaterials();
  const label = useLabel(['CC DDR5-6400', '16GB · CL32'], { w: 512, h: 160, bg: '#202224', fg: 'rgba(235,235,235,0.75)', size: 0.24 });
  const bar = useRef();
  const t = useRef(i * 0.7);
  const fingers = useMemo(() => Array.from({ length: 24 }, (_, k) => [-0.86 + k * 0.075, 0.05, 0]), []);
  const fins = useMemo(() => Array.from({ length: 12 }, (_, k) => [-0.82 + k * 0.149, 0.92, 0]), []);
  useFrame((_, dt) => {
    t.current += step(dt) * (hot ? 4 : 1.6);
    const k = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t.current));
    bar.current.material.color.setRGB(4 * k, 0.1 * k, 0.08 * k);
  });
  return (
    <group position={[0, 0.32, x]}>
      <mesh position-y={0.5} material={M.pcb} castShadow><boxGeometry args={[1.95, 0.95, 0.04]} /></mesh>
      <Instances items={fingers} size={[0.05, 0.1, 0.05]} material={M.gold} />
      {/* heat spreader, both faces */}
      <RoundedBox args={[1.88, 0.78, 0.1]} radius={0.03} position-y={0.52} material={M.darkSteel} castShadow />
      <mesh position={[0, 0.5, 0.052]}>
        <planeGeometry args={[1.2, 0.36]} />
        <meshStandardMaterial map={label} roughness={0.5} metalness={0.3} />
      </mesh>
      {/* cooling fins along the top edge */}
      <Instances items={fins} size={[0.05, 0.07, 0.115]} material={M.darkSteel} />
      <mesh ref={bar} position-y={1.0}>
        <boxGeometry args={[1.86, 0.06, 0.08]} />
        <meshBasicMaterial color={GLOW} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function Ram({ hot }) {
  const M = useMaterials();
  const slots = [-0.5, 0, 0.5];
  return (
    <group>
      <RoundedBox args={[2.4, 0.08, 1.9]} radius={0.03} position-y={0.12} material={M.pcb} castShadow receiveShadow />
      {slots.map((z) => (
        <group key={z}>
          <RoundedBox args={[2.2, 0.18, 0.18]} radius={0.03} position={[0, 0.25, z]} material={M.plasticHi} castShadow />
          <mesh position={[-1.08, 0.42, z]} material={M.cream} castShadow><boxGeometry args={[0.07, 0.34, 0.16]} /></mesh>
          <mesh position={[1.08, 0.42, z]} material={M.cream} castShadow><boxGeometry args={[0.07, 0.34, 0.16]} /></mesh>
        </group>
      ))}
      {slots.map((z, i) => <Dimm key={z} x={z} i={i} hot={hot} />)}
    </group>
  );
}

/* =================== C1-C6: capacitor bank =================== */
const MONO = "'Geist Mono', ui-monospace, monospace";
const DISPLAY = "'Clash Display', 'General Sans', sans-serif";

function useCapTop() {
  return useCanvasTexture(512, 512, (ctx, W) => {
    const g = ctx.createRadialGradient(W * 0.42, W * 0.38, 0, W / 2, W / 2, W / 2);
    g.addColorStop(0, '#eceef1');
    g.addColorStop(0.7, '#b9bcc1');
    g.addColorStop(1, '#8e9196');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, W);
    // spun-metal rings
    for (let r = 12; r < W / 2; r += 7) {
      ctx.strokeStyle = `rgba(0,0,0,${0.03 + (r % 3) * 0.01})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(W / 2, W / 2, r, 0, Math.PI * 2); ctx.stroke();
    }
    // pressure-vent score: a K/X groove like real caps
    ctx.strokeStyle = 'rgba(40,42,46,0.75)';
    ctx.lineWidth = W * 0.022;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(W * 0.5, W * 0.16); ctx.lineTo(W * 0.5, W * 0.84);
    ctx.moveTo(W * 0.21, W * 0.33); ctx.lineTo(W * 0.79, W * 0.67);
    ctx.moveTo(W * 0.21, W * 0.67); ctx.lineTo(W * 0.79, W * 0.33);
    ctx.stroke();
  });
}

/* Printed PVC sleeve: brand text on the front, polarity stripe with "−" marks. */
function useSleeve(label, value) {
  return useCanvasTexture(1024, 512, (ctx, W, H) => {
    const base = ctx.createLinearGradient(0, 0, 0, H);
    base.addColorStop(0, '#17171b');
    base.addColorStop(1, '#0f0f12');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);
    // polarity stripe (round the side)
    const sx = W * 0.6;
    const sw = W * 0.14;
    ctx.fillStyle = '#b8bcc3';
    ctx.fillRect(sx, 0, sw, H);
    ctx.fillStyle = '#17171b';
    for (let y = H * 0.1; y < H * 0.92; y += H * 0.16) ctx.fillRect(sx + sw * 0.28, y, sw * 0.44, H * 0.04);
    // print on the front (u ≈ 0.25)
    const cx = W * 0.25;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff2a1a';
    ctx.font = `700 ${H * 0.055}px ${MONO}`;
    ctx.fillText('CC · BITS', cx, H * 0.22);
    ctx.fillStyle = 'rgba(240,240,240,0.92)';
    ctx.font = `700 ${H * 0.1}px ${DISPLAY}`;
    ctx.fillText(label, cx, H * 0.4);
    ctx.font = `600 ${H * 0.075}px ${MONO}`;
    ctx.fillText(value, cx, H * 0.6);
    ctx.fillStyle = 'rgba(240,240,240,0.55)';
    ctx.font = `500 ${H * 0.05}px ${MONO}`;
    ctx.fillText('16V · 105°C', cx, H * 0.75);
  }, [label, value], { anisotropy: 8 });
}

function Cap({ position, r, h, hot, label, value }) {
  const top = useCapTop();
  const sleeve = useSleeve(label, value);
  const lip = h - 0.035;
  return (
    <group position={position}>
      {/* rubber bung */}
      <mesh position-y={0.025}><cylinderGeometry args={[r * 0.9, r * 0.9, 0.05, 40]} /><meshStandardMaterial color="#0b0b0b" roughness={0.95} /></mesh>
      {/* sleeve, printed side facing the viewer */}
      <mesh position-y={0.04 + (lip - 0.04) / 2} rotation-y={-Math.PI * 0.4} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, lip - 0.04, 64, 1, true]} />
        <meshPhysicalMaterial map={sleeve} roughness={0.32} metalness={0.05} clearcoat={0.6} clearcoatRoughness={0.25} />
      </mesh>
      {/* crimp groove near the top */}
      <mesh position-y={h - 0.2} rotation-x={Math.PI / 2}><torusGeometry args={[r * 0.995, 0.014, 8, 64]} /><meshStandardMaterial color="#050505" roughness={0.9} /></mesh>
      {/* sleeve rolled over the top edge */}
      <mesh position-y={lip} rotation-x={Math.PI / 2} castShadow>
        <torusGeometry args={[r * 0.955, 0.04, 12, 64]} />
        <meshPhysicalMaterial color="#141418" roughness={0.3} clearcoat={0.6} />
      </mesh>
      {/* aluminium top with vent score */}
      <mesh position-y={lip + 0.012} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[r * 0.92, 64]} />
        <meshStandardMaterial map={top} metalness={0.6} roughness={0.38} envMapIntensity={0.6} />
      </mesh>
      {/* when the node is active, a thin glowing ring traces the lip */}
      {hot && (
        <mesh position-y={lip + 0.03} rotation-x={Math.PI / 2}>
          <torusGeometry args={[r * 0.955, 0.009, 6, 64]} />
          <meshBasicMaterial color={GLOW} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

/* Toroidal choke: ferrite core with real copper windings. */
function Inductor({ hot }) {
  const M = useMaterials();
  const ref = useRef();
  const winding = useMemo(() => {
    const R = 0.32;
    const rr = 0.135;
    const N = 26;
    class Coil extends THREE.Curve {
      getPoint(t, target = new THREE.Vector3()) {
        const th = t * Math.PI * 2;
        const ph = t * Math.PI * 2 * N;
        const d = R + rr * Math.cos(ph);
        return target.set(d * Math.cos(th), rr * Math.sin(ph), d * Math.sin(th));
      }
    }
    return new THREE.TubeGeometry(new Coil(), 1400, 0.024, 6, true);
  }, []);
  useFrame((_, dt) => { ref.current.rotation.y += step(dt) * (hot ? 0.8 : 0.2); });
  return (
    <group ref={ref}>
      <mesh rotation-x={Math.PI / 2} castShadow>
        <torusGeometry args={[0.32, 0.115, 24, 64]} />
        <meshStandardMaterial color="#2a2b2e" roughness={0.75} metalness={0.2} />
      </mesh>
      <mesh geometry={winding} material={M.copper} castShadow />
    </group>
  );
}

export function Caps({ hot }) {
  const M = useMaterials();
  const smd = useMemo(() => [[0.85, 0.19, -0.2], [0.85, 0.19, -0.5], [-0.15, 0.19, 0.88], [0.15, 0.19, 0.88]], []);
  return (
    <group>
      <RoundedBox args={[2.3, 0.08, 2.1]} radius={0.03} position-y={0.12} material={M.pcb} castShadow receiveShadow />
      <Cap position={[-0.52, 0.16, -0.42]} r={0.36} h={1.35} hot={hot} label="WEBDEV" value="470µF" />
      <Cap position={[0.3, 0.16, -0.5]} r={0.3} h={1.0} hot={hot} label="AI / ML" value="330µF" />
      <Cap position={[-0.6, 0.16, 0.48]} r={0.3} h={0.85} hot={hot} label="GAMEDEV" value="220µF" />
      <group position={[0.45, 0.31, 0.42]}><Inductor hot={hot} /></group>
      <Instances items={smd} size={[0.16, 0.07, 0.09]} material={M.ceramic} />
      <Led position={[0.95, 0.19, 0.85]} blink={hot ? 8 : 2} />
    </group>
  );
}

/* =================== J1: ZIF socket =================== */
function useSocketTop() {
  return useCanvasTexture(512, 512, (ctx, W) => {
    ctx.fillStyle = '#d9d3c4';
    ctx.fillRect(0, 0, W, W);
    ctx.fillStyle = '#2b2a27';
    const n = 15;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (r > 4 && r < 10 && c > 4 && c < 10) continue;
        ctx.beginPath();
        ctx.arc(W * 0.08 + (c * W * 0.84) / (n - 1), W * 0.08 + (r * W * 0.84) / (n - 1), W * 0.011, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.font = `600 ${W * 0.05}px 'Geist Mono', monospace`;
    ctx.fillText('ZIF-225', W * 0.4, W * 0.52);
  });
}

export function Socket({ hot }) {
  const M = useMaterials();
  const top = useSocketTop();
  const chipLabel = useLabel(['YOUR NAME', `HERE · ${CLUB.session}`], { w: 512, h: 512, bg: '#1a1a1a', fg: 'rgba(240,240,240,0.85)', size: 0.12 });
  const chip = useRef();
  const lever = useRef();
  const glow = useRef();
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += step(dt);
    // Hover above the socket, then seat itself. When active, stay seated.
    const cycle = (t.current % 5) / 5;
    const seat = hot ? 1 : THREE.MathUtils.smoothstep(cycle, 0.35, 0.55) * (1 - THREE.MathUtils.smoothstep(cycle, 0.8, 0.98));
    const target = THREE.MathUtils.lerp(1.25, 0.47, seat);
    chip.current.position.y += (target - chip.current.position.y) * Math.min(1, dt * 8);
    chip.current.rotation.y = (1 - seat) * Math.sin(t.current * 0.8) * 0.25;
    lever.current.rotation.x = THREE.MathUtils.lerp(1.2, 0, seat);
    glow.current.material.opacity = seat * 0.9;
  });
  return (
    <group>
      <RoundedBox args={[2.3, 0.08, 2.1]} radius={0.03} position-y={0.12} material={M.pcb} castShadow receiveShadow />
      <RoundedBox args={[1.8, 0.22, 1.8]} radius={0.04} position={[-0.15, 0.27, 0]} material={M.cream} castShadow receiveShadow />
      <mesh position={[-0.15, 0.382, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1.7, 1.7]} />
        <meshStandardMaterial map={top} roughness={0.6} />
      </mesh>
      <mesh ref={glow} position={[-0.15, 0.39, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshBasicMaterial color={GLOW} transparent opacity={0} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* lever pivots at the socket's right edge */}
      <group ref={lever} position={[0.82, 0.3, 0.85]}>
        <mesh position={[0, 0, -0.85]} material={M.steel} castShadow><boxGeometry args={[0.06, 0.06, 1.7]} /></mesh>
        <mesh position={[0, 0, -1.72]} rotation-z={Math.PI / 2} material={M.steel}><cylinderGeometry args={[0.07, 0.07, 0.24, 10]} /></mesh>
      </group>
      {/* the chip that wants to join */}
      <group ref={chip} position={[-0.15, 1.25, 0]}>
        <RoundedBox args={[1.3, 0.1, 1.3]} radius={0.03} castShadow>
          <meshStandardMaterial color="#0f2018" roughness={0.6} />
        </RoundedBox>
        <RoundedBox args={[0.95, 0.1, 0.95]} radius={0.03} position-y={0.08} material={M.plasticHi} castShadow />
        <mesh position-y={0.132} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.86, 0.86]} />
          <meshStandardMaterial map={chipLabel} roughness={0.5} />
        </mesh>
      </group>
      <Led position={[0.95, 0.19, -0.85]} blink={hot ? 12 : 2} />
    </group>
  );
}

/* =================== J2: ports =================== */
export function Port({ hot }) {
  const M = useMaterials();
  const cable = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.55, 0.3, 1.02),
      new THREE.Vector3(-0.55, 0.28, 1.4),
      new THREE.Vector3(-0.85, 0.16, 1.85),
      new THREE.Vector3(-1.7, 0.13, 2.2),
      new THREE.Vector3(-3.2, 0.13, 2.3),
    ]);
    return new THREE.TubeGeometry(curve, 80, 0.07, 16, false);
  }, []);
  // eight gold contacts inside the RJ45 opening
  const contacts = useMemo(() => Array.from({ length: 8 }, (_, k) => [0.5 - 0.21 + k * 0.06, 0.64, 0.53, 1, 1, 1]), []);
  return (
    <group>
      <RoundedBox args={[2.3, 0.08, 1.8]} radius={0.03} position-y={0.12} material={M.pcb} castShadow receiveShadow />

      {/* USB-C: stadium-shaped steel receptacle with the plug seated */}
      <RoundedBox args={[0.66, 0.22, 0.62]} radius={0.105} smoothness={6} position={[-0.55, 0.27, 0.3]} material={M.steel} castShadow />
      <RoundedBox args={[0.56, 0.3, 0.42]} radius={0.13} smoothness={6} position={[-0.55, 0.3, 0.8]} castShadow>
        <meshStandardMaterial color="#141414" roughness={0.55} />
      </RoundedBox>
      <mesh position={[-0.55, 0.3, 0.8]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.07, 0.012, 6, 24]} />
        <meshBasicMaterial color={hot ? GLOW : '#5a0d0d'} toneMapped={false} />
      </mesh>
      <mesh position={[-0.55, 0.3, 1.05]} rotation-x={Math.PI / 2} material={M.rubber} castShadow>
        <cylinderGeometry args={[0.075, 0.1, 0.12, 16]} />
      </mesh>
      <mesh geometry={cable} castShadow><meshStandardMaterial color="#121212" roughness={0.6} /></mesh>

      {/* RJ45 jack: shield can, opening with latch notch, contacts, LEDs */}
      <RoundedBox args={[0.95, 0.8, 1.05]} radius={0.035} smoothness={4} position={[0.5, 0.56, 0]} material={M.steel} castShadow />
      <mesh position={[0.5, 0.49, 0.52]} material={M.black}><boxGeometry args={[0.6, 0.42, 0.03]} /></mesh>
      <mesh position={[0.5, 0.25, 0.52]} material={M.black}><boxGeometry args={[0.24, 0.1, 0.03]} /></mesh>
      <Instances items={contacts} size={[0.026, 0.12, 0.02]} material={M.gold} />
      {/* grounding tabs on top and sides */}
      {[-0.28, 0.28].map((dx) => (
        <mesh key={dx} position={[0.5 + dx, 0.965, 0.38]} rotation-x={-0.3} material={M.steel}><boxGeometry args={[0.12, 0.012, 0.18]} /></mesh>
      ))}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[0.5 + sx * 0.49, 0.22, 0.2]} material={M.steel}><boxGeometry args={[0.03, 0.14, 0.12]} /></mesh>
      ))}
      <Led position={[0.27, 0.86, 0.535]} blink={hot ? 18 : 6} size={0.1} />
      <Led position={[0.73, 0.86, 0.535]} color={AMBER} blink={hot ? 9 : 1.5} phase={0.5} size={0.1} />

      {/* a couple of SMD parts so the module isn't bare */}
      <Instances items={[[0.95, 0.19, -0.72], [0.72, 0.19, -0.72], [-0.2, 0.19, -0.7]]} size={[0.16, 0.07, 0.09]} material={M.ceramic} />
      <RoundedBox args={[0.34, 0.07, 0.34]} radius={0.02} position={[-0.6, 0.19, -0.5]} material={M.plasticHi} castShadow />
    </group>
  );
}

export const PARTS = { antenna: Antenna, clock: Clock, ram: Ram, caps: Caps, socket: Socket, port: Port };
