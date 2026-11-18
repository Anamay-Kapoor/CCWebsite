import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, RoundedBox, Trail } from '@react-three/drei';
import { anchors } from './anchors';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { LOGO_SVG, LOGO_SIZE } from './logo';
import { PLACES, tracePath, makeSampler, seeded } from './places';
import { GLOW, SOFT, useMaterials } from './parts';
import { step } from './motion';

const damp = (dt, speed) => 1 - Math.exp(-dt * speed);

/* ---------------- Extruded club logo above the CPU ---------------- */
export function Logo3D() {
  const group = useRef();
  const beam = useRef();
  const t = useRef(0);
  const geom = useMemo(() => {
    const data = new SVGLoader().parse(LOGO_SVG);
    const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p));
    const g = new THREE.ExtrudeGeometry(shapes, {
      depth: 170, bevelEnabled: true, bevelThickness: 26, bevelSize: 16, bevelSegments: 3, curveSegments: 6,
    });
    g.center();
    return g;
  }, []);
  const s = 1.25 / LOGO_SIZE;

  useFrame((_, dt) => {
    t.current += step(dt);
    group.current.rotation.set(-0.42, Math.sin(t.current * 0.4) * 0.6, 0);
    group.current.position.y = 2.35 + Math.sin(t.current * 1.1) * 0.08;
    beam.current.material.opacity = 0.06 + Math.sin(t.current * 3) * 0.02;
  });

  return (
    <group>
      <group ref={group} position={[0, 2.35, 0]}>
        <mesh geometry={geom} scale={[s, -s, s]} castShadow>
          <meshStandardMaterial color="#ff3b30" emissive="#ff0000" emissiveIntensity={0.35} metalness={0.75} roughness={0.22} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* hologram beam from the lid */}
      <mesh ref={beam} position-y={1.42}>
        <cylinderGeometry args={[0.85, 0.35, 1.8, 40, 1, true]} />
        <meshBasicMaterial color={GLOW} transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh position-y={0.51} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.3, 0.38, 48]} />
        <meshBasicMaterial color={GLOW} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ---------------- Main traces + pulses ---------------- */
function Pulse({ pts, offset, hot }) {
  const ref = useRef();
  const sample = useMemo(() => makeSampler(pts), [pts]);
  const speed = useRef(0.16);
  const prog = useRef(offset);
  useFrame((_, dt) => {
    speed.current += ((hot ? 0.75 : 0.16) - speed.current) * damp(dt, 3);
    prog.current += step(dt) * speed.current;
    const [x, z] = sample(prog.current);
    ref.current.position.set(x, 0.19, z);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[hot ? 0.085 : 0.055, 10, 10]} />
      <meshBasicMaterial color={GLOW} toneMapped={false} />
    </mesh>
  );
}

export function Traces({ active, hovered }) {
  const routes = useMemo(
    () => PLACES.map((p) => ({ id: p.id, lanes: [tracePath(p.pos, 0), tracePath(p.pos, 1)] })),
    []
  );
  const to3 = (pts) => pts.map(([x, z]) => [x, 0.175, z]);
  const dim = useMemo(() => new THREE.Color('#4a0b0b'), []);
  const warm = useMemo(() => new THREE.Color(1.4, 0.05, 0.04), []);
  return (
    <group>
      {routes.map((r) => r.lanes.map((pts, i) => (
        <Line
          key={`${r.id}${i}`}
          points={to3(pts)}
          color={active === r.id ? GLOW : hovered === r.id ? warm : dim}
          lineWidth={active === r.id ? 3 : 2}
          toneMapped={false}
        />
      )))}
      {routes.map((r) => r.lanes.map((pts, i) => (
        <Pulse key={`p${r.id}${i}`} pts={pts} offset={i * 0.5 + r.id.length * 0.13} hot={active === r.id} />
      )))}
    </group>
  );
}

/* ---------------- Selection brackets (CAD style) ---------------- */
export function Brackets({ size = 2.9, on }) {
  const ref = useRef();
  const t = useRef(0);
  const h = size / 2;
  const l = 0.45;
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  useFrame((_, dt) => {
    t.current += dt;
    const target = on ? 1 : 0;
    const k = ref.current.userData.k ?? 0;
    const next = k + (target - k) * damp(dt, 10);
    ref.current.userData.k = next;
    ref.current.visible = next > 0.02;
    ref.current.scale.setScalar(1.25 - next * 0.25 + Math.sin(t.current * 4) * 0.012 * next);
  });
  return (
    <group ref={ref} position-y={0.17} visible={false}>
      {corners.map(([sx, sz]) => (
        <Line
          key={`${sx}${sz}`}
          points={[[sx * h, 0, sz * (h - l)], [sx * h, 0, sz * h], [sx * (h - l), 0, sz * h]]}
          color={GLOW}
          lineWidth={2.5}
          toneMapped={false}
        />
      ))}
    </group>
  );
}

/* ---------------- Data packets arcing between nodes ---------------- */
const NODES = [[0, 0], ...PLACES.map((p) => p.pos)];

function Packet({ seed }) {
  const ref = useRef();
  const st = useRef(null);
  const rnd = useMemo(() => seeded(seed), [seed]);
  const pick = () => {
    const a = NODES[Math.floor(rnd() * NODES.length)];
    let b = a;
    while (b === a) b = NODES[Math.floor(rnd() * NODES.length)];
    const dist = Math.hypot(a[0] - b[0], a[1] - b[1]);
    return { a, b, t: -rnd() * 2.5, dur: 0.7 + dist * 0.12, h: 1.4 + dist * 0.22 };
  };
  useFrame((_, dt) => {
    if (!st.current) st.current = pick();
    const s = st.current;
    s.t += step(dt) / s.dur;
    if (s.t >= 1) st.current = pick();
    const k = Math.max(0, Math.min(1, s.t));
    const x = THREE.MathUtils.lerp(s.a[0], s.b[0], k);
    const z = THREE.MathUtils.lerp(s.a[1], s.b[1], k);
    const y = 0.5 + Math.sin(k * Math.PI) * s.h;
    ref.current.position.set(x, y, z);
    ref.current.visible = s.t > 0;
    ref.current.rotation.set(k * 6, k * 4, 0);
  });
  return (
    <Trail width={0.55} length={6} color={GLOW} attenuation={(w) => w * w} decay={1.4}>
      <mesh ref={ref}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshBasicMaterial color={GLOW} toneMapped={false} />
      </mesh>
    </Trail>
  );
}

export function Packets({ count = 5 }) {
  return Array.from({ length: count }, (_, i) => <Packet key={i} seed={101 + i * 17} />);
}

/* ---------------- Bit: the guide drone ---------------- */
const BOT_LINES = [
  'Have you tried turning it off and on again?',
  'I run on caffeine and React.',
  'Ctrl K is faster than me. Barely.',
  'git push --force? Not on my board.',
  '0 bugs found. (I did not look.)',
  'It works on my machine.',
  'Psst. Press 1 to 6 to travel.',
];

export function Bot({ active, onPoke }) {
  const M = useMaterials();
  const root = useRef();
  const body = useRef();
  const rotors = useRef([]);
  const eyes = useRef();
  const halo = useRef();
  const vel = useRef(new THREE.Vector3());
  const prev = useRef(new THREE.Vector3(3, 2.6, 2));
  const target = useMemo(() => new THREE.Vector3(), []);
  const t = useRef(0);
  const blink = useRef(0);

  useFrame((state, dt) => {
    const d = step(dt);
    t.current += d;
    const place = PLACES.find((p) => p.id === active);
    if (place) {
      target.set(place.pos[0] - 1.45, 2.5, place.pos[1] + 1.15);
    } else {
      const a = t.current * 0.22;
      target.set(Math.cos(a) * 3.4, 2.7, Math.sin(a) * 3.4 + 0.4);
    }
    target.y += Math.sin(t.current * 2.1) * 0.12;

    const r = root.current;
    prev.current.copy(r.position);
    r.position.lerp(target, damp(dt, place ? 2.2 : 1.4));
    vel.current.subVectors(r.position, prev.current).divideScalar(Math.max(dt, 1e-3));

    // Bank into the direction of travel, otherwise face the camera.
    const cam = state.camera.position;
    const yaw = Math.atan2(cam.x - r.position.x, cam.z - r.position.z);
    const turn = THREE.MathUtils.euclideanModulo(yaw - body.current.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
    body.current.rotation.y += turn * damp(dt, 4);
    body.current.rotation.z = THREE.MathUtils.clamp(-vel.current.x * 0.12, -0.5, 0.5);
    body.current.rotation.x = THREE.MathUtils.clamp(vel.current.z * 0.12, -0.5, 0.5);

    rotors.current.forEach((rt, i) => { if (rt) rt.rotation.y += dt * (28 + i); });

    blink.current -= dt;
    if (blink.current < -3.2) blink.current = 0.14;
    eyes.current.scale.y = blink.current > 0 ? 0.15 : 1;

    halo.current.position.set(r.position.x, 0.18, r.position.z);
    anchors.get('bot').set(r.position.x, r.position.y + 0.95, r.position.z);
    halo.current.material.opacity = 0.1;
  });

  const arms = [[1, 1], [-1, 1], [1, -1], [-1, -1]];

  return (
    <>
      <group ref={root} position={[3, 2.6, 2]} scale={1.3}>
        <group
          ref={body}
          onClick={(e) => { e.stopPropagation(); onPoke(BOT_LINES[Math.floor(Math.random() * BOT_LINES.length)]); }}
        >
          <mesh scale={[1, 0.82, 1]} castShadow>
            <sphereGeometry args={[0.34, 32, 24]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.25} metalness={0.6} />
          </mesh>
          {/* visor + eyes */}
          <RoundedBox args={[0.42, 0.17, 0.12]} radius={0.05} position={[0, 0.04, 0.28]} material={M.black} />
          <group ref={eyes} position={[0, 0.04, 0.345]}>
            <mesh position-x={-0.09}><boxGeometry args={[0.07, 0.07, 0.01]} /><meshBasicMaterial color={GLOW} toneMapped={false} /></mesh>
            <mesh position-x={0.09}><boxGeometry args={[0.07, 0.07, 0.01]} /><meshBasicMaterial color={GLOW} toneMapped={false} /></mesh>
          </group>
          {/* antenna */}
          <mesh position={[0, 0.38, 0]} material={M.darkSteel}><cylinderGeometry args={[0.012, 0.012, 0.22, 6]} /></mesh>
          <mesh position={[0, 0.5, 0]}><sphereGeometry args={[0.04, 12, 12]} /><meshBasicMaterial color={GLOW} toneMapped={false} /></mesh>
          {/* arms + rotors */}
          {arms.map(([sx, sz], i) => (
            <group key={i}>
              <mesh position={[sx * 0.33, 0.05, sz * 0.33]} rotation-y={Math.atan2(sx, sz)} material={M.darkSteel}>
                <boxGeometry args={[0.05, 0.04, 0.42]} />
              </mesh>
              <group position={[sx * 0.5, 0.1, sz * 0.5]}>
                <mesh material={M.darkSteel}><cylinderGeometry args={[0.05, 0.05, 0.08, 12]} /></mesh>
                <group ref={(el) => { rotors.current[i] = el; }} position-y={0.05}>
                  <mesh><boxGeometry args={[0.42, 0.008, 0.05]} /><meshStandardMaterial color="#888" transparent opacity={0.55} /></mesh>
                  <mesh rotation-y={Math.PI / 2}><boxGeometry args={[0.42, 0.008, 0.05]} /><meshStandardMaterial color="#888" transparent opacity={0.55} /></mesh>
                </group>
              </group>
            </group>
          ))}
        </group>
      </group>
      <mesh ref={halo} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.45, 32]} />
        <meshBasicMaterial color={SOFT} transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
    </>
  );
}
