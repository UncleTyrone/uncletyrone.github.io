# UncleTyrone Portfolio Website

React portfolio site with:
- Video background + overlay
- Music player (5 tracks)
- Social links (hover)
- GitHub widgets: repositories, file preview, language mini chart, and build/release info

This repository also includes a separate backend proxy (see `github-proxy-service/`) for displaying private repositories safely.

## Repository Links & Additional Tools

[DevTools Usage](scripts/README-devtools.md)

[Proxy Service Setup](github-proxy-service/README.md)

## Features

- Responsive glassmorphism UI
- Video background (looping MP4)
- Music player (supports 5 tracks)
- GitHub integration:
  - Repositories list (non-forks + forks)
  - Per-repo watcher count (“watching”)
  - Per-repo language mini chart
  - File preview from repository contents
  - Build widget from GitHub releases

## Local development

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm start
```

3. Open `http://localhost:3000`

## Build

```bash
npm run build
```

Build runs:
- `npm run build:plugins` (bundles BetterCode under `public/plugins/BetterCode/`)
- then `react-scripts build`

## Deploy to GitHub Pages

```bash
npm run deploy
```

This uses `gh-pages -d build`.

## GitHub integration (public + private)

### Why a backend proxy exists

You cannot include a GitHub token in frontend code without exposing it to users.  
To support private repositories, the app calls GitHub through a server-side proxy.

### Proxy service

Deploy the separate proxy in:
- `github-proxy-service/` (Render Web Service)

The proxy exposes:
- `GET/HEAD https://<proxy-host>/api/github/*`

It forwards requests to `https://api.github.com/*` using `GITHUB_TOKEN`.

Required proxy env vars:
- `GITHUB_TOKEN` (required): a token with read access to the private repos you want to show

Optional proxy env vars:
- `ALLOWED_ORIGIN` (optional): set to your site origin to tighten CORS (default is `*`)

### Frontend configuration (build-time)

The frontend reads `REACT_APP_GITHUB_PROXY_URL` to decide whether to use:
- the proxy (private-capable), or
- direct public GitHub API (public-only)

This repo includes:
- `.env.production` with:

```env
REACT_APP_GITHUB_PROXY_URL=https://github-proxy-service.onrender.com/api/github
```

If you deploy the proxy under a different URL, update that value and rebuild + redeploy the frontend.

### Which GitHub endpoints are used

`src/utils/githubApi.js` chooses the repos list endpoint:
- When using the proxy:
  - `GET /user/repos?visibility=all...` (public + private)
- When using direct public API:
  - `GET /users/UncleTyrone/repos...` (public only)

Per-repo requests (always go through the same API base):
- Repo details:
  - `GET /repos/:full_name` (for `subscribers_count` watch count)
- Languages:
  - `GET /repos/:full_name/languages`
- File preview:
  - `GET /repos/:full_name/contents?per_page=20`
- Releases (BuildWidget):
  - `GET /repos/:full_name/releases?per_page=5`

### Watchers (“watching”) count

Your “watching” stat is sourced from `subscribers_count`, not from the list endpoint.

Implementation:
- `src/components/RepositoryCard.js` fetches per repo via `GET /repos/:full_name`
- it reads `subscribers_count`
- it caches per repo:
  - `localStorage` key: `repo-watchers-<full_name>`
  - TTL: 12 hours

### Language mini chart (tiny slivers)

`src/components/MiniLanguageChart.js` uses raw byte counts from `/languages` so tiny languages do not round to 0%.

Tooltip precision:
- shows `99.9%`-style values
- for ultra-small slices, shows `<0.1%`

### File preview

`src/components/FileStructure.js`:
- fetches from `/contents?per_page=20`
- hides dotfiles (`.something`)
- shows up to 12 entries
- caches:
  - `localStorage` key: `file-structure-<full_name>`
  - TTL: 1 hour

## Debugging

From the browser console:

- `window.__GITHUB_API_BASE__`
  - shows the currently compiled API base (proxy vs direct GitHub)

- Cache clearing helpers:
  - `window.clearAllGitHubCaches()`
  - `window.clearLanguageCache()`
  - `window.clearFileStructureCache()`
  - `window.clearBuildCache()`

## BetterCode plugin (bundled at build time)

The BetterCode plugin is bundled during `npm run build` through:
- `npm run build:plugins` → `node build.mjs`

This generates `public/plugins/BetterCode/` content used by the BetterCode runtime.

## License

MIT

