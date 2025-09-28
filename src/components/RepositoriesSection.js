import React, { useState, useEffect } from 'react';
import RepositoryCard from './RepositoryCard';

const RepositoriesSection = () => {
  const [activeTab, setActiveTab] = useState('repositories');
  const [repositories, setRepositories] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    setLoading(true);
    setError(null);
    
    // Try to get cached data first
    const cachedData = localStorage.getItem('github-repos-cache');
    const cacheTime = localStorage.getItem('github-repos-cache-time');
    const now = Date.now();
    
    // Use cache if it's less than 10 minutes old
    if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 600000) {
      try {
        const reposData = JSON.parse(cachedData);
        const originalRepos = reposData.filter(repo => !repo.fork);
        const forks = reposData.filter(repo => repo.fork);
        setRepositories(originalRepos);
        setContributions(forks);
        setLoading(false);
        return;
      } catch (cacheError) {
        console.warn('Failed to parse cached data:', cacheError);
        // Continue to fetch fresh data
      }
    }
    
    // Fallback repository data in case API fails
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
        fork: false,
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        name: "uncletyronepics",
        full_name: "UncleTyrone/uncletyronepics",
        description: "Collection of images and assets",
        html_url: "https://github.com/UncleTyrone/uncletyronepics",
        language: null,
        stargazers_count: 0,
        forks_count: 0,
        fork: false,
        updated_at: new Date().toISOString()
      }
    ];
    
    // Try to fetch from GitHub API
    try {
      const reposResponse = await fetch('https://api.github.com/users/UncleTyrone/repos?sort=updated&per_page=50', {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'UncleTyrone-Portfolio'
        }
      });
      
      if (reposResponse.ok) {
        const reposData = await reposResponse.json();
        
        // Cache the data
        localStorage.setItem('github-repos-cache', JSON.stringify(reposData));
        localStorage.setItem('github-repos-cache-time', now.toString());
        
        // Filter out forks and get only original repositories
        const originalRepos = reposData.filter(repo => !repo.fork);
        setRepositories(originalRepos);

        // For contributions, we'll fetch repositories where the user has contributed
        const forks = reposData.filter(repo => repo.fork);
        setContributions(forks);
      } else {
        throw new Error(`GitHub API error: ${reposResponse.status}`);
      }
    } catch (apiError) {
      console.warn('GitHub API failed, using fallback data:', apiError.message);
      
      // Use fallback data
      setRepositories(fallbackRepos);
      setContributions([]);
      
      // Cache fallback data
      localStorage.setItem('github-repos-cache', JSON.stringify(fallbackRepos));
      localStorage.setItem('github-repos-cache-time', now.toString());
    }

    setLoading(false);
  };

  const formatLanguage = (language) => {
    if (!language) return 'Other';
    return language;
  };

  const getRepositoryLanguages = (repository) => {
    // Special case for uncletyronepics - add Misc tag
    if (repository.name === 'uncletyronepics') {
      return ['Misc'];
    }
    
    // Return the primary language or empty array
    return repository.language ? [repository.language] : [];
  };

  const getLanguageColor = (language) => {
    const colors = {
      'JavaScript': '#f1e05a',
      'TypeScript': '#3178c6',
      'Python': '#3776ab',
      'Java': '#d4af37',
      'C++': '#f34b7d',
      'C#': '#4CAF50',
      'Go': '#00add8',
      'Rust': '#dea584',
      'PHP': '#4f5d95',
      'Ruby': '#701516',
      'Swift': '#fa7343',
      'Kotlin': '#a97bff',
      'HTML': '#e34c26',
      'CSS': '#1572b6',
      'Shell': '#89e051',
      'Misc': '#9ca3af',
      'Other': '#6c757d'
    };
    return colors[language] || colors['Other'];
  };

  if (loading) {
    return (
      <section className="repositories-section">
        <h2 className="section-title">Loading...</h2>
      </section>
    );
  }

  if (error) {
    return (
      <section className="repositories-section">
        <h2 className="section-title">Error loading repositories</h2>
        <p style={{ color: '#b3b3b3', textAlign: 'center' }}>{error}</p>
      </section>
    );
  }

  const currentData = activeTab === 'repositories' ? repositories : contributions;
  const tabTitle = activeTab === 'repositories' ? 'Repositories' : 'Contributions';

  return (
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
  );
};

export default RepositoriesSection;
