import React, { useEffect, useRef } from 'react';
import { gsap } from '../ui';

const fine = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* CAD-style crosshair cursor with a live coordinate readout. */
export default function Crosshair() {
  const root = useRef(null);
  const label = useRef(null);

  useEffect(() => {
    const docEl = document.documentElement;
    const el = root.current;
    if (!fine()) {
      const move = (e) => {
        docEl.style.setProperty('--cx', `${e.clientX}px`);
        docEl.style.setProperty('--cy', `${e.clientY}px`);
      };
      window.addEventListener('pointermove', move);
      return () => window.removeEventListener('pointermove', move);
    }

    docEl.classList.add('has-crosshair');
    gsap.set(el, { xPercent: -50, yPercent: -50 });
    const xTo = gsap.quickTo(el, 'x', { duration: 0.18, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.18, ease: 'power3' });
    let shown = false;

    const move = (e) => {
      docEl.style.setProperty('--cx', `${e.clientX}px`);
      docEl.style.setProperty('--cy', `${e.clientY}px`);
      xTo(e.clientX);
      yTo(e.clientY);
      label.current.textContent = `${String(Math.round(e.clientX)).padStart(4, '0')} · ${String(Math.round(e.clientY)).padStart(4, '0')}`;
      if (!shown) { shown = true; el.classList.add('is-shown'); }
    };
    const over = (e) => {
      const hot = e.target.closest?.('a, button, summary, input, textarea, select, label, [role="option"], .tilt');
      const text = e.target.closest?.('input, textarea');
      el.classList.toggle('is-hot', !!hot && !text);
      el.classList.toggle('is-text', !!text);
    };
    const leave = () => { shown = false; el.classList.remove('is-shown'); };
    const down = () => el.classList.add('is-down');
    const up = () => el.classList.remove('is-down');

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerover', over);
    document.addEventListener('pointerleave', leave);
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    return () => {
      docEl.classList.remove('has-crosshair');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
      document.removeEventListener('pointerleave', leave);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  return (
    <div ref={root} className="crosshair" aria-hidden="true">
      <i className="crosshair__t" /><i className="crosshair__r" /><i className="crosshair__b" /><i className="crosshair__l" />
      <b />
      <span ref={label} className="crosshair__label" />
    </div>
  );
}
