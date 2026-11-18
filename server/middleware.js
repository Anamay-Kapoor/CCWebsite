import { authorize, sendError } from './auth.js';

/*
 * Security middleware shared by every /api function.
 *
 *   export default api({ methods: ['GET', 'PUT'], auth: ['PUT'], limit: { name: 'save', max: 120, windowMs: 3600e3 } }, handler)
 *
 * Every response: hardening headers.
 * Every request:  method allow-list.
 * Writes:         same-origin check (blocks CSRF), JSON-only bodies, a custom header
 *                 browsers can't send cross-site without permission.
 * Optional:       admin session check, per-IP rate limit.
 */

const HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Robots-Tag': 'noindex, nofollow',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
};

const READS = new Set(['GET', 'HEAD']);

export function clientIp(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || String(req.headers['x-real-ip'] || '') || req.socket?.remoteAddress || 'unknown';
}

function sameOrigin(req) {
  // Modern browsers say outright whether the request is cross-site.
  const site = req.headers['sec-fetch-site'];
  if (site && site !== 'same-origin') return false;
  const origin = req.headers.origin;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (!origin || !host) return false;
  try { return new URL(origin).host === String(host).split(',')[0].trim(); } catch { return false; }
}

/*
 * Fixed-window counter per IP. Serverless instances don't share memory, so this is a
 * per-instance brake, not a hard global limit; pair it with a Vercel Firewall rule
 * for /api/login if the site is ever targeted.
 */
const buckets = new Map();
export function rateLimit(req, { name, max, windowMs }) {
  const key = `${name}:${clientIp(req)}`;
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.reset <= now) { b = { count: 0, reset: now + windowMs }; buckets.set(key, b); }
  b.count += 1;
  if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k);
  return { ok: b.count <= max, retryAfter: Math.ceil((b.reset - now) / 1000) };
}

export function api({ methods, auth = [], limit, json = true }, handler) {
  return async function secured(req, res) {
    Object.entries(HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    try {
      if (!methods.includes(req.method)) {
        res.setHeader('Allow', methods.join(', '));
        return res.status(405).json({ error: 'Method not allowed.' });
      }
      if (!READS.has(req.method)) {
        if (!sameOrigin(req)) return res.status(403).json({ error: 'Cross-site request blocked.' });
        if (req.headers['x-requested-with'] !== 'cc-admin') return res.status(403).json({ error: 'Request blocked.' });
        if (json && !/^application\/json\b/i.test(String(req.headers['content-type'] || ''))) {
          return res.status(415).json({ error: 'Send JSON.' });
        }
        if (json && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) {
          return res.status(400).json({ error: 'Invalid request body.' });
        }
      }
      if (limit) {
        const r = rateLimit(req, limit);
        if (!r.ok) {
          res.setHeader('Retry-After', String(r.retryAfter));
          return res.status(429).json({ error: `Too many attempts. Try again in ${Math.ceil(r.retryAfter / 60)} minute(s).` });
        }
      }
      req.admin = auth.includes(req.method) ? await authorize(req) : null;
      return await handler(req, res);
    } catch (error) {
      return sendError(res, error);
    }
  };
}
