import { useEffect, useState } from 'react';
import { SEED } from './data/seed';

export function todayIST() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

const EMPTY = { projects: [], bulletins: [], events: [], members: [] };
const offline = () => ({ data: SEED, offline: true });

/* One request per page load, shared by every component that asks. */
let pending = null;
const listeners = new Set();

function loadContent() {
  if (!pending) {
    pending = fetch('/api/content', { cache: 'no-store' })
      .then(async (res) => {
        const type = res.headers.get('content-type') || '';
        // No API here (plain `npm start`), or it's down/misconfigured: show the bundled copy
        // instead of an empty site.
        if (!type.includes('application/json') || res.status >= 500) return offline();
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Could not load website content');
        if (body.missing) return offline();
        const data = { ...EMPTY, ...body.data };
        // Content saved before the team moved into the admin has no roster yet.
        if (!Array.isArray(body.data.members)) data.members = SEED.members;
        return { data, offline: false };
      })
      .catch((err) => {
        pending = null;
        if (err instanceof TypeError) return offline(); // network error
        throw err;
      });
  }
  return pending;
}

/* Called by the admin after a save so open pages show the new content. */
export function refreshContent() {
  pending = null;
  listeners.forEach((fn) => fn());
}

export function useContent() {
  const [state, setState] = useState({ content: EMPTY, loading: true, error: '', offline: false });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    listeners.add(bump);
    return () => listeners.delete(bump);
  }, []);

  useEffect(() => {
    let alive = true;
    loadContent()
      .then(({ data, offline: off }) => { if (alive) setState({ content: data, loading: false, error: '', offline: off }); })
      .catch((err) => { if (alive) setState((s) => ({ ...s, loading: false, error: err.message })); });
    return () => { alive = false; };
  }, [version]);

  return state;
}

export function externalLink(url) {
  return /^https?:\/\//i.test(url || '');
}
