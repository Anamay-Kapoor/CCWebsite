import { Buffer } from 'node:buffer';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/*
 * Username + password admin login (ADMIN_USERNAME / ADMIN_PASSWORD in Vercel).
 * The session lives in an HttpOnly, SameSite=Strict cookie: page JavaScript can't read it,
 * so a script injected into the site couldn't steal it, and other sites can't make the
 * browser send it. Changing the password (or ADMIN_SESSION_SECRET) logs everyone out.
 */

export const SESSION_HOURS = 12;
const COOKIE = 'cc_admin';

function credentials() {
  const username = (process.env.ADMIN_USERNAME || '').trim();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!username || password.length < 12) {
    throw Object.assign(new Error('Admin login is not set up. Set ADMIN_USERNAME and ADMIN_PASSWORD (12+ characters) in Vercel.'), { status: 503 });
  }
  return { username, password };
}

const sha = (text) => createHash('sha256').update(String(text)).digest();
const same = (a, b) => timingSafeEqual(sha(a), sha(b)); // constant time, any length
const keyFor = (password) => `cc-admin-session:${process.env.ADMIN_SESSION_SECRET || ''}:${password}`;
const sign = (payload, password) => createHmac('sha256', keyFor(password)).update(payload).digest('base64url');

export async function checkLogin(username, password) {
  const creds = credentials();
  if (typeof username !== 'string' || typeof password !== 'string' || username.length > 200 || password.length > 500) {
    throw Object.assign(new Error('Wrong username or password.'), { status: 401 });
  }
  const ok = same(username.trim().toLowerCase(), creds.username.toLowerCase()) & same(password, creds.password);
  if (!ok) {
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 600)); // slow, jittered failures
    throw Object.assign(new Error('Wrong username or password.'), { status: 401 });
  }
  const payload = Buffer.from(JSON.stringify({
    u: creds.username, exp: Date.now() + SESSION_HOURS * 3600e3, n: randomBytes(8).toString('hex'),
  })).toString('base64url');
  return { token: `${payload}.${sign(payload, creds.password)}`, username: creds.username };
}

function readCookie(req) {
  const raw = String(req.headers.cookie || '');
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === COOKIE) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}

const isHttps = (req) => process.env.VERCEL || String(req.headers['x-forwarded-proto'] || '').startsWith('https');

export function setSessionCookie(req, res, token) {
  res.setHeader('Set-Cookie', [
    `${COOKIE}=${encodeURIComponent(token)}`, 'Path=/api', 'HttpOnly', 'SameSite=Strict',
    `Max-Age=${SESSION_HOURS * 3600}`, ...(isHttps(req) ? ['Secure'] : []),
  ].join('; '));
}

export function clearSessionCookie(req, res) {
  res.setHeader('Set-Cookie', [`${COOKIE}=`, 'Path=/api', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0', ...(isHttps(req) ? ['Secure'] : [])].join('; '));
}

export async function authorize(req) {
  const creds = credentials();
  const token = readCookie(req);
  if (!token) throw Object.assign(new Error('Log in to continue.'), { status: 401 });
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !same(signature, sign(payload, creds.password))) {
    throw Object.assign(new Error('Your session is no longer valid. Log in again.'), { status: 401 });
  }
  let data;
  try { data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { data = null; }
  if (!data || typeof data.exp !== 'number' || data.exp < Date.now()) {
    throw Object.assign(new Error('Your session expired. Log in again.'), { status: 401 });
  }
  return { username: data.u };
}

export function sendError(res, error) {
  const status = error.status || 500;
  if (status >= 500 && status !== 503) console.error(error);
  const message = status < 500 || status === 503 ? error.message : 'Server unavailable or misconfigured. Check function logs.';
  return res.status(status).json({ error: message });
}

export function noCache(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
}
