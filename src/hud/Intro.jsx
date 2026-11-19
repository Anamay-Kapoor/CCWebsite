import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { gsap, useGSAP } from '../ui';
import { CLUB } from '../data/club';

/*
 * The loader acts out the club motto. Each quarter of loading is one word, and each
 * word does what it says: BUILD stacks up, BREAK shatters, TRY TO FIX snaps back
 * together, REPEAT loops until the 3D board is ready. Then the screen opens in blinds.
 */

const WORDS = ['Build.', 'Break.', 'Try to fix.', 'Repeat.'];

// Real files from this repo, with their real sizes.
const FILES = [
  ['src/data/club.js', '7.7 kB'], ['src/content.js', '2.5 kB'], ['src/world/places.js', '4.2 kB'],
  ['src/world/textures.js', '11.4 kB'], ['src/world/parts.jsx', '23.7 kB'], ['src/world/extras.jsx', '10.7 kB'],
  ['src/world/ground.jsx', '6.4 kB'], ['src/world/Board.jsx', '11.9 kB'], ['src/world/WorldHero.jsx', '19.7 kB'],
  ['src/hud/HudTop.jsx', '7.5 kB'], ['src/hud/CommandPalette.jsx', '5.8 kB'], ['src/sections.jsx', '15.2 kB'],
  ['src/home/HomeSections.jsx', '10.4 kB'], ['src/pages/Vertical.jsx', '6.9 kB'], ['src/pages/Join.jsx', '3.3 kB'],
  ['src/admin/Admin.jsx', '28.2 kB'], ['src/App.jsx', '10.5 kB'],
];

const BLINDS = 8;

function Letters({ text }) {
  // words stay together; each letter is its own span so it can move
  return text.split(' ').map((w, wi, all) => (
    <span className="bl-w" key={wi}>
      {w.split('').map((c, ci) => (
        <span className={`bl-ch${c === '.' ? ' bl-dot' : ''}`} key={ci}>{c}</span>
      ))}
      {wi < all.length - 1 ? <span className="bl-sp"> </span> : null}
    </span>
  ));
}

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
    const words = q('.bl-word');
    const fileEls = q('.bl-file');
    const counter = { v: 0 };
    let stage = -1;
    let loop = null;
    const rand = gsap.utils.random;
    const em = () => parseFloat(getComputedStyle(q('.bl-stage')[0]).fontSize) || 160;

    const enter = (i) => {
      const prev = words[stage];
      if (prev) gsap.to(prev, { opacity: 0, yPercent: -18, duration: 0.22, ease: 'power2.in', overwrite: true });
      stage = i;
      q('.bl-stage-n')[0].textContent = `0${i + 1}`;
      const el = words[i];
      const ch = el.querySelectorAll('.bl-ch');
      gsap.set(el, { opacity: 1, yPercent: 0 });
      gsap.killTweensOf(ch);

      if (i === 0) {
        // BUILD: bricks stacking up
        gsap.fromTo(ch, { yPercent: 135, rotation: 0 }, { yPercent: 0, stagger: 0.045, duration: 0.6, ease: 'power4.out' });
      } else if (i === 1) {
        // BREAK: lands clean, then shatters and stays broken
        gsap.timeline()
          .fromTo(ch, { yPercent: 135 }, { yPercent: 0, stagger: 0.025, duration: 0.35, ease: 'power3.out' })
          .add(() => el.classList.add('is-glitch'))
          .to(ch, { x: () => rand(-0.12, 0.12) * em(), y: () => rand(-0.14, 0.14) * em(), rotation: () => rand(-16, 16), duration: 0.06, repeat: 5, yoyo: true, ease: 'none' })
          // stays broken: letters knocked crooked, the back half slumps
          .to(ch, {
            x: (k) => (k > 2 ? 0.03 * em() : rand(-0.02, 0.02) * em()),
            y: (k) => (k > 2 ? (0.05 + k * 0.025) * em() : rand(-0.03, 0.03) * em()),
            rotation: (k) => (k > 2 ? rand(6, 16) : rand(-8, 4)),
            duration: 0.35, ease: 'bounce.out',
          })
          .add(() => el.classList.remove('is-glitch'), '+=0.15');
      } else if (i === 2) {
        // TRY TO FIX: scattered pieces snap back into line
        gsap.fromTo(ch,
          { x: () => rand(-90, 90), y: () => rand(-70, 70), rotation: () => rand(-50, 50), opacity: 0 },
          { x: 0, y: 0, rotation: 0, opacity: 1, stagger: { each: 0.035, from: 'random' }, duration: 1, ease: 'elastic.out(1, 0.5)' });
      } else {
        // REPEAT: rolls over and over until the board is ready
        gsap.fromTo(ch, { yPercent: 135 }, { yPercent: 0, stagger: 0.035, duration: 0.5, ease: 'power3.out' });
        loop = gsap.timeline({ repeat: -1, delay: 0.7, repeatDelay: 0.35 })
          .to(ch, { yPercent: -115, stagger: 0.03, duration: 0.32, ease: 'power2.in' })
          .set(ch, { yPercent: 135 })
          .to(ch, { yPercent: 0, stagger: 0.03, duration: 0.4, ease: 'power3.out' });
      }
    };

    const paint = () => {
      const v = Math.round(counter.v);
      q('.bl-pct-n')[0].textContent = String(v).padStart(2, '0');
      root.current.style.setProperty('--p', `${v}%`);
      const s = v < 25 ? 0 : v < 50 ? 1 : v < 75 ? 2 : 3;
      if (s !== stage) enter(s);
      const shown = Math.min(FILES.length, Math.round((v / 92) * FILES.length));
      fileEls.forEach((el, i) => el.classList.toggle('on', i < shown));
      q('.bl-files')[0].style.setProperty('--shift', `${Math.max(0, shown - 5)}`);
    };
    let poll;

    const tl = gsap.timeline({ onComplete: () => { finished.current = true; onDone(); } });
    tlRef.current = tl;

    if (reduced) {
      tl.to(counter, { v: 100, duration: 0.4, onUpdate: paint })
        .to(root.current, { autoAlpha: 0, duration: 0.3 });
      return () => {};
    }

    tl.from(q('.bl-top > *, .bl-foot > *'), { opacity: 0, y: 10, stagger: 0.05, duration: 0.5, ease: 'power2.out' }, 0)
      .to(counter, { v: 88, duration: 3.1, ease: 'none', onUpdate: paint }, 0.15)
      .add(() => {
        const ready = () => isReady() && document.readyState === 'complete';
        if (ready()) return;
        tl.pause();
        const start = Date.now();
        poll = setInterval(() => {
          if (ready() || Date.now() - start > 8000) { clearInterval(poll); tl.play(); }
        }, 100);
      })
      .to(counter, { v: 100, duration: 0.5, ease: 'power2.in', onUpdate: paint })
      .add(() => {
        loop?.kill();
        gsap.to(words[3].querySelectorAll('.bl-ch'), { yPercent: 0, duration: 0.35, ease: 'power3.out', overwrite: true });
      })
      // everything but the blinds leaves, then the blinds open from the centre out
      .to(q('.bl-content'), { opacity: 0, duration: 0.3, ease: 'power2.in' }, '+=0.25')
      .to(q('.bl-blind'), {
        scaleY: 0, duration: 0.7, ease: 'expo.inOut',
        stagger: { each: 0.05, from: 'center' },
      }, '-=0.05');

    const onKey = (e) => { if (e.key === 'Escape') finish(); };
    window.addEventListener('keydown', onKey);
    return () => { clearInterval(poll); loop?.kill(); window.removeEventListener('keydown', onKey); };
  }, { scope: root });

  return createPortal(
    <div className="bl" ref={root} role="status" aria-label="Loading the board">
      <div className="bl-blinds" aria-hidden="true">
        {Array.from({ length: BLINDS }, (_, i) => (
          <i key={i} className="bl-blind" style={{ top: `${(i * 100) / BLINDS}%`, transformOrigin: i < BLINDS / 2 ? 'top' : 'bottom' }} />
        ))}
      </div>

      <div className="bl-content">
        <div className="bl-top">
          <span className="bl-brand">{CLUB.name}<em>{CLUB.campus}</em></span>
          <span className="bl-label">Loading the board</span>
        </div>
        <div className="bl-rule" aria-hidden="true"><i /></div>

        <div className="bl-stage" aria-hidden="true">
          {WORDS.map((w) => (
            <div className="bl-word" key={w} data-text={w}><Letters text={w} /></div>
          ))}
        </div>

        <div className="bl-foot">
          <div className="bl-meta">
            <p className="bl-stage-i"><span className="bl-stage-n">01</span> / 04 <b>the only loop we run</b></p>
            <ol className="bl-files" aria-hidden="true">
              {FILES.map(([f, kb]) => (
                <li className="bl-file" key={f}><span>✓</span>{f}<i>{kb}</i></li>
              ))}
            </ol>
          </div>
          <div className="bl-pct" aria-hidden="true"><span className="bl-pct-n">00</span><sup>%</sup></div>
        </div>

        <button type="button" className="bl-skip" onClick={finish}>Skip <span>esc</span></button>
      </div>
    </div>,
    document.body
  );
}
