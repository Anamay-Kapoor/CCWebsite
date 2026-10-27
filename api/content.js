import { readContent, writeFile } from '../server/github.js';
import { authorize, noCache, sendError } from '../server/auth.js';
import { validateContent } from '../server/validate.js';

export default async function handler(req, res) {
  noCache(res);
  try {
    if (req.method === 'GET') {
      const result = await readContent();
      return res.status(200).json(result);
    }
    if (req.method !== 'PUT') {
      res.setHeader('Allow', 'GET, PUT');
      return res.status(405).json({ error: 'Method not allowed.' });
    }

    const admin = await authorize(req);
    const { data, sha } = req.body || {};
    if (typeof sha !== 'string' || !/^[a-f0-9]{40}$/.test(sha)) {
      return res.status(400).json({ error: 'Missing GitHub SHA. Reload the dashboard.' });
    }
    const clean = validateContent(data);
    const saved = await writeFile(
      'content/site.json',
      JSON.stringify(clean, null, 2) + '\n',
      `Update club content (${admin.email})`,
      sha
    );
    return res.status(200).json({ data: clean, sha: saved });
  } catch (error) {
    return sendError(res, error);
  }
}
