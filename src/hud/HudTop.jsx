import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useHud } from './HudContext';
import { CLUB } from '../data/club';
import { LOGO_PATHS, LOGO_SIZE } from '../world/logo';

export function LogoMark({ className = '' }) {
  return (
    <svg className={className} viewBox={`0 0 ${LOGO_SIZE} ${LOGO_SIZE}`} aria-hidden="true">
      {LOGO_PATHS.map((d) => <path key={d.slice(0, 12)} d={d} fill="currentColor" fillRule="evenodd" />)}
    </svg>
  );
}

const GLYPHS = '!<>-_\\/[]{}=+*^?#01';

/* Name that scrambles on hover/focus. */
function ScrambleName({ text }) {
  const [shown, setShown] = useState(text);
  const raf = useRef(0);
  const run = () => {
    cancelAnimationFrame(raf.current);
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / 450);
      const n = Math.floor(p * text.length);
      setShown(text.split('').map((c, i) => (i < n || c === ' ' ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join(''));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return (
    <span className="hud-brand__name" onMouseEnter={run} onFocus={run}>
      <span aria-hidden="true">{shown}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

function SoundButton({ compact }) {
  const { soundOn, toggleSound } = useHud();
  return (
    <button
      type="button"
      className={`hud-chip hud-sound${soundOn ? ' is-on' : ''}`}
      onClick={toggleSound}
      aria-pressed={soundOn}
      aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}
    >
      <span className="hud-eq" aria-hidden="true"><i /><i /><i /><i /></span>
      {!compact && <span>Sound</span>}
    </button>
  );
}

function MotionButton({ compact }) {
  const { motionOn, toggleMotion } = useHud();
  return (
    <button
      type="button"
      className={`hud-chip hud-motion${motionOn ? '' : ' is-paused'}`}
      onClick={toggleMotion}
      aria-pressed={!motionOn}
      aria-label={motionOn ? 'Pause motion' : 'Resume motion'}
      title={motionOn ? 'Pause motion' : 'Resume motion'}
    >
      <span className="hud-motion__icon" aria-hidden="true" />
      {!compact && <span>{motionOn ? 'Motion' : 'Paused'}</span>}
    </button>
  );
}

function Hello() {
  const { copyEmail } = useHud();
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (!root.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div className="hello" ref={root}>
      <button type="button" className="hud-cta" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)}>
        Say hello
      </button>
      {open && (
        <div className="hello__menu" role="menu">
          <button type="button" role="menuitem" onClick={() => { copyEmail(); setOpen(false); }}>
            <span>Copy email</span><small>{CLUB.email}</small>
          </button>
          <a role="menuitem" href={`mailto:${CLUB.email}`} onClick={() => setOpen(false)}>
            <span>Write to us</span><small>opens your mail app ↗</small>
          </a>
          <a role="menuitem" href={CLUB.instagram.url} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
            <span>Instagram</span><small>{CLUB.instagram.handle} ↗</small>
          </a>
          <Link role="menuitem" to="/join" onClick={() => setOpen(false)}>
            <span>Join the club</span><small>recruitment {CLUB.session} →</small>
          </Link>
        </div>
      )}
    </div>
  );
}

const NAV = [
  { to: '/', label: 'Board', end: true },
  { to: '/projects', label: 'Projects' },
  { to: '/join', label: 'Join' },
];

export default function HudTop() {
  const { setPaletteOpen, copyEmail } = useHud();
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [pathname]);

  useEffect(() => { setMenu(false); }, [pathname]);
  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', menu);
    if (!menu) return undefined;
    const esc = (e) => { if (e.key === 'Escape') setMenu(false); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [menu]);

  return (
    <>
      <header className={`hud-top${scrolled ? ' is-scrolled' : ''}`}>
        <Link className="hud-brand" to="/" aria-label={`${CLUB.fullName}, home`}>
          <span className="hud-brand__mark"><LogoMark /></span>
          <ScrambleName text={CLUB.name} />
          <span className="hud-brand__sub" aria-hidden="true">BITS Pilani</span>
        </Link>

        <nav className="hud-nav" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `hud-link${isActive ? ' is-active' : ''}`}>
              {n.label}
            </NavLink>
          ))}
          <button type="button" className="hud-chip" onClick={() => setPaletteOpen(true)} aria-keyshortcuts="Control+K">
            Search <kbd aria-hidden="true">Ctrl K</kbd>
          </button>
          <MotionButton compact />
          <SoundButton compact />
          <Hello />
        </nav>

        <div className="hud-mobile">
          <button type="button" className="hud-chip hud-icon" onClick={() => setPaletteOpen(true)} aria-label="Search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" /></svg>
          </button>
          <button
            type="button"
            className={`hud-chip hud-icon hud-burger${menu ? ' is-open' : ''}`}
            onClick={() => setMenu((m) => !m)}
            aria-expanded={menu}
            aria-controls="hud-sheet"
            aria-label={menu ? 'Close menu' : 'Open menu'}
          >
            <i /><i />
          </button>
        </div>
      </header>

      <div id="hud-sheet" className={`hud-sheet${menu ? ' is-open' : ''}`} inert={!menu} aria-hidden={!menu}>
        <nav aria-label="Mobile">
          {NAV.map((n, i) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `hud-sheet__link${isActive ? ' is-active' : ''}`}>
              <span>{String(i + 1).padStart(2, '0')}</span>{n.label}
            </NavLink>
          ))}
        </nav>
        <div className="hud-sheet__row">
          <MotionButton />
          <SoundButton />
        </div>
        <div className="hud-sheet__contact">
          <p className="hud-label">Reach us</p>
          <button type="button" className="hud-sheet__mail" onClick={copyEmail}>{CLUB.email}<span>Copy</span></button>
          <div className="hud-sheet__links">
            <a href={`mailto:${CLUB.email}`}>Email ↗</a>
            <a href={CLUB.instagram.url} target="_blank" rel="noreferrer">Instagram ↗</a>
          </div>
        </div>
        <p className="hud-sheet__foot">{CLUB.motto.join(' ')}</p>
      </div>
    </>
  );
}
