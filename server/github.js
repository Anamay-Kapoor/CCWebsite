import { Buffer } from 'node:buffer';

const base = 'https://api.github.com';

function settings() {
  const { GH_OWNER, GH_REPO, GH_BRANCH = 'main', GH_TOKEN } = process.env;
  if (!GH_OWNER || !GH_REPO || !GH_TOKEN) {
    throw Object.assign(new Error('GitHub environment variables are missing.'), { status: 503 });
  }
  return { owner: GH_OWNER, repo: GH_REPO, branch: GH_BRANCH, token: GH_TOKEN };
}

async function github(method, path, body) {
  const cfg = settings();
  const url = `${base}/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${cfg.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  });
  if (!response.ok) {
    const message = response.status === 404
      ? 'GitHub file/repository not found. Check repository, branch, token and content/site.json.'
      : response.status === 409 || response.status === 422
        ? 'GitHub content changed. Reload the admin page and retry.'
        : `GitHub returned HTTP ${response.status}.`;
    const status = response.status === 409 || response.status === 422 ? 409
      : response.status === 404 ? 404 : 502;
    throw Object.assign(new Error(message), { status });
  }
  return response.json();
}

function contentPath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

export async function readFile(path) {
  const { branch } = settings();
  const file = await github('GET', `contents/${contentPath(path)}?ref=${encodeURIComponent(branch)}`);
  if (!file.sha || file.type !== 'file') {
    throw Object.assign(new Error('Invalid GitHub file response.'), { status: 502 });
  }
  let base64 = file.content;
  if (file.encoding !== 'base64' || !base64) {
    const blob = await github('GET', `git/blobs/${encodeURIComponent(file.sha)}`);
    if (blob.encoding !== 'base64' || !blob.content) {
      throw Object.assign(new Error('Cannot decode GitHub file.'), { status: 502 });
    }
    base64 = blob.content;
  }
  return { sha: file.sha, bytes: Buffer.from(base64.replace(/\s/g, ''), 'base64') };
}

export async function writeFile(path, bytes, message, sha) {
  const { branch } = settings();
  const payload = {
    message,
    content: Buffer.from(bytes).toString('base64'),
    branch,
    ...(sha ? { sha } : {}),
  };
  const result = await github('PUT', `contents/${contentPath(path)}`, payload);
  return result.content.sha;
}

export async function readContent() {
  const file = await readFile('content/site.json');
  let data;
  try {
    data = JSON.parse(file.bytes.toString('utf8'));
  } catch {
    throw Object.assign(new Error('content/site.json is not valid JSON.'), { status: 502 });
  }
  return { data, sha: file.sha };
}
