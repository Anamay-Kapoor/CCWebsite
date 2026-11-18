import { readFile } from '../server/github.js';
import { api } from '../server/middleware.js';

const types = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };

export default api({ methods: ['GET', 'HEAD'] }, async (req, res) => {
  const path = req.query?.file;
  if (typeof path !== 'string' ||
    !/^uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|jpeg|webp|gif)$/.test(path)) {
    return res.status(400).json({ error: 'Invalid image path.' });
  }
  const result = await readFile(path);
  res.setHeader('Content-Type', types[path.split('.').pop()]);
  res.setHeader('Content-Disposition', 'inline');
  // Images are shown on the site's own pages; allow that, but nothing else.
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, immutable');
  return res.status(200).send(result.bytes);
});
