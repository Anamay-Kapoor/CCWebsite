import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { gsap, useGSAP } from '../ui';
import { CLUB } from '../data/club';

const LOG = [
  ['init coding_club.sys', ''],
  ['routing traces', 'OK'],
  ['soldering chips', 'OK'],
  ['waking up bit', 'OK'],
  ['powering the board', ''],
];

function Art() {
  return (
    <div className="intro-art">
      <div className="intro-grid" />
      <div className="intro-meta">
        <span>{CLUB.fullName.toUpperCase()}</span>
        <span>{CLUB.place.toUpperCase()} — {new Date().getFullYear()}</span>
      </div>
      <div className="intro-rule">
        <p className="intro-line">
          <span className="intro-word">Build.</span> <span className="intro-word">Break.</span>
        </p>
        <p className="intro-line">
          <span className="intro-word">Try</span> <span className="intro-word">to</span> <span className="intro-word">fix.</span>{' '}
          <span className="intro-word is-accent">Repeat.</span>
        </p>
        <p className="intro-sig">— {CLUB.mottoSig}</p>
      </div>
      <div className="intro-log">
        {LOG.map(([cmd, ok]) => (
          <p key={cmd} className="intro-log__line"><span>$</span> {cmd} {ok && <><i>{'.'.repeat(Math.max(2, 22 - cmd.length))}</i> <b>{ok}</b></>}</p>
        ))}
      </div>
    </div>
  );
}

/*
 * Plays once per page load. Counts to ~88% on its own, holds until the board
 * has drawn its first frame (or 8 s pass), then splits open to reveal it.
 */
export default function Intro({ isReady, onDone }) {
  const root = useRef(null);
  const tlRef = useRef(null);
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    tlRef.current?.kill();
    gsap.to(root.current, { autoAlpha: 0, duration: 0.25, onComplete: onDone });
  };

  useGSAP(() => {
    const reduced = document.documentElement.dataset.motion === 'off';
    const q = gsap.utils.selector(root);
    const counter = { v: 0 };
    const lines = q('.intro-half--top .intro-log__line').length;
    const paint = () => {
      const v = Math.round(counter.v);
      q('.intro-pct').forEach((el) => { el.textContent = `${String(v).padStart(2, '0')}%`; });
      gsap.set(q('.intro-load i'), { scaleX: v / 100 });
      const shown = Math.ceil((v / 100) * lines);
      q('.intro-half').forEach((half) => {
        half.querySelectorAll('.intro-log__line').forEach((el, i) => el.classList.toggle('is-on', i < shown));
      });
    };
    let poll;

    const tl = gsap.timeline({ onComplete: () => { finished.current = true; onDone(); } });
    tlRef.current = tl;

    if (reduced) {
      tl.to(counter, { v: 100, duration: 0.4, onUpdate: paint })
        .to(root.current, { autoAlpha: 0, duration: 0.3 });
      return () => {};
    }

    tl.from(q('.intro-meta span'), { opacity: 0, y: 8, stagger: (i) => (i % 2) * 0.08, duration: 0.5, ease: 'power2.out' }, 0.1)
      .from(q('.intro-word'), { yPercent: 110, opacity: 0, rotate: 4, stagger: (i, el, all) => (i % (all.length / 2)) * 0.09, duration: 0.8, ease: 'expo.out' }, 0.25)
      .from(q('.intro-sig'), { opacity: 0, x: -10, duration: 0.6 }, 0.95)
      .to(counter, { v: 88, duration: 1.7, ease: 'power2.out', onUpdate: paint }, 0.2)
      .add(() => {
        const ready = () => isReady() && document.readyState === 'complete';
        if (ready()) return;
        tl.pause();
        const start = Date.now();
        poll = setInterval(() => {
          if (ready() || Date.now() - start > 8000) { clearInterval(poll); tl.play(); }
        }, 100);
      })
      .to(counter, { v: 100, duration: 0.4, ease: 'power1.in', onUpdate: paint })
      .to(q('.intro-bar, .intro-skip'), { opacity: 0, duration: 0.25 }, '+=0.1')
      .fromTo(q('.intro-flash'), { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.45, ease: 'expo.inOut' }, '<')
      .to(q('.intro-half--top'), { yPercent: -100, duration: 1.05, ease: 'expo.inOut' }, '>-0.05')
      .to(q('.intro-half--bottom'), { yPercent: 100, duration: 1.05, ease: 'expo.inOut' }, '<')
      .to(q('.intro-flash'), { opacity: 0, scaleY: 6, duration: 0.6, ease: 'power2.out' }, '<0.1');

    const onKey = (e) => { if (e.key === 'Escape') finish(); };
    window.addEventListener('keydown', onKey);
    return () => { clearInterval(poll); window.removeEventListener('keydown', onKey); };
  }, { scope: root });

  return createPortal(
    <div className="intro" ref={root} role="status" aria-label="Loading the board">
      <div className="intro-half intro-half--top"><Art /></div>
      <div className="intro-half intro-half--bottom"><Art /></div>
      <div className="intro-flash" />
      <div className="intro-bar">
        <span className="intro-load" role="progressbar" aria-label="Loading"><i /></span>
        <span className="intro-pct" aria-hidden="true">00%</span>
      </div>
      <button type="button" className="intro-skip" onClick={finish}>Skip <span>esc</span></button>
    </div>,
    document.body
  );
}
