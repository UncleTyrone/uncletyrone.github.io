# GitHub API proxy service

Minimal Express server that proxies `GET`/`HEAD` requests from `/api/github/*` to `https://api.github.com/*` using a server-side `GITHUB_TOKEN`. Use this so a frontend (e.g. GitHub Pages) can call GitHub with private-repo access without exposing a token.

## Quick start (local)

```bash
cd github-proxy-service
npm install
set GITHUB_TOKEN=ghp_your_token_here   # Windows
# export GITHUB_TOKEN=ghp_your_token_here   # macOS/Linux
npm start
```

Health check: `http://localhost:8787/health`  
Example: `http://localhost:8787/api/github/user`

## Use as its own Git repo

This folder is self-contained. From inside `github-proxy-service/`:

```bash
git init
git add .
git commit -m "Initial github proxy service"
git remote add origin https://github.com/YOU/github-proxy-service.git
git push -u origin main
```

## Deploy on Render

1. **New** → **Web Service** → connect the repo that contains only this folder (or use a monorepo with **Root Directory** = `github-proxy-service`).
2. **Build command:** `npm install`
3. **Start command:** `npm start`
4. **Environment variables:**
   - `GITHUB_TOKEN` — fine-grained PAT with read access to the repos you need
   - Optional: `ALLOWED_ORIGIN` — your site origin, e.g. `https://uncletyrone.github.io` (tightens CORS; default is `*`)

Your proxy base URL will look like `https://github-proxy-service-xxxx.onrender.com`.

## Frontend (portfolio) configuration

Set at **build time** (e.g. in `.env.production`):

```env
REACT_APP_GITHUB_PROXY_URL=https://your-service.onrender.com/api/github
```

Rebuild and deploy the React app. The client should call `REACT_APP_GITHUB_PROXY_URL` + path, e.g. `/users/.../repos`.

## Security

- Never commit `GITHUB_TOKEN` or put it in frontend env vars.
- Prefer a fine-grained token limited to specific repositories.
- Use `ALLOWED_ORIGIN` in production.
