import { readFile } from '../server/github.js';
import { sendError } from '../server/auth.js';

const types = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const path = req.query?.file;
  if (typeof path !== 'string' ||
    !/^uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|jpeg|webp|gif)$/.test(path)) {
    return res.status(400).json({ error: 'Invalid image path.' });
  }
  try {
    const result = await readFile(path);
    res.setHeader('Content-Type', types[path.split('.').pop()]);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(result.bytes);
  } catch (error) {
    return sendError(res, error);
  }
}
