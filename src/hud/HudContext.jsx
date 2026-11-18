import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { setSound, soundPreference, blip } from '../world/sound';
import { PLACES } from '../world/places';
import { CLUB } from '../data/club';

const Hud = createContext(null);
export const useHud = () => useContext(Hud);

const VISITED_KEY = 'cc-visited';
const MOTION_KEY = 'cc-motion-v2'; // v2: old key stored the OS default, not a choice

const read = (fn, fallback) => { try { return fn(); } catch { return fallback; } };

export function HudProvider({ children }) {
  const [soundOn, setSoundOn] = useState(false);
  // Motion is on unless the visitor turned it off with the pause button. (Windows reports
  // "reduce motion" whenever Animation effects is off, which left the whole site frozen.)
  const [motionOn, setMotionOn] = useState(() => {
    const on = read(() => localStorage.getItem(MOTION_KEY) !== 'off', true);
    document.documentElement.dataset.motion = on ? 'on' : 'off'; // before any animation reads it
    return on;
  });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [visited, setVisited] = useState(() => read(() => new Set(JSON.parse(sessionStorage.getItem(VISITED_KEY) || '[]')), new Set()));
  const [toast, setToast] = useState(null);
  const visitedRef = useRef(visited);
  const toastTimer = useRef(null);

  const notify = useCallback((text, ms = 3200) => {
    clearTimeout(toastTimer.current);
    setToast({ text, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), ms);
  }, []);

  // Restore sound on the first gesture (browsers block audio before one).
  useEffect(() => {
    if (!soundPreference()) return undefined;
    const arm = () => { setSound(true); setSoundOn(true); };
    window.addEventListener('pointerdown', arm, { once: true });
    return () => window.removeEventListener('pointerdown', arm);
  }, []);

  const toggleSound = useCallback(() => {
    const next = !soundOn;
    setSound(next);
    setSoundOn(next);
    if (next) setTimeout(() => blip('open'), 60);
  }, [soundOn]);

  useEffect(() => {
    document.documentElement.dataset.motion = motionOn ? 'on' : 'off';
  }, [motionOn]);

  const toggleMotion = useCallback(() => setMotionOn((m) => {
    read(() => localStorage.setItem(MOTION_KEY, m ? 'off' : 'on'));
    return !m;
  }), []);

  const markVisited = useCallback((id) => {
    const prev = visitedRef.current;
    if (prev.has(id)) return;
    const next = new Set(prev).add(id);
    visitedRef.current = next;
    setVisited(next);
    read(() => sessionStorage.setItem(VISITED_KEY, JSON.stringify([...next])));
    if (next.size === PLACES.length) {
      setTimeout(() => { notify('All 6 nodes online. You have seen the whole board.', 4500); blip('done'); }, 400);
    }
  }, [notify]);

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CLUB.email);
      notify(`Copied ${CLUB.email}`);
    } catch {
      notify(`Email: ${CLUB.email}`);
    }
  }, [notify]);

  // Ctrl/⌘ K anywhere on the site.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const value = useMemo(() => ({
    soundOn, toggleSound, motionOn, toggleMotion,
    paletteOpen, setPaletteOpen, visited, markVisited,
    toast, notify, copyEmail,
  }), [soundOn, toggleSound, motionOn, toggleMotion, paletteOpen, visited, markVisited, toast, notify, copyEmail]);

  return <Hud.Provider value={value}>{children}</Hud.Provider>;
}
