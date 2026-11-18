import React, { Component, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PLACES, placeById, tracePath, BOARD } from './places';
import { blip } from './sound';
import { useHud } from '../hud/HudContext';
import { CLUB, TEAM_COUNT } from '../data/club';
import { ContactBlock } from '../sections';
import './world.css';

const Board = lazy(() => import('./Board'));

/* ---------------- helpers ---------------- */
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

export function useMedia(query) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

const isTyping = (el) => !!el?.closest?.('input, textarea, select, [contenteditable="true"]');

class BoardBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFail?.(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

/* ---------------- 2D schematic (no WebGL / reduced motion) ---------------- */
function Schematic({ active, onSelect }) {
  const hw = BOARD.w / 2;
  const hd = BOARD.d / 2;
  return (
    <svg className="world-schematic" viewBox={`${-hw} ${-hd} ${BOARD.w} ${BOARD.d}`} aria-hidden="true">
      <defs>
        <pattern id="sch-grid" width="0.5" height="0.5" patternUnits="userSpaceOnUse">
          <path d="M0.5 0H0V0.5" fill="none" stroke="#1a1a1a" strokeWidth="0.03" />
        </pattern>
      </defs>
      <rect x={-hw} y={-hd} width={BOARD.w} height={BOARD.d} rx="0.3" fill="url(#sch-grid)" stroke="#222" strokeWidth="0.05" />
      {PLACES.map((p) => [0, 1].map((lane) => (
        <polyline
          key={`${p.id}${lane}`}
          points={tracePath(p.pos, lane).map(([x, z]) => `${x},${z}`).join(' ')}
          fill="none"
          stroke={active === p.id ? 'var(--accent)' : '#4a0d0d'}
          strokeWidth="0.08"
        />
      )))}
      <rect x="-1.55" y="-1.55" width="3.1" height="3.1" rx="0.1" fill="#151515" stroke="#333" strokeWidth="0.05" />
      <text x="0" y="0.12" textAnchor="middle" className="world-schematic-core">U1 · CC.CORE</text>
      {PLACES.map((p) => (
        <g
          key={p.id}
          className={`world-schematic-node${active === p.id ? ' is-active' : ''}`}
          transform={`translate(${p.pos[0]} ${p.pos[1]})`}
          onClick={() => onSelect(p.id)}
        >
          <rect x="-1.15" y="-1.15" width="2.3" height="2.3" rx="0.1" />
          <text y="-0.15" textAnchor="middle" className="idx">{p.index} · {p.ref}</text>
          <text y="0.45" textAnchor="middle">{p.name}</text>
        </g>
      ))}
    </svg>
  );
}

/* ---------------- CAD rulers (left + bottom) ---------------- */
function Rulers() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const on = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const xs = Array.from({ length: Math.floor(size.w / 100) + 1 }, (_, i) => i * 100);
  const ys = Array.from({ length: Math.floor(size.h / 100) + 1 }, (_, i) => i * 100);
  return (
    <div className="rulers" aria-hidden="true">
      <div className="ruler ruler--x">
        {xs.map((x) => <span key={x} style={{ left: x }}>{x}</span>)}
        <i className="ruler__mark" />
      </div>
      <div className="ruler ruler--y">
        {ys.map((y) => <span key={y} style={{ top: y }}>{y}</span>)}
        <i className="ruler__mark" />
      </div>
      <i className="fiducial fiducial--tl" /><i className="fiducial fiducial--tr" /><i className="fiducial fiducial--br" />
    </div>
  );
}

/* ---------------- Highlights carousel ---------------- */
function Highlights({ items, onGo, paused }) {
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (paused || hold || items.length < 2) return undefined;
    const id = setTimeout(() => setI((n) => (n + 1) % items.length), 5600);
    return () => clearTimeout(id);
  }, [i, paused, hold, items.length]);
  const item = items[i % items.length];
  if (!item) return null;
  const place = placeById(item.place);
  return (
    <div className="highlights" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
      <button type="button" className="highlights__item" onClick={() => onGo(item.place)} key={i}>
        <span className="highlights__index">{String(i + 1).padStart(2, '0')}/{String(items.length).padStart(2, '0')}</span>
        <span className="highlights__fact">{item.fact}</span>
        <span className="highlights__place">{place.title} <span aria-hidden="true">→</span></span>
      </button>
      <div className="highlights__nav">
        <span className={`highlights__track${paused || hold ? ' is-paused' : ''}`} key={`t${i}`} aria-hidden="true"><span /></span>
        <button type="button" aria-label="Previous highlight" onClick={() => setI((n) => (n - 1 + items.length) % items.length)}>‹</button>
        <button type="button" aria-label="Next highlight" onClick={() => setI((n) => (n + 1) % items.length)}>›</button>
      </div>
    </div>
  );
}

/* ---------------- Bit's lines ---------------- */
function botLineFor(id, c) {
  const n = (k, word) => `${k} ${word}${k === 1 ? '' : 's'}`;
  switch (id) {
    case 'bulletin': return c.bulletins ? `${n(c.bulletins, 'post')} on the antenna. Newest first.` : 'Quiet on the airwaves. For now.';
    case 'events': return c.running ? `${c.running} running right now. Go go go.` : c.upcoming ? `${n(c.upcoming, 'event')} queued up.` : 'Nothing scheduled yet. Workshops are cooking.';
    case 'projects': return `${n(c.projects, 'project')} shipped from the Foundry.`;
    case 'stack': return 'Three verticals. Pick your voltage.';
    case 'join': return `Recruitment ${CLUB.session} is open. ${TEAM_COUNT} teams. This socket fits you.`;
    case 'contact': return 'Plug in. We reply faster than CI.';
    default: return '';
  }
}

/* ---------------- World hero ---------------- */
export default function WorldHero({ booted, onReady, renderPanel, counts, latestTitle }) {
  const { visited, markVisited, motionOn, paletteOpen } = useHud();
  const [params, setParams] = useSearchParams();
  const hero = useRef(null);
  const panelRef = useRef(null);
  const labelsRef = useRef(null);
  const closeBtn = useRef(null);
  const [active, setActive] = useState(null);
  const [shown, setShown] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [inView, setInView] = useState(true);
  const [botLine, setBotLine] = useState('');
  const [use3D, setUse3D] = useState(() => hasWebGL());
  const mobile = useMedia('(max-width: 760px)');
  const reducedOS = useMedia('(prefers-reduced-motion: reduce)');
  const flat = !use3D || (reducedOS && !motionOn);
  const activeRef = useRef(null);
  const hoveredRef = useRef(null);
  const botTimer = useRef(null);

  useEffect(() => { if (flat) onReady?.(); }, [flat, onReady]);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.02 });
    io.observe(hero.current);
    return () => io.disconnect();
  }, []);

  const say = useCallback((line, ms = 6500) => {
    clearTimeout(botTimer.current);
    setBotLine(line);
    if (line) botTimer.current = setTimeout(() => setBotLine(''), ms);
  }, []);
  useEffect(() => () => clearTimeout(botTimer.current), []);

  // Bit says hello once the intro is done.
  useEffect(() => {
    if (!booted) return undefined;
    const id = setTimeout(() => {
      if (!activeRef.current) say(`Hi, I'm Bit. ${mobile ? 'Tap' : 'Click'} a chip and I'll fly you there.`);
    }, 900);
    return () => clearTimeout(id);
  }, [booted, mobile, say]);

  const countsRef = useRef(counts);
  countsRef.current = counts;

  const open = useCallback((id) => {
    if (!placeById(id)) return;
    if (activeRef.current !== id) blip('open');
    activeRef.current = id;
    setActive(id);
    setShown(id);
    markVisited(id);
    say(botLineFor(id, countsRef.current));
    setParams((p) => { p.set('place', id); return p; }, { replace: true });
  }, [markVisited, say, setParams]);

  const close = useCallback(() => {
    if (!activeRef.current) return;
    blip('close');
    activeRef.current = null;
    setActive(null);
    say('');
    setParams((p) => { p.delete('place'); return p; }, { replace: true });
  }, [say, setParams]);

  // Deep links and palette jumps: /?place=join
  const wanted = params.get('place');
  useEffect(() => {
    if (!booted) return;
    if (wanted && wanted !== activeRef.current && placeById(wanted)) {
      if (window.scrollY > 40) hero.current?.scrollIntoView({ behavior: 'smooth' });
      open(wanted);
    } else if (!wanted && activeRef.current) {
      close();
    }
  }, [wanted, booted, open, close]);

  useEffect(() => {
    if (!active) return;
    requestAnimationFrame(() => closeBtn.current?.focus({ preventScroll: true }));
    panelRef.current?.querySelector('.world-panel-body')?.scrollTo(0, 0);
  }, [active]);

  // Keyboard: 1–6 travel, ←/→ step, Esc back.
  useEffect(() => {
    const onKey = (e) => {
      if (paletteOpen || isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (!booted || !inView || document.documentElement.classList.contains('menu-open')) return;
      const place = PLACES.find((p) => p.key === e.key);
      if (place) { e.preventDefault(); open(place.id); return; }
      if (e.key === 'Escape' && activeRef.current) { e.preventDefault(); close(); return; }
      if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && activeRef.current && !e.target.closest?.('[role="tablist"]')) {
        const i = PLACES.findIndex((p) => p.id === activeRef.current);
        const next = PLACES[(i + (e.key === 'ArrowRight' ? 1 : -1) + PLACES.length) % PLACES.length];
        open(next.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [booted, inView, paletteOpen, open, close]);

  const hoverTimer = useRef(null);
  const hover = useCallback((id, from) => {
    // An "out" from a chip we've already left (e.g. A's out arriving after B's over) is ignored.
    if (!id && from && hoveredRef.current !== from) return;
    clearTimeout(hoverTimer.current);
    const apply = () => {
      if (id === hoveredRef.current) return;
      if (id) blip('hover');
      hoveredRef.current = id;
      setHovered(id);
      if (!flat) document.body.style.cursor = id ? 'pointer' : '';
    };
    // Leaving waits a beat so brushing past an edge or a label doesn't flicker.
    if (id) apply(); else hoverTimer.current = setTimeout(apply, 90);
  }, [flat]);
  useEffect(() => () => clearTimeout(hoverTimer.current), []);
  useEffect(() => () => { document.body.style.cursor = ''; }, []);

  // Swipe the mobile sheet down to close it.
  const drag = useRef(null);
  const onSheetDown = (e) => {
    if (!mobile) return;
    drag.current = { y: e.clientY, dy: 0 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onSheetMove = (e) => {
    if (!drag.current) return;
    drag.current.dy = Math.max(0, e.clientY - drag.current.y);
    panelRef.current.style.transform = `translateY(${drag.current.dy}px)`;
    panelRef.current.style.transition = 'none';
  };
  const onSheetUp = () => {
    if (!drag.current) return;
    const { dy } = drag.current;
    drag.current = null;
    panelRef.current.style.transform = '';
    panelRef.current.style.transition = '';
    if (dy > 90) close();
  };

  const highlights = useMemo(() => [
    { fact: `Recruitment ${CLUB.session} is open: ${TEAM_COUNT} teams hiring`, place: 'join' },
    { fact: `${counts.projects} project${counts.projects === 1 ? '' : 's'} shipped, including the Timetable Generator`, place: 'projects' },
    { fact: 'Three verticals: WebDev, AI/ML and GameDev', place: 'stack' },
    { fact: 'Workshops, guest talks, hackathons and contests', place: 'events' },
    ...(latestTitle ? [{ fact: `Latest: ${latestTitle}`, place: 'bulletin' }] : []),
  ], [counts.projects, latestTitle]);

  const place = placeById(shown);
  const placeIndex = PLACES.findIndex((p) => p.id === shown);

  return (
    <section
      ref={hero}
      className={`world${active ? ' is-open' : ''}${flat ? ' is-flat' : ''}${booted ? ' is-booted' : ''}`}
      aria-label="Coding Club circuit board"
    >
      <div className="world-stage">
        {flat ? (
          <Schematic active={active} onSelect={open} />
        ) : (
          <BoardBoundary fallback={<Schematic active={active} onSelect={open} />} onFail={() => { setUse3D(false); onReady?.(); }}>
            <Suspense fallback={null}>
              <Board
                active={active}
                hovered={hovered}
                onSelect={open}
                onHover={hover}
                onHome={close}
                started={booted}
                mobile={mobile}
                running={inView && !paletteOpen}
                onReady={onReady}
                onPoke={(line) => say(line, 4500)}
                motionOn={motionOn}
                labels={labelsRef}
              />
            </Suspense>
          </BoardBoundary>
        )}
        {!flat && (
          <div className="world-labels" ref={labelsRef} aria-hidden="true">
            {PLACES.map((p) => (
              <div key={p.id} data-anchor={p.id} className="world-label">
                <div
                  className={`world-tag${active === p.id ? ' is-active' : ''}${hovered === p.id ? ' is-hover' : ''}`}
                  onClick={() => open(p.id)}
                  onMouseEnter={() => hover(p.id)}
                  onMouseLeave={() => hover(null, p.id)}
                >
                  <span>{p.index}</span>
                  <em>{p.name}</em>
                  <small>{p.ref}</small>
                </div>
              </div>
            ))}
            <div data-anchor="core" className="world-label"><div className="world-core">U1 · CC.CORE</div></div>
            <div data-anchor="bot" className="world-label world-label--bot">
              {botLine && (
                <div className="bot-say" role="status" key={botLine}>
                  <b>BIT</b>
                  <span>{botLine}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {!mobile && <Rulers />}

      <div className="world-ui">
        <div className="world-sheet" aria-hidden="true">
          <span>Schematic 01 · {CLUB.fullName}</span>
          <span>Layer F.Cu · Grid 0.5 mm · Rev {new Date().getFullYear()}</span>
          <span>Routed by members · Reviewed by everyone</span>
        </div>

        <div className="world-intro">
          <p className="world-start">
            <span className="world-start__new">New here?</span>
            <span className="world-start__mouse">Click any chip to step inside.</span>
            <span className="world-start__touch">Tap a chip, or pick a node below.</span>
          </p>
          <p className="world-kicker">Student club · {CLUB.campus} · {CLUB.place}</p>
          <h1 className="world-title">Coding <em>Club</em></h1>
          <p className="world-lede">
            {CLUB.tagline} We build tools for campus, compete, run workshops and ship things together.
          </p>
          <Highlights items={highlights} onGo={open} paused={!motionOn} />
          <ContactBlock />
        </div>

        <aside className="world-places" aria-label="Places on the board">
          <div className="world-places__head">
            <span>Places</span>
            <span className="world-places__count"><b>{visited.size}</b>/{PLACES.length} explored</span>
          </div>
          <span className="world-progress-bar" aria-hidden="true">
            {PLACES.map((p) => <i key={p.id} className={visited.has(p.id) ? 'on' : ''} />)}
          </span>
          <ol>
            {PLACES.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`world-place${active === p.id ? ' is-active' : ''}${visited.has(p.id) ? ' is-visited' : ''}`}
                  onClick={() => (active === p.id ? close() : open(p.id))}
                  onMouseEnter={() => hover(p.id)}
                  onMouseLeave={() => hover(null, p.id)}
                  aria-current={active === p.id ? 'true' : undefined}
                >
                  <span className="world-place__idx">{p.index}</span>
                  <span className="world-place__label">
                    <span>{p.title}</span>
                    <small>{p.sub}</small>
                  </span>
                  <span className="world-place__tag">{p.name}</span>
                </button>
              </li>
            ))}
          </ol>
          <p className="world-places__keys" aria-hidden="true"><kbd>1</kbd>–<kbd>6</kbd> to travel · <kbd>Esc</kbd> to come back</p>
        </aside>

        <a className="world-scroll" href="#bulletin" aria-label="Scroll to the page content">
          <i aria-hidden="true" /> Scroll for the page view
        </a>
      </div>

      <aside
        ref={panelRef}
        className="world-panel"
        aria-hidden={!active}
        inert={!active}
        aria-labelledby="world-panel-title"
        onTransitionEnd={(e) => { if (e.target === e.currentTarget && !active) setShown(null); }}
      >
        {place && (
          <>
            <header
              className="world-panel-head"
              onPointerDown={onSheetDown}
              onPointerMove={onSheetMove}
              onPointerUp={onSheetUp}
              onPointerCancel={onSheetUp}
            >
              <span className="world-panel-grab" aria-hidden="true" />
              <div>
                <p className="world-panel-kicker">{place.index} {'//'} {place.name} · {place.ref}</p>
                <h2 id="world-panel-title">{place.title}</h2>
                <p className="world-panel-blurb">{place.blurb}</p>
              </div>
              <button ref={closeBtn} type="button" className="world-close" onClick={close} aria-label="Back to the board">
                Esc
              </button>
            </header>
            <div className="world-panel-body">{renderPanel(place.id)}</div>
            <footer className="world-panel-foot">
              <button type="button" onClick={() => open(PLACES[(placeIndex - 1 + PLACES.length) % PLACES.length].id)}>
                ← {PLACES[(placeIndex - 1 + PLACES.length) % PLACES.length].name}
              </button>
              <span aria-hidden="true">{place.index} / {String(PLACES.length).padStart(2, '0')}</span>
              <button type="button" onClick={() => open(PLACES[(placeIndex + 1) % PLACES.length].id)}>
                {PLACES[(placeIndex + 1) % PLACES.length].name} →
              </button>
            </footer>
          </>
        )}
      </aside>
    </section>
  );
}
