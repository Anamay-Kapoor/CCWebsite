import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PLACES } from './places';

/*
 * World-space points that DOM labels follow. Static ones are set here;
 * moving ones (Bit) update their vector every frame.
 */
export const anchors = new Map([
  ...PLACES.map((p) => [p.id, new THREE.Vector3(p.pos[0], 3.6, p.pos[1])]),
  ['core', new THREE.Vector3(0, 0.3, 2.3)],
  ['bot', new THREE.Vector3(3, 3.4, 2)],
]);

const v = new THREE.Vector3();

/*
 * Projects every [data-anchor] element inside `container` onto the canvas.
 * Plain DOM labels instead of drei <Html>: no extra React roots, one pass per frame.
 */
export function Projector({ container }) {
  const { camera, size } = useThree();
  // Header height can change at breakpoints; re-read it when the canvas resizes.
  const topSafe = useMemo(
    () => (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hud-h')) || 64) + 18,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size.width, size.height]
  );
  useFrame(() => {
    const root = container?.current;
    if (!root) return;
    const els = root.children;
    const pad = 8;
    // Read every size first, then write, so the browser lays out once per frame.
    const items = [];
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      const a = anchors.get(el.dataset.anchor);
      if (!a) continue;
      const bot = el.dataset.anchor === 'bot';
      const w = bot ? (el.firstElementChild?.offsetWidth || 0) : el.offsetWidth;
      items.push({ el, a, bot, w });
    }
    for (const { el, a, bot, w } of items) {
      v.copy(a).project(camera);
      let x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      // Behind the camera, far off-screen, or under the fixed header: hide.
      const hidden = v.z > 1 || x < -size.width * 0.3 || x > size.width * 1.3 || y < topSafe || y > size.height + 40;
      el.style.visibility = hidden ? 'hidden' : 'visible';
      if (hidden) continue;
      // Clamp so labels near the edge stay fully readable.
      if (bot) {
        x = Math.min(Math.max(x, pad), size.width - w - pad - 44);
      } else {
        x = Math.min(Math.max(x, w / 2 + pad), size.width - w / 2 - pad);
      }
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      el.style.zIndex = String(Math.round((1 - v.z) * 1000));
    }
  });
  return null;
}
