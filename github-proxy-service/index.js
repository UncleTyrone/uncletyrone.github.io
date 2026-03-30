/**
 * GitHub API proxy — forwards GET/HEAD under /api/github to https://api.github.com
 * using a server-side GITHUB_TOKEN (never exposed to browsers).
 *
 * Environment:
 *   GITHUB_TOKEN   — required (fine-grained PAT with repo read access)
 *   PORT           — optional (Render sets this)
 *   ALLOWED_ORIGIN — optional CORS origin (default *)
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const express = require('express');

const PORT = Number(process.env.PORT) || 8787;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

const app = express();

app.disable('x-powered-by');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'github-proxy-service' });
});

app.use('/api/github', async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!GITHUB_TOKEN) {
    res.status(500).json({ error: 'GITHUB_TOKEN is not configured on the server.' });
    return;
  }

  const pathAndQuery = req.url || '/';
  const githubUrl = `https://api.github.com${pathAndQuery.startsWith('/') ? pathAndQuery : `/${pathAndQuery}`}`;

  try {
    const u = new URL(githubUrl);
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: req.method,
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'github-proxy-service',
        'Cache-Control': 'no-store'
      }
    };

    const ghRes = await new Promise((resolve, reject) => {
      const r = https.request(options, resolve);
      r.on('error', reject);
      r.end();
    });

    const chunks = [];
    for await (const chunk of ghRes) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);
    const contentType = ghRes.headers['content-type'] || 'application/json';

    res.status(ghRes.statusCode || 500);
    res.setHeader('content-type', contentType);
    res.setHeader('cache-control', 's-maxage=300, stale-while-revalidate=600');
    res.send(body);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to proxy request to GitHub.',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

http.createServer(app).listen(PORT, () => {
  console.log(`[github-proxy-service] listening on port ${PORT}`);
});
