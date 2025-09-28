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
    try {
      setLoading(true);
      
      // Fetch user's public repositories with retry logic
      let reposResponse;
      let retries = 3;
      
      while (retries > 0) {
        reposResponse = await fetch('https://api.github.com/users/UncleTyrone/repos?sort=updated&per_page=100', {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'UncleTyrone-Portfolio'
          }
        });
        
        if (reposResponse.ok) {
          break;
        } else if (reposResponse.status === 403) {
          // Rate limited, wait and retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          retries--;
        } else {
          throw new Error(`GitHub API error: ${reposResponse.status} ${reposResponse.statusText}`);
        }
      }
      
      if (!reposResponse.ok) {
        throw new Error('GitHub API rate limit exceeded. Please try again later.');
      }
      
      const reposData = await reposResponse.json();
      
      // Filter out forks and get only original repositories
      const originalRepos = reposData.filter(repo => !repo.fork);
      setRepositories(originalRepos);

      // For contributions, we'll fetch repositories where the user has contributed
      // This is a simplified approach - in reality, getting contribution data is more complex
      const forks = reposData.filter(repo => repo.fork);
      setContributions(forks);

      setLoading(false);
    } catch (err) {
      console.error('Repository fetch error:', err);
      setError(`Failed to load repositories: ${err.message}`);
      setLoading(false);
    }
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
