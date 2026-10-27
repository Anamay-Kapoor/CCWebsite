import { OAuth2Client } from 'google-auth-library';

let googleClient;

export async function authorize(req) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);
  if (!clientId || !list.length) {
    throw Object.assign(new Error('Google authentication is not configured.'), { status: 503 });
  }

  const header = req.headers.authorization || '';
  const token = header.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw Object.assign(new Error('Sign in to continue.'), { status: 401 });

  try {
    googleClient ||= new OAuth2Client(clientId);
    const ticket = await googleClient.verifyIdToken({ idToken: token, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw Object.assign(new Error('Google account is not verified.'), { status: 403 });
    }
    if (!list.includes(payload.email.toLowerCase())) {
      throw Object.assign(new Error('This Google account is not an admin.'), { status: 403 });
    }
    return { email: payload.email, id: payload.sub };
  } catch (error) {
    if (error.status === 403) throw error;
    throw Object.assign(new Error('Invalid or expired Google sign-in. Sign in again.'), { status: 401 });
  }
}

export function sendError(res, error) {
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  return res.status(status).json({ error: status < 500 ? error.message : 'Server unavailable or misconfigured. Check function logs.' });
}

export function noCache(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
}
