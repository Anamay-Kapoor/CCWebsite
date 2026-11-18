import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BOARD, seeded, makeSampler } from './places';
import { useCanvasTexture } from './textures';
import { GLOW } from './parts';
import { step } from './motion';

/*
 * The "mainboard" the club board is plugged into: faint traces running out from the
 * board's edges, scattered component footprints, a red pool of light under the board,
 * and pulses travelling along the traces into the board. Fills the dark around the hero.
 */

const SPAN = 150;            // ground size in world units
const PX = 2048 / SPAN;      // texture pixels per unit
const Y = -0.56;             // just under the board's standoffs

/* Traces in world coordinates [x, z], starting at the board edge and running outward. */
function makeTraces() {
  const rnd = seeded(91);
  const hw = BOARD.w / 2 + 0.6;
  const hd = BOARD.d / 2 + 0.6;
  const out = [];
  const sides = [
    { n: 14, at: (k) => [-hw + 0.8 + k * ((2 * hw - 1.6) / 13), -hd], dir: [0, -1] },
    { n: 14, at: (k) => [-hw + 0.8 + k * ((2 * hw - 1.6) / 13), hd], dir: [0, 1] },
    { n: 10, at: (k) => [-hw, -hd + 0.8 + k * ((2 * hd - 1.6) / 9)], dir: [-1, 0] },
    { n: 10, at: (k) => [hw, -hd + 0.8 + k * ((2 * hd - 1.6) / 9)], dir: [1, 0] },
  ];
  sides.forEach(({ n, at, dir }) => {
    for (let k = 0; k < n; k++) {
      if (rnd() < 0.18) continue;
      let [x, z] = at(k);
      const pts = [[x, z]];
      const legs = 2 + Math.floor(rnd() * 3);
      for (let l = 0; l < legs; l++) {
        const len = 3 + rnd() * 9;
        x += dir[0] * len; z += dir[1] * len;
        pts.push([x, z]);
        // 45° jog sideways, PCB style
        const side = rnd() < 0.5 ? -1 : 1;
        const jog = 1 + rnd() * 4;
        const perp = [dir[1] !== 0 ? 1 : 0, dir[0] !== 0 ? 1 : 0];
        x += (dir[0] + perp[0] * side) * jog;
        z += (dir[1] + perp[1] * side) * jog;
        pts.push([x, z]);
      }
      x += dir[0] * (25 + rnd() * 25); z += dir[1] * (25 + rnd() * 25);
      pts.push([x, z]);
      out.push(pts);
    }
  });
  return out;
}

function drawGround(ctx, W, H, traces) {
  const u = (x) => (x + SPAN / 2) * PX;
  const v = (z) => (z + SPAN / 2) * PX;
  const rnd = seeded(17);
  ctx.fillStyle = '#0b0b0b';
  ctx.fillRect(0, 0, W, H);

  // fine grid
  ctx.strokeStyle = 'rgba(255,255,255,0.025)';
  ctx.lineWidth = 1;
  for (let g = -SPAN / 2; g <= SPAN / 2; g += 2) {
    ctx.beginPath(); ctx.moveTo(u(g), 0); ctx.lineTo(u(g), H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, v(g)); ctx.lineTo(W, v(g)); ctx.stroke();
  }

  // component footprints scattered around (kept clear of the board)
  for (let i = 0; i < 70; i++) {
    const x = (rnd() * 2 - 1) * 66;
    const z = (rnd() * 2 - 1) * 66;
    if (Math.abs(x) < BOARD.w / 2 + 4 && Math.abs(z) < BOARD.d / 2 + 4) continue;
    const w = 1.5 + rnd() * 5;
    const d = 1.5 + rnd() * 4;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(u(x - w / 2), v(z - d / 2), w * PX, d * PX);
    ctx.fillStyle = 'rgba(176,141,60,0.12)';
    const pads = Math.floor(w / 0.6);
    for (let p = 0; p < pads; p++) {
      ctx.fillRect(u(x - w / 2 + 0.3 + p * 0.6), v(z + d / 2 + 0.15), 0.25 * PX, 0.4 * PX);
      ctx.fillRect(u(x - w / 2 + 0.3 + p * 0.6), v(z - d / 2 - 0.55), 0.25 * PX, 0.4 * PX);
    }
  }

  // traces + vias
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  traces.forEach((pts, i) => {
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(160,30,25,0.30)' : 'rgba(255,255,255,0.075)';
    ctx.lineWidth = (i % 3 === 0 ? 0.16 : 0.11) * PX;
    ctx.beginPath();
    pts.forEach(([x, z], j) => (j ? ctx.lineTo(u(x), v(z)) : ctx.moveTo(u(x), v(z))));
    ctx.stroke();
    const [ex, ez] = pts[pts.length - 1];
    ctx.fillStyle = 'rgba(176,141,60,0.25)';
    ctx.beginPath(); ctx.arc(u(ex), v(ez), 0.32 * PX, 0, Math.PI * 2); ctx.fill();
  });

  // the board's socket outline on the mainboard
  ctx.strokeStyle = 'rgba(255,60,40,0.18)';
  ctx.lineWidth = 0.12 * PX;
  ctx.setLineDash([0.6 * PX, 0.4 * PX]);
  ctx.strokeRect(u(-BOARD.w / 2 - 0.8), v(-BOARD.d / 2 - 0.8), (BOARD.w + 1.6) * PX, (BOARD.d + 1.6) * PX);
  ctx.setLineDash([]);
}

function useGlowTexture() {
  return useCanvasTexture(256, 256, (ctx, W) => {
    const g = ctx.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2);
    g.addColorStop(0, 'rgba(255,40,30,0.55)');
    g.addColorStop(0.35, 'rgba(200,20,15,0.18)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, W);
  });
}

/* Pulses flowing in along the traces, toward the board. */
function Pulses({ traces, count }) {
  const ref = useRef();
  const lanes = useMemo(() => {
    const rnd = seeded(5);
    return Array.from({ length: count }, (_, i) => {
      const pts = traces[(i * 7) % traces.length];
      return { sample: makeSampler([...pts].reverse()), t: rnd(), speed: 0.05 + rnd() * 0.06 };
    });
  }, [traces, count]);
  const m = useMemo(() => new THREE.Matrix4(), []);
  useEffect(() => { ref.current.count = lanes.length; }, [lanes]);
  useFrame((_, dt) => {
    const d = step(dt);
    lanes.forEach((l, i) => {
      l.t = (l.t + d * l.speed) % 1;
      const [x, z] = l.sample(l.t);
      // fade in from the dark: smaller far out, full size near the board
      const s = 0.35 + 0.65 * l.t;
      m.makeScale(s, s, s).setPosition(x, Y + 0.06, z);
      ref.current.setMatrixAt(i, m);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[null, null, count]} frustumCulled={false}>
      <boxGeometry args={[0.22, 0.06, 0.22]} />
      <meshBasicMaterial color={GLOW} toneMapped={false} />
    </instancedMesh>
  );
}

export default function Ground({ low }) {
  const traces = useMemo(makeTraces, []);
  const tex = useCanvasTexture(2048, 2048, (ctx, W, H) => drawGround(ctx, W, H, traces), [], { anisotropy: 8 });
  const glow = useGlowTexture();
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={Y} receiveShadow>
        <planeGeometry args={[SPAN, SPAN]} />
        <meshStandardMaterial map={tex} roughness={0.9} metalness={0.05} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={Y + 0.02}>
        <planeGeometry args={[46, 40]} />
        <meshBasicMaterial map={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <Pulses traces={traces} count={low ? 14 : 28} />
    </group>
  );
}
