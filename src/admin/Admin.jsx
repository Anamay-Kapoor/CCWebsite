import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { VERTICALS } from '../data/club';
import { SEED } from '../data/seed';
import { refreshContent } from '../content';
import './admin.css';

/*
 * Club admin. Everything here saves straight to the website's content file
 * (content/site.json in GitHub) through /api/content. No code changes needed.
 */

const VNAME = Object.fromEntries(VERTICALS.map((v) => [v.id, v.name]));
const VLABEL = { webdev: 'WebDev Vertical', 'ai-ml': 'AI / ML Vertical', gamedev: 'GameDev Vertical' };
const THIS_YEAR = new Date().getFullYear();
const BATCHES = Array.from({ length: 8 }, (_, i) => THIS_YEAR + 1 - i);

const TABS = {
  projects: {
    label: 'Projects', one: 'project', many: 'projects',
    help: 'Projects show on the Projects page, the home page and their vertical’s team page. Use ↑ ↓ to change the order; the first project is featured on the home page.',
    title: (p) => p.name,
    meta: (p) => [VNAME[p.vertical], p.tags.join(', ')].filter(Boolean).join(' · '),
    image: (p) => p.image,
  },
  members: {
    label: 'Team', one: 'member', many: 'members',
    help: 'Members appear on each vertical’s team page, grouped by batch. Leads are shown first with a larger card.',
    title: (m) => m.name,
    meta: (m) => [VNAME[m.vertical], `Batch ${m.batch}`, m.lead ? 'Lead' : '', m.role].filter(Boolean).join(' · '),
    image: (m) => m.photo,
    round: true,
  },
  events: {
    label: 'Events', one: 'event', many: 'events',
    help: 'Events sort themselves into Running, Upcoming and Past by date (India time). Past events stay in the archive.',
    title: (e) => e.name,
    meta: (e) => (e.endDate && e.endDate !== e.startDate ? `${e.startDate} → ${e.endDate}` : e.startDate),
    image: (e) => e.image,
  },
  bulletins: {
    label: 'Updates', one: 'update', many: 'updates',
    help: 'Updates are the announcements on the home page. The first one is shown as “New”.',
    title: (b) => b.title,
    meta: (b) => b.description.slice(0, 90) + (b.description.length > 90 ? '…' : ''),
    image: (b) => b.image,
  },
};

const blank = {
  projects: () => ({ name: '', vertical: 'webdev', tags: '', description: '', image: '', sourceUrl: '', liveUrl: '' }),
  members: () => ({ name: '', vertical: 'webdev', batch: String(THIS_YEAR), role: '', lead: false, photo: '' }),
  events: () => ({ name: '', startDate: '', endDate: '', description: '', image: '', link: '' }),
  bulletins: () => ({ title: '', description: '', image: '', links: [] }),
};

const toForm = (tab, item) => {
  if (tab === 'projects') return { ...item, tags: item.tags.join(', ') };
  if (tab === 'members') return { ...item, batch: String(item.batch), role: item.role || '', photo: item.photo || '' };
  if (tab === 'bulletins') return { ...item, links: item.links.map((l) => ({ ...l })) };
  return { ...item };
};

const slugify = (v) => v.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);

function fromForm(tab, form, existing, all) {
  const id = existing?.id || newId();
  const t = (v) => (v || '').trim();
  if (tab === 'projects') {
    let slug = existing?.slug || slugify(form.name) || `project-${Date.now()}`;
    if (!existing) {
      const taken = new Set(all.map((p) => p.slug));
      const base = slug;
      for (let n = 2; taken.has(slug); n += 1) slug = `${base}-${n}`;
    }
    return {
      id, slug, name: t(form.name), vertical: form.vertical, verticalLabel: VLABEL[form.vertical],
      tags: form.tags.split(',').map((x) => x.trim()).filter(Boolean),
      description: t(form.description), image: form.image, liveUrl: t(form.liveUrl), sourceUrl: t(form.sourceUrl),
    };
  }
  if (tab === 'members') {
    const out = {
      id, name: t(form.name), vertical: form.vertical, batch: Number(form.batch),
      role: t(form.role), lead: !!form.lead, photo: form.photo || '',
    };
    // Keep hand-tuned framing only while the photo is unchanged.
    if (existing?.focus && existing.photo === out.photo) out.focus = existing.focus;
    return out;
  }
  if (tab === 'events') {
    return {
      id, name: t(form.name), description: t(form.description), startDate: form.startDate,
      endDate: form.endDate || form.startDate, link: t(form.link), image: form.image,
    };
  }
  return {
    id, title: t(form.title), description: t(form.description), image: form.image,
    links: form.links.map((l) => ({ label: t(l.label), url: t(l.url) })).filter((l) => l.label && l.url),
  };
}

/* ---------------- API ---------------- */
async function call(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(path, {
      method,
      cache: 'no-store',
      credentials: 'same-origin', // the session is an HttpOnly cookie the page can't read
      headers: {
        ...(method !== 'GET' ? { 'X-Requested-With': 'cc-admin' } : {}),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error('Could not reach the server. Check your internet connection.');
  }
  if (!(res.headers.get('content-type') || '').includes('application/json')) {
    throw Object.assign(new Error('Couldn’t reach the admin server. If you’re running the site on your computer, restart it with “npm start”.'), { status: 0 });
  }
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status });
  return data;
}

/* Phone photos are often 4–10 MB: shrink to ≤1600 px JPEG before uploading (also strips GPS data). */
async function prepareImage(file) {
  if (!file.type.startsWith('image/')) throw new Error('That isn’t an image. Use a JPG, PNG or WebP.');
  if (file.type === 'image/gif') {
    if (file.size > 2 * 1024 * 1024) throw new Error('GIFs must be under 2 MB.');
    return file;
  }
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) throw new Error('Couldn’t read that image. Try saving it as JPG or PNG first.');
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.86));
  if (!blob || blob.size > 2 * 1024 * 1024) throw new Error('That image is too large even after resizing.');
  return blob;
}

const toBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(',')[1]);
  reader.onerror = () => reject(new Error('Could not read the image.'));
  reader.readAsDataURL(blob);
});

/* ---------------- Small pieces ---------------- */
function Field({ label, hint, required, wide, children }) {
  return (
    <label className={`af${wide ? ' af--wide' : ''}`}>
      <span className="af__label">{label}{required && <b aria-hidden="true"> *</b>}</span>
      {children}
      {hint && <span className="af__hint">{hint}</span>}
    </label>
  );
}

const initials = (s) => s.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';

function Thumb({ src, name, round }) {
  return (
    <span className={`athumb${round ? ' athumb--round' : ''}`}>
      {src ? <img src={src} alt="" loading="lazy" /> : <span>{initials(name || '')}</span>}
    </span>
  );
}

function ImageInput({ label, value, onChange, upload, round, hint }) {
  const [state, setState] = useState('');
  const [drag, setDrag] = useState(false);
  const pick = async (file) => {
    if (!file) return;
    setState('Uploading…');
    try {
      onChange(await upload(file));
      setState('');
    } catch (err) {
      setState(err.message);
    }
  };
  return (
    <div className="af af--wide">
      <span className="af__label">{label}</span>
      <div
        className={`adrop${drag ? ' is-drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
      >
        {value ? <span className={`adrop__preview${round ? ' is-round' : ''}`}><img src={value} alt="Current" /></span> : null}
        <div className="adrop__text">
          <b>{value ? 'Replace image' : 'Add an image'}</b>
          <span>Drag a photo here, or choose one. Big phone photos are resized automatically.</span>
          <span className="adrop__btns">
            <label className="abtn abtn--small">
              Choose file
              <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; pick(f); }} />
            </label>
            {value && <button type="button" className="abtn abtn--small abtn--ghost" onClick={() => onChange('')}>Remove</button>}
          </span>
          {state && <span className={`adrop__state${state === 'Uploading…' ? '' : ' is-err'}`} role="status">{state}</span>}
          {hint && <span className="af__hint">{hint}</span>}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Forms per section ---------------- */
function EditForm({ tab, form, set, upload }) {
  const v = (k) => form[k] ?? '';
  const on = (k) => (e) => set(k, e.target.type === 'checkbox' ? e.target.checked : e.target.value);
  const vertical = (
    <Field label="Vertical" required>
      <select value={v('vertical')} onChange={on('vertical')}>
        {VERTICALS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
      </select>
    </Field>
  );

  if (tab === 'projects') return (
    <>
      <Field label="Project name" required><input required value={v('name')} onChange={on('name')} placeholder="e.g. Timetable Generator" /></Field>
      {vertical}
      <Field label="Short description" required wide hint="One or two sentences: what it is and who uses it.">
        <textarea required rows={4} value={v('description')} onChange={on('description')} />
      </Field>
      <Field label="Tech used" wide hint="Separate with commas, e.g. React, Go, PostgreSQL"><input value={v('tags')} onChange={on('tags')} /></Field>
      <ImageInput label="Cover image" value={form.image} onChange={(x) => set('image', x)} upload={upload} hint="Best: a 16:9 screenshot." />
      <Field label="Live website link" hint="Optional. Leave empty if the project isn’t online right now."><input type="url" value={v('liveUrl')} onChange={on('liveUrl')} placeholder="https://…" /></Field>
      <Field label="Source code link" hint="Optional. Only public repos."><input type="url" value={v('sourceUrl')} onChange={on('sourceUrl')} placeholder="https://github.com/…" /></Field>
    </>
  );

  if (tab === 'members') return (
    <>
      <Field label="Full name" required><input required value={v('name')} onChange={on('name')} placeholder="e.g. Nidesh Ahilan" /></Field>
      {vertical}
      <Field label="Batch" required hint="The year they joined BITS.">
        <select value={v('batch')} onChange={on('batch')}>
          {BATCHES.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </Field>
      <Field label="Role" hint="Optional, e.g. “Web Development Lead”. Empty shows “Developer”."><input value={v('role')} onChange={on('role')} /></Field>
      <label className="acheck af--wide">
        <input type="checkbox" checked={!!form.lead} onChange={on('lead')} />
        <span><b>This person is a lead</b> — shown first, with a bigger card.</span>
      </label>
      <ImageInput label="Photo" round value={form.photo} onChange={(x) => set('photo', x)} upload={upload} hint="A portrait works best; the face should be near the top-middle." />
    </>
  );

  if (tab === 'events') return (
    <>
      <Field label="Event name" required wide><input required value={v('name')} onChange={on('name')} placeholder="e.g. WebDev Workshop" /></Field>
      <Field label="Start date" required><input type="date" required value={v('startDate')} onChange={on('startDate')} /></Field>
      <Field label="End date" hint="Leave empty for a one-day event."><input type="date" min={form.startDate || undefined} value={v('endDate')} onChange={on('endDate')} /></Field>
      <Field label="Description" required wide><textarea required rows={4} value={v('description')} onChange={on('description')} /></Field>
      <ImageInput label="Photo" value={form.image} onChange={(x) => set('image', x)} upload={upload} hint="A photo from the event, or a poster." />
      <Field label="Registration / event page link" wide hint="Optional."><input type="url" value={v('link')} onChange={on('link')} placeholder="https://…" /></Field>
    </>
  );

  return (
    <>
      <Field label="Title" required wide><input required value={v('title')} onChange={on('title')} placeholder="e.g. Recruitment Drive Open" /></Field>
      <Field label="Text" required wide><textarea required rows={4} value={v('description')} onChange={on('description')} /></Field>
      <ImageInput label="Image" value={form.image} onChange={(x) => set('image', x)} upload={upload} hint="Optional." />
      <div className="af af--wide">
        <span className="af__label">Buttons / links</span>
        {form.links.map((l, i) => (
          <div className="alink" key={i}>
            <input aria-label={`Link ${i + 1} text`} placeholder="Button text, e.g. How to join →" value={l.label}
              onChange={(e) => set('links', form.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            <input aria-label={`Link ${i + 1} address`} placeholder="https://… or /join" value={l.url}
              onChange={(e) => set('links', form.links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
            <button type="button" className="abtn abtn--small abtn--ghost" onClick={() => set('links', form.links.filter((_, j) => j !== i))}>Remove</button>
          </div>
        ))}
        {form.links.length < 10 && (
          <button type="button" className="abtn abtn--small abtn--ghost" onClick={() => set('links', [...form.links, { label: '', url: '' }])}>+ Add a link</button>
        )}
        <span className="af__hint">Links to pages on this site start with “/”, e.g. /join or /projects.</span>
      </div>
    </>
  );
}

/* ---------------- Main ---------------- */

function LoginForm({ onLogin, busy, again }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  return (
    <section className="acard asignin">
      <h1>{again ? 'Log in again' : 'Club admin'}</h1>
      <p>Add and edit projects, team members, events and updates. Changes go live on the website, no code needed.</p>
      <form className="alogin" onSubmit={(e) => { e.preventDefault(); onLogin(username, password); }}>
        <label className="af">
          <span className="af__label">Username</span>
          <input autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </label>
        <label className="af">
          <span className="af__label">Password</span>
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button type="submit" className="abtn" disabled={busy}>{busy ? 'Checking…' : 'Log in'}</button>
      </form>
    </section>
  );
}

function AdminPanel() {
  const [token, setToken] = useState(false); // true while logged in (session cookie is HttpOnly)
  const [email, setEmail] = useState('');
  const [checking, setChecking] = useState(true);
  const [data, setData] = useState(null);
  const [sha, setSha] = useState(null);
  const [missing, setMissing] = useState(false);
  const [tab, setTab] = useState('projects');
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [form, setForm] = useState(null);
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null); // { kind: 'ok'|'err'|'info', text, reload? }

  const say = (kind, text, extra) => setNotice({ kind, text, ...extra });

  async function load() {
    const content = await call('/api/content?fresh=1');
    const d = { ...content.data };
    // Older content has no team yet: start from the roster visitors currently see.
    if (!Array.isArray(d.members)) d.members = SEED.members;
    setData(d);
    setSha(content.sha);
    setMissing(!!content.missing);
  }

  async function logIn(username, password) {
    setBusy(true);
    try {
      const session = await call('/api/login', { method: 'POST', body: { username, password } });
      setToken(true);
      setEmail(session.username);
      if (!data) await load();
      setNotice(form ? { kind: 'info', text: 'Logged in again. Your unsaved changes are still in the form.' } : null);
    } catch (err) {
      say('err', err.message);
    } finally {
      setBusy(false);
    }
  }

  // Already logged in (cookie still valid)? Skip the login form.
  useEffect(() => {
    let alive = true;
    call('/api/me')
      .then(async (me) => {
        if (!alive) return;
        setToken(true);
        setEmail(me.username);
        await load();
      })
      .catch((err) => {
        if (alive && err.status !== 401) say('err', err.message);
      })
      .finally(() => alive && setChecking(false));
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logOut() {
    await call('/api/logout', { method: 'POST', body: {} }).catch(() => {});
    setToken(false); setEmail(''); setData(null); setForm(null);
    say('info', 'Logged out.');
  }

  async function reload() {
    setBusy(true);
    try { await load(); say('info', 'Loaded the latest content.'); } catch (err) { say('err', err.message); } finally { setBusy(false); }
  }

  async function save(next, okText) {
    setBusy(true);
    setNotice(null);
    try {
      const saved = await call('/api/content', { method: 'PUT', body: { sha, data: next } });
      setData(saved.data);
      setSha(saved.sha);
      setMissing(false);
      setEditing(null);
      setForm(null);
      refreshContent();
      say('ok', `${okText} It’s live on the website within a minute.`);
      return true;
    } catch (err) {
      if (err.status === 401) {
        setToken(false);
        say('err', 'Your session expired. Log in again below — nothing you typed is lost.');
      } else if (err.status === 409) {
        say('err', 'Someone else saved changes while you were editing. Load the latest version, then make your change again.', { reload: true });
      } else {
        say('err', err.message);
      }
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function upload(file) {
    if (!token) throw new Error('Log in again before uploading.');
    const blob = await prepareImage(file);
    const result = await call('/api/upload', { method: 'POST', body: { base64: await toBase64(blob) } });
    return result.image;
  }

  const list = data ? data[tab] : [];
  const cfg = TABS[tab];

  // Bundled items (shipped with the site's code) that aren't in the live content yet.
  const importable = useMemo(() => {
    if (!data) return {};
    const out = {};
    Object.keys(TABS).forEach((k) => {
      const have = new Set(data[k].map((x) => x.id));
      const haveSlug = new Set((k === 'projects' ? data[k] : []).map((x) => x.slug));
      out[k] = (SEED[k] || []).filter((x) => !have.has(x.id) && !(k === 'projects' && haveSlug.has(x.slug)));
    });
    return out;
  }, [data]);
  const importCount = Object.values(importable).reduce((n, l) => n + l.length, 0);

  function open(item) {
    setEditing(item ? item.id : 'new');
    setForm(item ? toForm(tab, item) : { ...blank[tab](), ...(tab === 'members' && filter !== 'all' ? { vertical: filter } : {}) });
    setNotice(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeForm() {
    setEditing(null);
    setForm(null);
    window.scrollTo({ top: 0 });
  }

  // Esc closes the open form.
  useEffect(() => {
    if (!form) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeForm(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [form]);

  function switchTab(k) {
    if (form && !window.confirm('Discard the changes in the open form?')) return;
    setTab(k); setEditing(null); setForm(null); setFilter('all'); setNotice(null);
  }

  async function submit(e) {
    e.preventDefault();
    const existing = editing === 'new' ? null : list.find((x) => x.id === editing);
    if (tab === 'events' && form.endDate && form.endDate < form.startDate) { say('err', 'The end date is before the start date.'); return; }
    const item = fromForm(tab, form, existing, list);
    const nextList = existing ? list.map((x) => (x.id === existing.id ? item : x)) : [...list, item];
    await save({ ...data, [tab]: nextList }, existing ? `Saved “${cfg.title(item)}”.` : `Added “${cfg.title(item)}”.`);
  }

  async function remove(item) {
    if (!window.confirm(`Delete “${cfg.title(item)}”? This removes it from the website.`)) return;
    await save({ ...data, [tab]: list.filter((x) => x.id !== item.id) }, `Deleted “${cfg.title(item)}”.`);
  }

  async function move(item, dir) {
    const i = list.indexOf(item);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    await save({ ...data, [tab]: next }, 'Order updated.');
  }

  async function importAll() {
    const next = { ...data };
    Object.keys(importable).forEach((k) => { next[k] = [...data[k], ...importable[k]]; });
    await save(next, `Imported ${importCount} item${importCount === 1 ? '' : 's'}.`);
  }

  const shown = tab === 'members' && filter !== 'all' ? list.filter((m) => m.vertical === filter) : list;

  return (
    <div className="admin">
      <header className="admin__bar">
        <Link to="/" className="admin__brand"><b>Coding Club</b> admin</Link>
        <span className="admin__spacer" />
        {email && token && <span className="admin__who">Logged in as <b>{email}</b></span>}
        <a href="/" target="_blank" rel="noreferrer" className="abtn abtn--small abtn--ghost">View website ↗</a>
        {token && <button type="button" className="abtn abtn--small abtn--ghost" onClick={logOut}>Log out</button>}
      </header>

      <main className="admin__main">
        {notice && (
          <div className={`anotice anotice--${notice.kind}`} role={notice.kind === 'err' ? 'alert' : 'status'}>
            <span>{notice.text}</span>
            {notice.reload && <button type="button" className="abtn abtn--small" onClick={reload} disabled={busy}>Load latest</button>}
            <button type="button" className="anotice__x" aria-label="Dismiss" onClick={() => setNotice(null)}>×</button>
          </div>
        )}

        {!token && !checking && <LoginForm onLogin={logIn} busy={busy} again={!!data} />}
        {checking && <p className="amuted" style={{ textAlign: 'center', marginTop: 80 }}>Checking your session…</p>}

        {data && (
          <>
            <nav className="atabs" aria-label="Sections">
              {Object.entries(TABS).map(([k, t]) => (
                <button key={k} type="button" className={k === tab ? 'is-on' : ''} aria-current={k === tab ? 'page' : undefined} onClick={() => switchTab(k)}>
                  {t.label} <span>{data[k].length}</span>
                </button>
              ))}
            </nav>

            {(missing || importCount > 0) && !form && (
              <div className="anotice anotice--info">
                <span>
                  {missing ? 'There’s no content saved online yet. ' : ''}
                  {importCount > 0 && <>The website’s code comes with <b>{importCount}</b> item{importCount === 1 ? '' : 's'} that aren’t in your live content
                  ({Object.entries(importable).filter(([, l]) => l.length).map(([k, l]) => `${l.length} ${l.length === 1 ? TABS[k].one : TABS[k].many}`).join(', ')}).</>}
                </span>
                {importCount > 0 && <button type="button" className="abtn abtn--small" disabled={busy || !token} onClick={importAll}>Import them</button>}
              </div>
            )}

            {form ? (
              <section className="acard">
                <button type="button" className="aback" onClick={closeForm}>← Back to {cfg.label}</button>
                <div className="acard__head">
                  <h2>{editing === 'new' ? `Add a ${cfg.one}` : `Edit ${cfg.one}`}</h2>
                </div>
                <form className="aform" onSubmit={submit}>
                  <EditForm tab={tab} form={form} set={(k, val) => setForm((f) => ({ ...f, [k]: val }))} upload={upload} />
                  <div className="aform__actions af--wide">
                    <button type="submit" className="abtn" disabled={busy || !token}>{busy ? 'Saving…' : editing === 'new' ? `Add ${cfg.one}` : 'Save changes'}</button>
                    <button type="button" className="abtn abtn--ghost" onClick={closeForm}>Cancel</button>
                    {!token && <span className="amuted">Log in again above to save.</span>}
                  </div>
                </form>
              </section>
            ) : (
              <section className="acard">
                <div className="acard__head">
                  <div>
                    <h2>{cfg.label}</h2>
                    <p className="amuted">{cfg.help}</p>
                  </div>
                  <button type="button" className="abtn" onClick={() => open(null)} disabled={busy || !token}>+ Add {cfg.one}</button>
                </div>

                {tab === 'members' && (
                  <div className="afilter" role="group" aria-label="Show vertical">
                    {[['all', 'All'], ...VERTICALS.map((x) => [x.id, x.name])].map(([k, n]) => (
                      <button key={k} type="button" className={filter === k ? 'is-on' : ''} onClick={() => setFilter(k)}>
                        {n} <span>{k === 'all' ? list.length : list.filter((m) => m.vertical === k).length}</span>
                      </button>
                    ))}
                  </div>
                )}

                {shown.length === 0 ? (
                  <p className="aempty">Nothing here yet. Use “+ Add {cfg.one}”.</p>
                ) : (
                  <ul className="alist">
                    {shown.map((item) => {
                      const i = list.indexOf(item);
                      return (
                        <li key={item.id} className="aitem">
                          <Thumb src={cfg.image(item)} name={cfg.title(item)} round={cfg.round} />
                          <div className="aitem__text">
                            <b>{cfg.title(item)}</b>
                            <span>{cfg.meta(item)}</span>
                          </div>
                          <div className="aitem__actions">
                            {tab !== 'members' && (
                              <>
                                <button type="button" className="abtn abtn--icon abtn--ghost" aria-label="Move up" disabled={busy || !token || i === 0} onClick={() => move(item, -1)}>↑</button>
                                <button type="button" className="abtn abtn--icon abtn--ghost" aria-label="Move down" disabled={busy || !token || i === list.length - 1} onClick={() => move(item, 1)}>↓</button>
                              </>
                            )}
                            <button type="button" className="abtn abtn--small abtn--ghost" disabled={busy || !token} onClick={() => open(item)}>Edit</button>
                            <button type="button" className="abtn abtn--small abtn--danger" disabled={busy || !token} onClick={() => remove(item)}>Delete</button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function Admin() {
  return <AdminPanel />;
}
