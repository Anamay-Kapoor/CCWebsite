import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

const SECTIONS = {
  projects: 'Projects',
  bulletins: 'Bulletin',
  events: 'Events',
};

const VERTICALS = {
  webdev: 'WebDev Vertical',
  'ai-ml': 'AI / ML Vertical',
  gamedev: 'GameDev Vertical',
};

const empty = {
  projects: () => ({ name: '', slug: '', vertical: 'webdev', tags: '', description: '', image: '', liveUrl: '', sourceUrl: '' }),
  bulletins: () => ({ title: '', description: '', image: '', links: [{ label: '', url: '' }] }),
  events: () => ({ name: '', description: '', startDate: '', endDate: '', link: '', image: '' }),
};

function slugify(value) {
  return value.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function api(path, method = 'GET', token = '', value) {
  const response = await fetch(path, {
    method,
    cache: 'no-store',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(value !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(value !== undefined ? { body: JSON.stringify(value) } : {}),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
  return result;
}

function FormField({ label, value, onChange, type = 'text', required = false, options, rows = 4 }) {
  const id = `admin-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <div className="contact-field">
      <label htmlFor={id}>{label}</label>
      {type === 'textarea' ? (
        <textarea id={id} required={required} rows={rows} value={value || ''} onChange={(e) => onChange(e.target.value)} />
      ) : options ? (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {Object.entries(options).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
        </select>
      ) : (
        <input id={id} type={type} required={required} value={value || ''} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function AdminPanel() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [data, setData] = useState(null);
  const [sha, setSha] = useState('');
  const [section, setSection] = useState('projects');
  const [form, setForm] = useState(empty.projects());
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function signIn(response) {
    const credential = response.credential;
    if (!credential) { setNotice('Google did not provide an ID token.'); return; }
    setBusy(true);
    setNotice('');
    try {
      const me = await api('/api/me', 'GET', credential);
      const content = await api('/api/content');
      setToken(credential);
      setEmail(me.email);
      setData(content.data);
      setSha(content.sha);
    } catch (err) {
      setNotice(err.message);
      setToken('');
      setEmail('');
      setData(null);
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    setToken('');
    setEmail('');
    setData(null);
    setNotice('Signed out.');
  }

  function changeSection(name) {
    setSection(name);
    setForm(empty[name]());
    setEditing(null);
    setNotice('');
  }

  function startEdit(item) {
    setEditing(item.id);
    setForm({ ...item, ...(section === 'projects' ? { tags: item.tags.join(', ') } : {}) });
    setNotice('');
  }

  function update(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function save(next, successText) {
    setBusy(true);
    setNotice('');
    try {
      const saved = await api('/api/content', 'PUT', token, { sha, data: next });
      setData(saved.data);
      setSha(saved.sha);
      setForm(empty[section]());
      setEditing(null);
      setNotice(successText);
      return true;
    } catch (err) {
      setNotice(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    const id = editing || crypto.randomUUID();
    let item = { ...form, id };
    if (section === 'projects') {
      item.slug = slugify(item.slug || item.name);
      item.tags = item.tags.split(',').map((t) => t.trim()).filter(Boolean);
      item.verticalLabel = VERTICALS[item.vertical];
      if (!item.slug) { setNotice('Enter a valid project name or slug.'); return; }
      if (data.projects.some((p) => p.slug === item.slug && p.id !== id)) {
        setNotice('This project URL slug is already used.'); return;
      }
    }
    if (section === 'bulletins') {
      item.links = item.links.filter((link) => link.label.trim() && link.url.trim());
    }
    if (section === 'events' && item.endDate < item.startDate) {
      setNotice('Event end date must be on or after its start date.'); return;
    }
    const list = editing
      ? (data[section] ?? []).map((old) => old.id === editing ? item : old)
      : [...data[section], item];
    await save({ ...data, [section]: list }, editing ? 'Changes saved.' : 'New entry published.');
  }

  async function remove(item) {
    if (!window.confirm(`Delete "${item.name || item.title}"?`)) return;
    const list = data[section].filter((entry) => entry.id !== item.id);
    await save({ ...data, [section]: list }, 'Entry deleted.');
  }

  async function uploadImage(file) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setNotice('Maximum image size: 2 MB (PNG, JPEG, WebP, GIF).'); return;
    }
    setBusy(true);
    setNotice('Uploading image to GitHub...');
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = () => reject(new Error('Could not read image.'));
        reader.readAsDataURL(file);
      });
      const result = await api('/api/upload', 'POST', token, { base64 });
      update('image', result.image);
      setNotice('Image uploaded. Save the form to attach it to the entry.');
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  }

  function ImageField() {
    return (
      <div className="contact-field contact-field-full">
        <label htmlFor="admin-preview-file">Preview image (PNG, JPG, WebP or GIF, up to 2 MB)</label>
        <input id="admin-preview-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif"
          disabled={busy} onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            uploadImage(file);
          }} />
        {form.image && <div><img src={form.image} alt="Current preview" width="240" /></div>}
        {form.image && <button className="back-link" type="button" onClick={() => update('image', '')}>
          Remove preview image
        </button>}
      </div>
    );
  }

  return (
    <div className="projects-page">
      <header className="projects-header">
        <div className="page-topbar">
          <Link to="/" className="back-link">← Home</Link>
          <span className="page-crumb">~/coding-club/admin</span>
        </div>
        <p className="eyebrow">{'//'} administration</p>
        <h1 className="projects-title">Club <span className="accent-text">Admin</span></h1>
      </header>
      <main className="projects-main">
        {notice && <p className="result-count" role="status">{notice}</p>}
        {!token && (
          <section className="panel corners">
            <h2>Sign in with an approved Google account</h2>
            <p className="result-count">Only server-whitelisted accounts can edit this website.</p>
            <GoogleLogin onSuccess={signIn} onError={() => setNotice('Google sign-in failed.')} />
            {busy && <p>Checking access...</p>}
          </section>
        )}
        {token && data && (
          <>
            <div className="project-controls" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
              {Object.keys(SECTIONS).map((name) => (
                <button key={name} type="button"
                  className={`btn ${name === section ? 'btn-primary' : ''}`}
                  onClick={() => changeSection(name)} disabled={busy}>
                  {SECTIONS[name]}
                </button>
              ))}
              <button type="button" className="back-link" onClick={signOut}>Sign out ({email})</button>
            </div>

            <section className="panel corners" style={{ marginBottom: 24 }}>
              <h2 className="detail-subtitle">{editing ? 'Edit' : 'Add'} {SECTIONS[section]}</h2>
              <form className="contact-form" onSubmit={submit}>
                {section === 'projects' && (
                  <>
                    <FormField label="Project name" value={form.name} required onChange={(v) => update('name', v)} />
                    <FormField label="URL slug (optional for new projects)" value={form.slug}
                      onChange={(v) => update('slug', v)} />
                    <FormField label="Vertical" value={form.vertical} options={VERTICALS}
                      onChange={(v) => update('vertical', v)} />
                    <FormField label="Languages / tags (comma separated)" value={form.tags}
                      onChange={(v) => update('tags', v)} />
                    <FormField label="Description" type="textarea" required value={form.description}
                      onChange={(v) => update('description', v)} />
                    <div className="contact-field" />
                    <FormField label="Live website URL" value={form.liveUrl} onChange={(v) => update('liveUrl', v)} />
                    <FormField label="Source code URL" value={form.sourceUrl} onChange={(v) => update('sourceUrl', v)} />
                  </>
                )}

                {section === 'bulletins' && (
                  <>
                    <FormField label="Bulletin title" value={form.title} required onChange={(v) => update('title', v)} />
                    <div className="contact-field" />
                    <FormField label="Description" type="textarea" required value={form.description}
                      onChange={(v) => update('description', v)} />
                    <div className="contact-field" />
                    <div className="contact-field contact-field-full">
                      <label>Links</label>
                      {form.links.map((link, i) => (
                        <div key={i} className="project-controls" style={{ flexWrap: 'wrap', margin: '8px 0' }}>
                          <input aria-label={`Link ${i + 1} label`} placeholder="Label" value={link.label}
                            onChange={(e) => update('links', form.links.map((l, j) => j === i ? { ...l, label: e.target.value } : l))} />
                          <input aria-label={`Link ${i + 1} URL`} placeholder="https://... or /projects/..."
                            value={link.url} onChange={(e) => update('links', form.links.map((l, j) => j === i ? { ...l, url: e.target.value } : l))} />
                          <button type="button" className="back-link"
                            onClick={() => update('links', form.links.filter((_, j) => j !== i))}>Remove</button>
                        </div>
                      ))}
                      <button type="button" className="back-link" disabled={form.links.length >= 10}
                        onClick={() => update('links', [...form.links, { label: '', url: '' }])}>+ Add link</button>
                    </div>
                  </>
                )}

                {section === 'events' && (
                  <>
                    <FormField label="Event name" value={form.name} required onChange={(v) => update('name', v)} />
                    <FormField label="Event link" value={form.link} onChange={(v) => update('link', v)} />
                    <FormField label="Start date (IST)" type="date" value={form.startDate} required onChange={(v) => update('startDate', v)} />
                    <FormField label="End date (IST, inclusive)" type="date" value={form.endDate} required onChange={(v) => update('endDate', v)} />
                    <FormField label="Description" type="textarea" required value={form.description}
                      onChange={(v) => update('description', v)} />
                    <div className="contact-field" />
                  </>
                )}

                <ImageField />
                <div className="contact-field contact-field-full" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  <button type="submit" className="btn btn-primary" disabled={busy}>
                    {busy ? 'Working...' : editing ? 'Save changes' : 'Publish entry'}
                  </button>
                  {editing && <button type="button" className="btn" disabled={busy}
                    onClick={() => { setEditing(null); setForm(empty[section]()); }}>Cancel editing</button>}
                </div>
              </form>
            </section>

            <section className="panel corners">
              <h2 className="detail-subtitle">Published {SECTIONS[section]} ({(data[section] ?? []).length})</h2>
              {(data[section] ?? []).length === 0 && <p className="result-count">No entries yet.</p>}
              {(data[section] ?? []).map((item) => (
                <div key={item.id} className="detail-meta" style={{ padding: '18px 0' }}>
                  <div style={{ gap: 12 }}>
                    <span>
                      <strong>{item.name || item.title}</strong>
                      {section === 'events' && <small> ({item.startDate} to {item.endDate})</small>}
                    </span>
                    <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button type="button" className="back-link" disabled={busy} onClick={() => startEdit(item)}>Edit</button>
                      <button type="button" className="back-link" disabled={busy} onClick={() => remove(item)}>Delete</button>
                    </span>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default function Admin() {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  if (!clientId) return <main className="detail-page">Missing VITE_GOOGLE_CLIENT_ID.</main>;
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AdminPanel />
    </GoogleOAuthProvider>
  );
}
