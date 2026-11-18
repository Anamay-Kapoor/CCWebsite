import { randomUUID } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { api } from '../server/middleware.js';
import { noCache } from '../server/auth.js';
import { writeFile } from '../server/github.js';

const LIMIT = 2 * 1024 * 1024;

function imageExtension(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'jpg';
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6))) return 'gif';
  return null;
}

export default api({
  methods: ['POST'],
  auth: ['POST'],
  limit: { name: 'upload', max: 60, windowMs: 3600e3 },
}, async (req, res) => {
  noCache(res);
  const encoded = req.body.base64;
  if (typeof encoded !== 'string' || encoded.length > Math.ceil(LIMIT * 4 / 3) + 100 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    return res.status(400).json({ error: 'Invalid image. Upload a PNG/JPG/WebP/GIF under 2 MB.' });
  }
  const bytes = Buffer.from(encoded, 'base64');
  const ext = imageExtension(bytes);
  if (!ext || bytes.length > LIMIT || bytes.length < 32) {
    return res.status(400).json({ error: 'Upload a valid PNG/JPG/WebP/GIF under 2 MB.' });
  }
  const file = `uploads/${randomUUID()}.${ext}`;
  await writeFile(file, bytes, `Add image ${file} (${req.admin.username})`);
  return res.status(201).json({ image: `/api/media?file=${encodeURIComponent(file)}` });
});
