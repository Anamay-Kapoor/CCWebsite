import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export { gsap, ScrollTrigger, useGSAP };

export const prefersReduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const canHover = () =>
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const GLYPHS = '!<>-_\\/[]{}=+*^?#01';

/* ---------- Fixed page background ---------- */
export function Background() {
  return (
    <div className="bg-layers" aria-hidden="true">
      <div className="bg-grid" />
      <div className="bg-floor" />
      <div className="bg-spot" />
      <div className="bg-grain" />
      <div className="bg-vignette" />
    </div>
  );
}

/* ---------- Magnetic pull on hover ---------- */
export function useMagnetic(strength = 0.3) {
  const ref = useRef(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el || !canHover() || prefersReduced()) return;

    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });

    const move = (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => { xTo(0); yTo(0); };

    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  });

  return ref;
}

/* ---------- 3D tilt with glare ---------- */
export function useTilt(max = 7) {
  const ref = useRef(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el || !canHover() || prefersReduced()) return;

    gsap.set(el, { transformPerspective: 900 });
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3' });

    const move = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * max * 2);
      rx((0.5 - py) * max * 2);
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
    };
    const leave = () => { rx(0); ry(0); };

    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  });

  return ref;
}

/* ---------- Scramble-in text ---------- */
export function Scramble({ text, as: Tag = 'h2', className }) {
  const el = useRef(null);

  useGSAP(() => {
    const node = el.current;
    if (prefersReduced()) return;

    const scramble = (revealed) =>
      text
        .split('')
        .map((ch, i) =>
          i < revealed || ch === ' ' ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        )
        .join('');

    node.textContent = scramble(0);
    const state = { p: 0 };

    gsap.to(state, {
      p: 1,
      duration: 1.1,
      ease: 'none',
      scrollTrigger: { trigger: node, start: 'top 88%', once: true },
      onUpdate: () => { node.textContent = scramble(Math.floor(state.p * text.length)); },
      onComplete: () => { node.textContent = text; },
    });
  }, { scope: el, dependencies: [text] });

  return (
    <Tag ref={el} className={className} aria-label={text}>
      {text}
    </Tag>
  );
}

export function SectionHead({ index, title }) {
  return (
    <div className="section-head">
      <span className="section-index">{index} {'//'}</span>
      <Scramble text={title} className="section-title" />
      <span className="section-line" aria-hidden="true" />
    </div>
  );
}
