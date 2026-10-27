import { authorize, noCache, sendError } from '../server/auth.js';

export default async function handler(req, res) {
  noCache(res);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    const admin = await authorize(req);
    return res.status(200).json({ email: admin.email });
  } catch (error) {
    return sendError(res, error);
  }
}
