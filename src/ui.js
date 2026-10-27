import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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

/* ---------- Cursor ring + spotlight position ---------- */
export function Cursor() {
  const ring = useRef(null);

  useGSAP(() => {
    const docEl = document.documentElement;
    const fine = canHover();
    let xTo, yTo, shown = false;

    if (fine) {
      gsap.set(ring.current, { xPercent: -50, yPercent: -50 });
      xTo = gsap.quickTo(ring.current, 'x', { duration: 0.35, ease: 'power3' });
      yTo = gsap.quickTo(ring.current, 'y', { duration: 0.35, ease: 'power3' });
    }

    const move = (e) => {
      docEl.style.setProperty('--cx', `${e.clientX}px`);
      docEl.style.setProperty('--cy', `${e.clientY}px`);
      if (!fine) return;
      xTo(e.clientX);
      yTo(e.clientY);
      if (!shown) {
        shown = true;
        gsap.to(ring.current, { opacity: 1, duration: 0.3 });
      }
    };

    const over = (e) => {
      if (!fine) return;
      const hot = e.target.closest?.('a, button, summary, input, textarea, select, .tilt');
      gsap.to(ring.current, {
        scale: hot ? 1.8 : 1,
        borderColor: hot ? '#d4ff3a' : 'rgba(237, 237, 237, 0.6)',
        duration: 0.3,
        overwrite: 'auto',
      });
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerover', over);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
    };
  });

  return <div ref={ring} className="cursor-ring" aria-hidden="true" />;
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

/* ---------- Global menu (used on every page) ---------- */
export function SiteMenu() {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useGSAP(() => {
    if (!open || prefersReduced()) return;
    gsap.fromTo(
      '.sidebar-link',
      { x: -40, opacity: 0 },
      { x: 0, opacity: 1, stagger: 0.07, duration: 0.5, ease: 'power3.out', delay: 0.15 }
    );
  }, { scope: root, dependencies: [open] });

  const tab = open ? 0 : -1;

  // Same-page hash links don't trigger a route change, so scroll manually.
  const go = (id) => () => {
    setOpen(false);
    if (pathname === '/' && id) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div ref={root}>
      <button
        className="menu-toggle"
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span /><span /><span />
      </button>

      <button
        className={`sidebar-backdrop ${open ? 'visible' : ''}`}
        type="button"
        aria-label="Close menu"
        tabIndex={tab}
        onClick={() => setOpen(false)}
      />

      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`} aria-hidden={!open}>
        <p className="sidebar-label">{'//'} navigate</p>
        <Link className="sidebar-link" to="/#home" tabIndex={tab} onClick={go('home')}>
          <span>01</span>Home
        </Link>
        <Link className="sidebar-link" to="/projects" tabIndex={tab} onClick={() => setOpen(false)}>
          <span>02</span>Projects
        </Link>
        <Link className="sidebar-link" to="/#contact" tabIndex={tab} onClick={go('contact')}>
          <span>03</span>Contact
        </Link>
        <p className="sidebar-foot">coding club · bits pilani</p>
      </aside>
    </div>
  );
}