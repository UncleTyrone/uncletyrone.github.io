const DIRECT_GITHUB_API_BASE = 'https://api.github.com';

/** Default Render proxy — always used unless you opt into public API (see below). */
const DEFAULT_PROXY_BASE = 'https://github-proxy-service.onrender.com/api/github';

const normalizeProxyBase = (raw) => {
  let base = raw.trim().replace(/\/$/, '');
  if (base === DIRECT_GITHUB_API_BASE) {
    return base;
  }
  if (!base.includes('/api/github')) {
    base = `${base}/api/github`;
  }
  return base;
};

/**
 * CRA merges env files; `.env.local` overrides `.env.production`.
 * If REACT_APP_GITHUB_PROXY_URL is missing or wrongly set to https://api.github.com,
 * we still use the Render proxy unless you set REACT_APP_USE_PUBLIC_GITHUB_API=true.
 */
const getApiBase = () => {
  const usePublic = process.env.REACT_APP_USE_PUBLIC_GITHUB_API === 'true';
  if (usePublic) {
    return DIRECT_GITHUB_API_BASE;
  }

  const fromEnv = process.env.REACT_APP_GITHUB_PROXY_URL?.trim();
  if (!fromEnv) {
    return DEFAULT_PROXY_BASE;
  }

  const normalized = normalizeProxyBase(fromEnv);
  if (normalized === DIRECT_GITHUB_API_BASE) {
    return DEFAULT_PROXY_BASE;
  }
  return normalized;
};

/** In DevTools: window.__GITHUB_API_BASE__ */
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
