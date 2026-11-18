const MAX_SIZE = 180000; // JSON bytes, ~180 KB
const kinds = ['webdev', 'ai-ml', 'gamedev'];
const verticalNames = {
  webdev: 'WebDev Vertical', 'ai-ml': 'AI / ML Vertical', gamedev: 'GameDev Vertical',
};

function issue(message) {
  throw Object.assign(new Error(message), { status: 400 });
}

function string(value, name, max = 500, required = false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) issue(`Invalid ${name}.`);
  return value.trim();
}

function url(value, name) {
  const text = string(value, name, 2000);
  if (!text) return text;
  if (text.startsWith('/') && !text.startsWith('//') && !/[\\\u0000-\u001f]/.test(text)) return text;
  try {
    const parsed = new URL(text);
    if (['http:', 'https:'].includes(parsed.protocol)) return text;
  } catch { /* invalid URL */ }
  issue(`Invalid ${name}: use https://... or /internal-path.`);
}

function image(value) { return url(value, 'image'); }
function id(value) { return string(value, 'id', 110, true); }
function date(value, name) {
  const text = string(value, name, 10, true);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) ||
    Number.isNaN(Date.parse(`${text}T00:00:00Z`)) ||
    new Date(`${text}T00:00:00Z`).toISOString().slice(0, 10) !== text) issue(`Invalid ${name}.`);
  return text;
}

function project(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) issue('Invalid project.');
  if (!kinds.includes(p.vertical)) issue('Invalid project vertical.');
  const slug = string(p.slug, 'slug', 100, true);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) issue('Invalid project slug.');
  if (!Array.isArray(p.tags) || p.tags.length > 20) issue('Invalid project tags.');
  return {
    id: id(p.id), slug, name: string(p.name, 'project name', 120, true),
    vertical: p.vertical, verticalLabel: verticalNames[p.vertical],
    tags: p.tags.map((tag) => string(tag, 'tag', 50, true)),
    description: string(p.description, 'project description', 3000, true),
    image: image(p.image), liveUrl: url(p.liveUrl, 'live URL'),
    sourceUrl: url(p.sourceUrl, 'source URL'),
  };
}

function bulletin(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) issue('Invalid bulletin.');
  if (!Array.isArray(p.links) || p.links.length > 10) issue('Invalid bulletin links.');
  return {
    id: id(p.id), title: string(p.title, 'bulletin title', 150, true),
    description: string(p.description, 'bulletin description', 3000, true), image: image(p.image),
    links: p.links.map((link) => ({
      label: string(link?.label, 'link label', 70, true),
      url: url(link?.url, 'bulletin link'),
    })),
  };
}

function event(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) issue('Invalid event.');
  const startDate = date(p.startDate, 'start date');
  const endDate = date(p.endDate, 'end date');
  if (endDate < startDate) issue('Event end date precedes start date.');
  return {
    id: id(p.id), name: string(p.name, 'event name', 150, true),
    description: string(p.description, 'event description', 3000, true),
    startDate, endDate, link: url(p.link, 'event URL'), image: image(p.image),
  };
}

function member(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) issue('Invalid team member.');
  if (!kinds.includes(p.vertical)) issue('Invalid team member vertical.');
  const batch = Number(p.batch);
  if (!Number.isInteger(batch) || batch < 2000 || batch > 2100) issue('Invalid batch year.');
  if (p.lead !== undefined && typeof p.lead !== 'boolean') issue('Invalid lead flag.');
  const clean = {
    id: id(p.id), name: string(p.name, 'member name', 80, true), vertical: p.vertical, batch,
    role: string(p.role ?? '', 'role', 80), lead: p.lead === true, photo: image(p.photo ?? ''),
  };
  // Optional photo framing: [x %, y %, zoom].
  if (p.focus !== undefined && p.focus !== null) {
    const f = p.focus;
    if (!Array.isArray(f) || f.length !== 3 || !f.every((n) => typeof n === 'number' && Number.isFinite(n)) ||
      f[0] < 0 || f[0] > 100 || f[1] < 0 || f[1] > 100 || f[2] < 0.5 || f[2] > 4) issue('Invalid photo framing.');
    clean.focus = f;
  }
  return clean;
}

function checkUnique(arr, field) {
  if (new Set(arr.map((p) => p[field])).size !== arr.length) issue(`Duplicate ${field}.`);
}

export function validateContent(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) issue('Invalid JSON data.');
  if (Buffer.byteLength(JSON.stringify(data)) > MAX_SIZE) issue('Website data exceeds 180 KB.');
  const members = data.members ?? [];
  if (!Array.isArray(data.projects) || data.projects.length > 250 ||
    !Array.isArray(data.bulletins) || data.bulletins.length > 200 ||
    !Array.isArray(data.events) || data.events.length > 200 ||
    !Array.isArray(members) || members.length > 500) issue('Invalid content collections.');

  const clean = {
    projects: data.projects.map(project),
    bulletins: data.bulletins.map(bulletin),
    events: data.events.map(event),
    members: members.map(member),
  };
  for (const arr of Object.values(clean)) checkUnique(arr, 'id');
  checkUnique(clean.projects, 'slug');
  return clean;
}

/*
 * Lenient version for reads: one bad entry (e.g. edited by hand on GitHub)
 * is dropped instead of taking the whole website down.
 */
export function normalizeContent(raw) {
  const data = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const keep = (list, fn) => (Array.isArray(list) ? list : []).flatMap((item) => {
    try { return [fn(item)]; } catch (error) { console.warn('Skipping invalid entry:', error.message); return []; }
  });
  const out = {
    projects: keep(data.projects, project),
    bulletins: keep(data.bulletins, bulletin),
    events: keep(data.events, event),
  };
  // Older content files have no team yet; leave it out so the site can use its bundled roster.
  if (Array.isArray(data.members)) out.members = keep(data.members, member);
  return out;
}
