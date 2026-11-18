import { useEffect, useState } from 'react';
import { SEED } from './data/seed';

export function todayIST() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

/* One request per page load, shared by every component that asks. */
let pending = null;
function loadContent() {
  if (!pending) {
    pending = fetch('/api/content', { cache: 'no-store' })
      .then(async (res) => {
        const type = res.headers.get('content-type') || '';
        if (!type.includes('application/json')) throw Object.assign(new Error('Content API unavailable'), { offline: true });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Could not load website content');
        return { data: body.data, offline: false };
      })
      .catch((err) => {
        pending = null; // allow a retry on the next mount
        // No API (e.g. plain `npm start`) or it is down: show the bundled copy.
        if (err.offline || err instanceof TypeError) return { data: SEED, offline: true };
        throw err;
      });
  }
  return pending;
}

export function useContent() {
  const [state, setState] = useState({
    content: { projects: [], bulletins: [], events: [] }, loading: true, error: '', offline: false,
  });

  useEffect(() => {
    let alive = true;
    loadContent()
      .then(({ data, offline }) => { if (alive) setState({ content: data, loading: false, error: '', offline }); })
      .catch((err) => { if (alive) setState((s) => ({ ...s, loading: false, error: err.message })); });
    return () => { alive = false; };
  }, []);

  return state;
}

export function externalLink(url) {
  return /^https?:\/\//i.test(url || '');
}
