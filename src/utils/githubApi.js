const DIRECT_GITHUB_API_BASE = 'https://api.github.com';

/** Production proxy on Render — set REACT_APP_GITHUB_PROXY_URL to override or use https://api.github.com for unauthenticated public API only. */
const DEFAULT_PROXY_BASE = 'https://github-proxy-service.onrender.com/api/github';

const normalizeProxyBase = (raw) => {
  let base = raw.trim().replace(/\/$/, '');
  if (!base.includes('/api/github') && base !== DIRECT_GITHUB_API_BASE) {
    base = `${base}/api/github`;
  }
  return base;
};

const getApiBase = () => {
  const fromEnv = process.env.REACT_APP_GITHUB_PROXY_URL?.trim();
  if (fromEnv) {
    return normalizeProxyBase(fromEnv);
  }
  return DEFAULT_PROXY_BASE;
};

/** Baked in at build time — in DevTools console run: window.__GITHUB_API_BASE__ */
if (typeof window !== 'undefined') {
  window.__GITHUB_API_BASE__ = getApiBase();
}

const isDirectGitHub = (base) => base === DIRECT_GITHUB_API_BASE;

export const fetchGitHub = async (path, options = {}) => {
  const base = getApiBase();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${base}${normalizedPath}`;

  const defaultHeaders = {
    Accept: 'application/vnd.github.v3+json'
  };

  if (isDirectGitHub(base)) {
    defaultHeaders['User-Agent'] = 'UncleTyrone-Portfolio';
  }

  return fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  });
};
