import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls, RoundedBox, Grid, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { PARTS, Cpu } from './parts';
import { Logo3D } from './extras';
import { motion } from './motion';
import { stats } from '../hud/stats';

/* A single part on a small PCB tile, slowly turning. Used in page headers. */
function Specimen({ kind }) {
  const Part = kind === 'cpu' ? Cpu : PARTS[kind];
  return (
    <group>
      <RoundedBox args={[3.4, 0.14, 3.4]} radius={0.06} position-y={-0.02} receiveShadow>
        <meshStandardMaterial color="#121313" roughness={0.75} />
      </RoundedBox>
      <Grid
        position={[0, 0.056, 0]}
        args={[3.3, 3.3]}
        cellSize={0.2}
        cellThickness={0.5}
        cellColor="#1c1c1c"
        sectionSize={1}
        sectionThickness={0.8}
        sectionColor="#3a0b0b"
        fadeDistance={30}
      />
      <group position-y={0.0}>
        <Part hot />
        {kind === 'cpu' && <Logo3D />}
      </group>
    </group>
  );
}

export default function PartViewer({ kind, running, motionOn, onReady }) {
  motion.on = motionOn;
  useEffect(() => { onReady?.(); }, [onReady]);
  useEffect(() => () => { stats.fps = 0; }, []);

  return (
    <Canvas
      className="viewport-canvas"
      frameloop={running ? 'always' : 'never'}
      dpr={[1, 1.75]}
      shadows="soft"
      camera={{ position: [4.2, 3.3, 4.4], fov: 32 }}
      gl={{ antialias: false, stencil: false }}
    >
      <color attach="background" args={['#0b0b0b']} />
      <fog attach="fog" args={['#0b0b0b', 11, 22]} />
      <ambientLight intensity={0.45} />
      {/* key, fill and a red rim so silhouettes read against the dark */}
      <directionalLight position={[4, 8, 5]} intensity={2.4} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02} />
      <directionalLight position={[-5, 3, 2]} intensity={0.7} color="#cfd8ff" />
      <directionalLight position={[-2, 3, -6]} intensity={1.1} color="#ff3020" />
      <pointLight position={[-2, 1.5, -2.5]} color="#ff2020" intensity={2.2} distance={5} />
      <Environment resolution={256} frames={1} environmentIntensity={1.25}>
        <Lightformer form="rect" intensity={3} position={[0, 6, 3]} rotation-x={-Math.PI / 2.4} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[5, 2, 2]} rotation-y={-Math.PI / 2.5} scale={[4, 3, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[-5, 2, 3]} rotation-y={Math.PI / 2.5} scale={[4, 3, 1]} />
        <Lightformer form="ring" color="#ff2020" intensity={1.6} position={[-4, 2, -4]} scale={2} />
      </Environment>
      <ContactShadows position={[0, -0.62, 0]} opacity={0.7} scale={8} blur={2.4} far={2} />

      <group position-y={-0.55}>
        <Specimen kind={kind} />
      </group>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={motionOn}
        autoRotateSpeed={0.8}
        minPolarAngle={0.5}
        maxPolarAngle={1.35}
        target={[0, 0.1, 0]}
        enableDamping
      />

      <EffectComposer multisampling={4} disableNormalPass>
        <Bloom mipmapBlur intensity={1} luminanceThreshold={0.95} luminanceSmoothing={0.15} />
        <Vignette offset={0.3} darkness={0.7} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  );
}
