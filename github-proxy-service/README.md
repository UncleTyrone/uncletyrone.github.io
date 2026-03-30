# GitHub API proxy service

Minimal Node/Express server that proxies:
- `GET/HEAD /api/github/*` → `https://api.github.com/*`

It uses a server-side `GITHUB_TOKEN` so your frontend can display private repositories without exposing credentials in the browser.

## Required environment variables

- `GITHUB_TOKEN` (required)
  - A GitHub token with read access to the repos you want to show
  - Fine-grained PAT is recommended
- `ALLOWED_ORIGIN` (optional)
  - Used for CORS: sets `Access-Control-Allow-Origin`
  - Default is `*`

## Local development

```bash
cd github-proxy-service
npm install
set GITHUB_TOKEN=ghp_your_token_here
npm start
```

Health check:
- `http://localhost:8787/health`

Example:
- `http://localhost:8787/api/github/user`

## Render deployment (Web Service)

1. Render → New → Web Service
2. Connect the repo that contains this folder
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables:
   - `GITHUB_TOKEN`
   - Optional: `ALLOWED_ORIGIN`

Render will provide a URL like:
- `https://github-proxy-service.onrender.com`

## Frontend configuration (portfolio)

Set (build-time) on the portfolio site:

```env
REACT_APP_GITHUB_PROXY_URL=https://github-proxy-service.onrender.com/api/github
```

The portfolio app will call the proxy using paths like:
- `/api/github/users/...`
- `/api/github/user/repos?...`
- `/api/github/repos/:full_name/languages`

## Security notes

- Do not put `GITHUB_TOKEN` in frontend code or frontend env vars.
- Prefer limiting the token to only the repositories you need (fine-grained PAT).

