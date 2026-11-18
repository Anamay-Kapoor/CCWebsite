import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Environment, Lightformer, Grid, RoundedBox, Sparkles, PerformanceMonitor, AdaptiveDpr,
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { PLACES, BOARD } from './places';
import { useBoardTexture } from './textures';
import { Cpu, PARTS, SOFT, useMaterials } from './parts';
import { Logo3D, Traces, Brackets, Packets, Bot } from './extras';
import { motion } from './motion';
import { stats } from '../hud/stats';
import { Projector } from './anchors';

const BG = '#0a0a0a';
const damp = (dt, speed) => 1 - Math.exp(-dt * speed);

/* ---------------- Camera ---------------- */
function Rig({ active, started, mobile }) {
  const { camera, scene } = useThree();
  const look = useRef(new THREE.Vector3(0, 0, 0));
  const pos = useMemo(() => new THREE.Vector3(), []);
  const lk = useMemo(() => new THREE.Vector3(), []);
  // Desktop framing: the hero text covers the left of the screen, so the board is drawn
  // centred in the free area to its right (shift, px) and pulled back to fit (zoom).
  const frame = useRef({ shift: 0, zoom: 1 });
  const freeLeft = useRef(0);

  useEffect(() => {
    camera.fov = mobile ? 50 : 38;
    camera.updateProjectionMatrix();
  }, [camera, mobile]);

  useEffect(() => {
    const el = document.querySelector('.world-intro');
    const measure = () => {
      const r = el?.getBoundingClientRect();
      freeLeft.current = r && r.width && getComputedStyle(el).display !== 'none' ? r.right + 12 : 0;
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (el) ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      camera.clearViewOffset();
    };
  }, [camera]);

  useFrame((state, dt) => {
    const t = motion.on ? state.clock.elapsedTime : 0; // no idle sway when motion is off
    const place = PLACES.find((p) => p.id === active);

    if (!started) {
      // Low, close and off to the side: the intro reveal sweeps up from here.
      if (mobile) { pos.set(9, 3.5, 6); lk.set(0, 0.6, 0); }
      else { pos.set(-9, 3.2, 9); lk.set(0, 0.8, 0); }
    } else if (place) {
      const [x, z] = place.pos;
      if (mobile) {
        // Bottom sheet covers the lower part of the screen: aim below the chip so it sits up top.
        lk.set(x + 3.9, 0, z);
        pos.set(x + 12.5, 11.5, z);
      } else {
        // Side panel covers the right: aim right of the chip so it sits in the open area.
        lk.set(x + 2.5, 0.5, z);
        pos.set(x + 2.5, 8, z + 9);
      }
    } else if (mobile) {
      // Distance that fits the board's short side (plus the edge chips) to the screen width.
      const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
      const dist = THREE.MathUtils.clamp(8.9 / (state.size.width / state.size.height * Math.tan(halfFov)), 30, 52);
      lk.set(-2.2, 0, 0.4);
      pos.set(-2.2 + dist * 0.536, dist * 0.844, 0.4 + Math.sin(t * 0.08) * 0.8);
    } else {
      // Pulled back so the right-hand chips clear the Places panel (bottom right).
      // Viewed slightly from the left, so the right-hand chips recede up and in.
      lk.set(-1.6, 0, 1.3);
      pos.set(-7.6 + Math.sin(t * 0.07) * 1.2, 23, 19.8);
    }

    // Fit the overview into the area right of the hero text.
    const W = state.size.width;
    const H = state.size.height;
    let shiftTarget = 0;
    let zoomTarget = 1;
    if (!mobile && started && !place && freeLeft.current > 0) {
      const free = Math.max(W - freeLeft.current, W * 0.45);
      shiftTarget = Math.min((W - free) / 2, W * 0.24);
      zoomTarget = THREE.MathUtils.clamp((0.74 * W) / (0.97 * free), 1, 1.42);
    }

    // Reduced motion: cut straight to the new view instead of flying there.
    const k = motion.on ? damp(dt, started ? 2.2 : 8) : 1;
    const f = frame.current;
    f.shift += (shiftTarget - f.shift) * k;
    f.zoom += (zoomTarget - f.zoom) * k;
    pos.sub(lk).multiplyScalar(f.zoom).add(lk);

    if (!mobile && motion.on) {
      pos.x += state.pointer.x * (place ? 0.35 : 1);
      pos.y += state.pointer.y * (place ? 0.2 : 0.6);
    }

    camera.position.lerp(pos, k);
    look.current.lerp(lk, k);
    camera.lookAt(look.current);
    // Fog follows the camera distance, so pulling back never darkens the board.
    if (scene.fog) {
      const d = camera.position.distanceTo(look.current);
      scene.fog.near = d * 0.75;
      scene.fog.far = d * 1.8;
    }
    if (f.shift > 0.5) camera.setViewOffset(W, H, -f.shift, 0, W, H);
    else if (camera.view?.enabled) camera.clearViewOffset();
  });

  return null;
}

/* ---------------- Board ---------------- */
function Pcb() {
  const M = useMaterials();
  const tex = useBoardTexture();
  const standoffs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  return (
    <group>
      <RoundedBox args={[BOARD.w, 0.16, BOARD.d]} radius={0.06} position-y={0.02} receiveShadow>
        <meshStandardMaterial color="#0c0c0c" roughness={0.7} />
      </RoundedBox>
      <mesh
        rotation-x={-Math.PI / 2}
        position-y={0.101}
        receiveShadow
        onPointerMove={(e) => { stats.x = (e.point.x + BOARD.w / 2) * 10; stats.y = (e.point.z + BOARD.d / 2) * 10; }}
        onPointerOut={() => { stats.x = null; stats.y = null; }}
      >
        <planeGeometry args={[BOARD.w - 0.08, BOARD.d - 0.08]} />
        <meshStandardMaterial map={tex} roughness={0.62} metalness={0.15} />
      </mesh>
      {standoffs.map(([sx, sz]) => (
        <mesh key={`${sx}${sz}`} position={[sx * (BOARD.w / 2 - 0.65), -0.3, sz * (BOARD.d / 2 - 0.65)]} material={M.gold}>
          <cylinderGeometry args={[0.22, 0.22, 0.5, 6]} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- One clickable part ---------------- */
function Node({ place, active, hovered, onSelect, onHover, shadows }) {
  const lift = useRef();
  const glow = useRef();
  const isActive = active === place.id;
  const isHover = hovered === place.id;
  const Part = PARTS[place.kind];

  useEffect(() => {
    lift.current.traverse((o) => { if (o.isMesh) { o.castShadow = shadows; o.receiveShadow = shadows; } });
  }, [shadows]);

  useFrame((_, dt) => {
    const y = isActive ? 0.28 : isHover ? 0.14 : 0;
    lift.current.position.y += (y - lift.current.position.y) * damp(dt, 8);
    const o = isActive ? 0.16 : isHover ? 0.09 : 0.02;
    glow.current.material.opacity += (o - glow.current.material.opacity) * damp(dt, 6);
  });

  return (
    <group position={[place.pos[0], 0.1, place.pos[1]]}>
      <mesh ref={glow} rotation-x={-Math.PI / 2} position-y={0.012}>
        <planeGeometry args={[2.7, 2.7]} />
        <meshBasicMaterial color={SOFT} transparent opacity={0.015} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <Brackets on={isActive || isHover} />
      <group ref={lift}>
        <Part hot={isActive || isHover} />
      </group>
      {/* Invisible hit volume: the whole footprint, from the board up past the tallest part. */}
      <mesh
        position-y={1.7}
        onClick={(e) => { e.stopPropagation(); onSelect(place.id); }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(place.id); }}
        onPointerMove={(e) => { e.stopPropagation(); onHover(place.id); }}
        onPointerOut={() => onHover(null, place.id)}
      >
        <boxGeometry args={[3, 3.6, 3]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function CpuNode({ onHome, shadows }) {
  const group = useRef();
  const light = useRef();
  useEffect(() => {
    group.current.traverse((o) => { if (o.isMesh) { o.castShadow = shadows; o.receiveShadow = shadows; } });
  }, [shadows]);
  useFrame((state) => {
    const t = motion.on ? state.clock.elapsedTime : 0;
    light.current.intensity = 7 + Math.sin(t * 1.6) * 2.5;
  });
  return (
    <group ref={group} position-y={0.1} onClick={(e) => { e.stopPropagation(); onHome(); }}>
      <Cpu />
      <Logo3D />
      <pointLight ref={light} position={[0, 1.4, 0]} color="#ff1a1a" intensity={7} distance={10} decay={1.6} />
    </group>
  );
}

/* ---------------- Frame stats + first-frame signal ---------------- */
function Stats({ onReady }) {
  const done = useRef(false);
  const acc = useRef({ t: 0, n: 0 });
  useFrame((_, dt) => {
    if (!done.current) { done.current = true; onReady?.(); }
    acc.current.t += dt;
    acc.current.n += 1;
    if (acc.current.t > 0.5) {
      stats.fps = Math.round(acc.current.n / acc.current.t);
      acc.current = { t: 0, n: 0 };
    }
  });
  return null;
}

/* ---------------- Scene ---------------- */
export default function Board({
  active, hovered, onSelect, onHover, onHome, started, mobile, running, onReady, onPoke, motionOn, labels, onContextLost,
}) {
  const [low, setLow] = useState(mobile);
  const shadows = !low;
  motion.on = motionOn;

  return (
    <Canvas
      className="world-canvas"
      frameloop={running ? 'always' : 'never'}
      dpr={low ? [1, 1.25] : [1, 1.75]}
      shadows={shadows ? 'soft' : false}
      camera={{ position: mobile ? [9, 3.5, 6] : [-9, 3.2, 9], fov: mobile ? 50 : 38, near: 0.1, far: 140 }}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      onPointerMissed={() => onHover(null)}
      onCreated={({ gl }) => {
        // Windows GPUs sometimes reset; show the 2D board instead of a black canvas.
        gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onContextLost?.(); }, { once: true });
      }}
    >
      <PerformanceMonitor onDecline={() => setLow(true)} flipflops={2} />
      <AdaptiveDpr pixelated={false} />
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 22, 52]} />

      <ambientLight intensity={0.25} />
      <directionalLight
        position={[7, 16, 9]}
        intensity={1.5}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <directionalLight position={[-9, 6, -8]} intensity={0.4} color="#ff9a9a" />

      {/* Reflections for the metal parts, generated locally (no HDR download). */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 6, 4]} rotation-x={-Math.PI / 2.5} scale={[12, 3, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[-6, 3, -4]} rotation-y={Math.PI / 3} scale={[6, 2, 1]} />
        <Lightformer form="ring" color="#ff2020" intensity={4} position={[6, 2, -6]} scale={3} />
        <Lightformer form="rect" color="#ff3030" intensity={1.5} position={[0, -3, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} />
      </Environment>

      <Grid
        position={[0, -0.55, 0]}
        args={[80, 80]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#161616"
        sectionSize={5}
        sectionThickness={0.8}
        sectionColor="#2a0808"
        fadeDistance={55}
        fadeStrength={1.4}
        infiniteGrid
      />

      <Pcb />
      <Traces active={active} hovered={hovered} />
      <CpuNode onHome={onHome} shadows={shadows} />
      {PLACES.map((p) => (
        <Node key={p.id} place={p} active={active} hovered={hovered} onSelect={onSelect} onHover={onHover} shadows={shadows} />
      ))}
      <Packets count={low ? 3 : 6} />
      <Bot active={active} onPoke={onPoke} />
      {motionOn && <Sparkles count={low ? 30 : 70} scale={[BOARD.w, 4, BOARD.d]} position-y={2} size={2.2} speed={0.25} opacity={0.5} color="#ff3a3a" />}

      <EffectComposer multisampling={low ? 0 : 4} disableNormalPass>
        <Bloom mipmapBlur intensity={low ? 0.7 : 1.05} luminanceThreshold={0.95} luminanceSmoothing={0.15} />
        <Vignette offset={0.28} darkness={0.75} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>

      <Rig active={active} started={started} mobile={mobile} />
      <Stats onReady={onReady} />
      <Projector container={labels} />
    </Canvas>
  );
}
