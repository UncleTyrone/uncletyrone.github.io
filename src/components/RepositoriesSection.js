import React, { useState, useEffect } from 'react';
import RepositoryCard from './RepositoryCard';
import { fetchGitHub } from '../utils/githubApi';

const RepositoriesSection = () => {
  const [activeTab, setActiveTab] = useState('repositories');
  const [repositories, setRepositories] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add global function to clear all GitHub API caches (for debugging)
  useEffect(() => {
    window.clearAllGitHubCaches = () => {
      const keys = Object.keys(localStorage);
      const githubKeys = keys.filter(key => 
        key.includes('github') || 
        key.includes('build-data') || 
        key.includes('languages-') || 
        key.includes('file-structure-') ||
        key.includes('discord-server')
      );
      githubKeys.forEach(key => localStorage.removeItem(key));
      console.log('All GitHub API caches cleared! Refreshing page...');
      window.location.reload();
    };
    
    // Add function to force refresh repository data
    window.refreshRepositories = () => {
      console.log('Force refreshing repository data...');
      fetchRepositories();
    };
  }, []);

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    setLoading(true);
    setError(null);
    
    // Note: Caching is enabled to reduce API calls and improve performance
    
    // Try to get cached data first
    const cachedData = localStorage.getItem('github-repos-cache');
    const cacheTime = localStorage.getItem('github-repos-cache-time');
    const now = Date.now();
    
    // Check cache validity (30 minutes cache)
    if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 1800000) {
      try {
        const reposData = JSON.parse(cachedData);
        
        // Check if cached data has subscriber counts (new format)
        const hasSubscriberData = reposData.some(repo => 
          repo.subscribers_count !== undefined && repo.subscribers_count !== 0
        );
        
        if (hasSubscriberData) {
          // Use cached data if it has subscriber information
          const originalRepos = reposData.filter(repo => !repo.fork);
          const forks = reposData.filter(repo => repo.fork);
          setRepositories(originalRepos);
          setContributions(forks);
          setLoading(false);
          console.log('Using cached data with subscriber counts');
          return;
        } else {
          // Clear old cache data that doesn't have subscriber counts
          console.log('Detected old cache data without subscriber counts, clearing cache...');
          localStorage.removeItem('github-repos-cache');
          localStorage.removeItem('github-repos-cache-time');
        }
      } catch (cacheError) {
        console.warn('Failed to parse cached data:', cacheError);
        // Continue to fetch fresh data
      }
    }

    // Keep stale cache as emergency fallback if the API fails/rate-limits.
    let staleCachedRepos = null;
    if (cachedData) {
      try {
        staleCachedRepos = JSON.parse(cachedData);
      } catch (cacheParseError) {
        console.warn('Failed to parse stale cached data:', cacheParseError);
      }
    }
    
    
    // Try to fetch from GitHub API
    try {
      console.log('Fetching repositories from GitHub API...');
      const reposResponse = await fetchGitHub('/users/UncleTyrone/repos?sort=updated&per_page=100');
      
      console.log('GitHub API response status:', reposResponse.status);
      console.log('GitHub API response headers:', reposResponse.headers);
      
      if (reposResponse.ok) {
        const reposData = await reposResponse.json();
        console.log('Successfully fetched repositories:', reposData.length);
        console.log('Repository data:', reposData);
        
        // Filter out forks and get only original repositories
        const originalRepos = reposData.filter(repo => !repo.fork);
        console.log('Original repositories (non-forks):', originalRepos.length);

        // Do not use watchers_count here: GitHub's list endpoint mirrors stars in that field.
        // True "watching" count is subscribers_count from per-repo details and is fetched per card.
        const reposWithSubscribers = originalRepos.map((repo) => ({
          ...repo,
          subscribers_count: null
        }));
        setRepositories(reposWithSubscribers);

        // For contributions, we'll fetch repositories where the user has contributed
        const forks = reposData.filter(repo => repo.fork);
        console.log('Forked repositories:', forks.length);
        
        const forksWithSubscribers = forks.map((repo) => ({
          ...repo,
          subscribers_count: null
        }));
        setContributions(forksWithSubscribers);

        // Cache enriched data after successful fetch
        const mergedForCache = [...reposWithSubscribers, ...forksWithSubscribers];
        localStorage.setItem('github-repos-cache', JSON.stringify(mergedForCache));
        localStorage.setItem('github-repos-cache-time', now.toString());
      } else if (reposResponse.status === 403) {
        console.error('GitHub API rate limit exceeded');
        throw new Error('GitHub API rate limit exceeded. Please try again later.');
      } else {
        const errorText = await reposResponse.text();
        console.error('GitHub API error response:', errorText);
        throw new Error(`GitHub API error: ${reposResponse.status} - ${errorText}`);
      }
    } catch (apiError) {
      console.error('GitHub API failed, using fallback data:', apiError);
      console.error('Error details:', {
        message: apiError.message,
        stack: apiError.stack,
        name: apiError.name
      });
      
      // Try stale cache first so the UI keeps real data during API issues.
      if (staleCachedRepos && staleCachedRepos.length > 0) {
        const originalRepos = staleCachedRepos.filter(repo => !repo.fork);
        const forks = staleCachedRepos.filter(repo => repo.fork);
        setRepositories(originalRepos);
        setContributions(forks);
        setLoading(false);
        return;
      }

      // Last-resort fallback data if nothing cached exists.
      const fallbackRepos = [
        {
          id: 1,
          name: "uncletyrone.github.io",
          full_name: "UncleTyrone/uncletyrone.github.io",
          description: "Personal portfolio website showcasing projects and skills",
          html_url: "https://github.com/UncleTyrone/uncletyrone.github.io",
          language: "JavaScript",
          stargazers_count: 0,
          forks_count: 0,
          subscribers_count: 0,
          fork: false,
          updated_at: new Date().toISOString()
        }
      ];
      
      setRepositories(fallbackRepos);
      setContributions([]);
    }

    setLoading(false);
  };

  const formatLanguage = (language) => {
    if (!language) return 'Other';
    return language;
  };

  const getRepositoryLanguages = (repository) => {
    // Return the primary language or empty array
    return repository.language ? [repository.language] : [];
  };

  const getLanguageColor = (language) => {
    const colors = {
      javascript: '#f1e05a',
      typescript: '#3178c6',
      python: '#3776ab',
      java: '#d4af37',
      lua: '#3b82f6',
      luau: '#3b82f6',
      'c++': '#f34b7d',
      c: '#555555',
      'c#': '#4CAF50',
      go: '#00add8',
      rust: '#dea584',
      php: '#4f5d95',
      ruby: '#701516',
      swift: '#fa7343',
      kotlin: '#a97bff',
      dart: '#00B4AB',
      scala: '#c22d40',
      r: '#198CE7',
      elixir: '#6e4a7e',
      erlang: '#B83998',
      haskell: '#5e5086',
      clojure: '#db5855',
      'f#': '#b845fc',
      ocaml: '#ef7a08',
      nim: '#ffc200',
      zig: '#ec915c',
      julia: '#a270ba',
      perl: '#0298c3',
      groovy: '#4298b8',
      'objective-c': '#438eff',
      'objective-c++': '#6866fb',
      'visual basic .net': '#945db7',
      assembly: '#6e4c13',
      html: '#e34c26',
      css: '#1572b6',
      scss: '#c6538c',
      sass: '#a53b70',
      less: '#1d365d',
      stylus: '#ff6347',
      vue: '#41b883',
      svelte: '#ff3e00',
      astro: '#ff5d01',
      shell: '#89e051',
      bash: '#89e051',
      zsh: '#89e051',
      powershell: '#012456',
      batchfile: '#c1f12e',
      dockerfile: '#384d54',
      makefile: '#427819',
      cmake: '#da3434',
      nix: '#7e7eff',
      hcl: '#844fba',
      terraform: '#844fba',
      yaml: '#cb171e',
      toml: '#9c4221',
      ini: '#d1dbe0',
      xml: '#0060ac',
      json: '#292929',
      markdown: '#083fa1',
      tex: '#3d6117',
      latex: '#3d6117',
      sql: '#e38c00',
      'jupyter notebook': '#da5b0b',
      shaderlab: '#222c37',
      glsl: '#5686a5',
      'vim script': '#199f4b',
      'react jsx': '#61dafb',
      'react tsx': '#61dafb',
      matlab: '#e16737',
      haxe: '#df7900',
      gdscript: '#355570',
      fortran: '#4d41b1',
      cobol: '#005ca5',
      pascal: '#e3f171',
      ada: '#02f88c',
      lisp: '#3fb68b',
      scheme: '#1e4aec',
      racket: '#3c5caa',
      prolog: '#74283c',
      solidity: '#AA6746',
      vhdl: '#adb2cb',
      verilog: '#b2b7f8',
      apex: '#1797c0',
      'common lisp': '#3fb68b',
      plaintext: '#9ca3af',
      'plain text': '#9ca3af',
      misc: '#9ca3af',
      other: '#6c757d'
    };

    const normalized = (language || 'other').toLowerCase().trim();
    const aliases = {
      js: 'javascript',
      ts: 'typescript',
      jsx: 'react jsx',
      tsx: 'react tsx',
      sh: 'bash',
      md: 'markdown',
      yml: 'yaml',
      rb: 'ruby',
      rs: 'rust',
      ps1: 'powershell',
      txt: 'plain text'
    };

    const key = aliases[normalized] || normalized;
    if (colors[key]) return colors[key];

    // Deterministic fallback so every unknown language still gets a stable color.
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 62%, 52%)`;
  };

  if (loading) {
    return (
      <div className="repositories-container">
        <section className="repositories-section">
          <h2 className="section-title">Loading...</h2>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="repositories-container">
        <section className="repositories-section">
          <h2 className="section-title">Error loading repositories</h2>
          <p style={{ color: '#b3b3b3', textAlign: 'center' }}>{error}</p>
        </section>
      </div>
    );
  }

  const currentData = activeTab === 'repositories' ? repositories : contributions;
  const tabTitle = activeTab === 'repositories' ? 'Repositories' : 'Contributions';

  return (
    <div className="repositories-container">
      <section className="repositories-section">
        <h2 className="section-title">{tabTitle}</h2>
        
        <div className="toggle-container">
          <div className="toggle-slider">
            <button
              className={`toggle-option ${activeTab === 'repositories' ? 'active' : ''}`}
              onClick={() => setActiveTab('repositories')}
            >
              Repositories
            </button>
            <button
              className={`toggle-option ${activeTab === 'contributions' ? 'active' : ''}`}
              onClick={() => setActiveTab('contributions')}
            >
              Contributions
            </button>
          </div>
        </div>


        <div className="repositories-grid">
          {currentData.length === 0 ? (
            <div style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center', 
              color: '#b3b3b3',
              padding: '2rem'
            }}>
              No {activeTab} found.
            </div>
          ) : (
            currentData.map((repo) => (
              <RepositoryCard
                key={repo.id}
                repository={repo}
                formatLanguage={formatLanguage}
                getLanguageColor={getLanguageColor}
                getRepositoryLanguages={getRepositoryLanguages}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default RepositoriesSection;
