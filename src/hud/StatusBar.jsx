import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useHud } from './HudContext';
import { useContent } from '../content';
import { stats } from './stats';
import { PLACES } from '../world/places';

const pad = (n, w = 3) => (n == null ? '---.-' : n.toFixed(1).padStart(w + 2, '0'));

/* IDE-style status bar along the bottom edge (desktop only). */
export default function StatusBar() {
  const { pathname } = useLocation();
  const { visited, soundOn, motionOn } = useHud();
  const { offline, loading } = useContent();
  const [, force] = useState(0);
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 250);
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScroll(max > 0 ? Math.round((window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { clearInterval(id); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, [pathname]);

  const time = new Date().toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Kolkata' });
  const home = pathname === '/';
  const state = loading ? 'SYNCING' : offline ? 'OFFLINE COPY' : 'LIVE';

  return (
    <footer className="statusbar" aria-hidden="true">
      <div className="statusbar__group">
        <span className={`statusbar__state is-${offline ? 'offline' : loading ? 'sync' : 'live'}`}><i />{state}</span>
        <span className="statusbar__branch">
          <svg viewBox="0 0 16 16"><path d="M5 3v7m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm6-7a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm0 4c0 3-6 2-6 6" /></svg>
          main
        </span>
        <span>~{pathname === '/' ? '/board' : pathname}</span>
      </div>
      <div className="statusbar__group">
        {home && <span>X {pad(stats.x)} Y {pad(stats.y)} mm</span>}
        <span>Nodes {visited.size}/{PLACES.length}</span>
        {home && <span>{stats.fps || '--'} fps</span>}
        <span>Scroll {String(scroll).padStart(2, '0')}%</span>
        <span>{motionOn ? 'Motion on' : 'Motion paused'}</span>
        <span>{soundOn ? 'Sound on' : 'Muted'}</span>
        <span>UTF-8</span>
        <span className="statusbar__time">{time} IST</span>
      </div>
    </footer>
  );
}
