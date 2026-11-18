import { api } from '../server/middleware.js';
import { noCache } from '../server/auth.js';
import { readContent, writeFile } from '../server/github.js';
import { validateContent, normalizeContent } from '../server/validate.js';

export default api({
  methods: ['GET', 'PUT'],
  auth: ['PUT'],
  limit: { name: 'content', max: 600, windowMs: 60e3 },
}, async (req, res) => {
  if (req.method === 'GET') {
    // Visitors get a CDN-cached copy (one GitHub call per 30 s, not one per page view).
    // The admin asks with ?fresh=1 to always see the latest.
    if (req.query && 'fresh' in req.query) noCache(res);
    else res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=300');
    const result = await readContent();
    return res.status(200).json({ data: normalizeContent(result.data), sha: result.sha, missing: !!result.missing });
  }

  noCache(res);
  const { data, sha } = req.body;
  // sha is null only when content/site.json doesn't exist yet (first save creates it).
  if (sha !== null && (typeof sha !== 'string' || !/^[a-f0-9]{40}$/.test(sha))) {
    return res.status(400).json({ error: 'Missing content version. Reload the admin page.' });
  }
  const clean = validateContent(data);
  const saved = await writeFile(
    'content/site.json',
    JSON.stringify(clean, null, 2) + '\n',
    `Update club content (${req.admin.username})`,
    sha || undefined
  );
  return res.status(200).json({ data: clean, sha: saved });
});
