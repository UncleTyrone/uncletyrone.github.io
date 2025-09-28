import React, { useState, useEffect } from 'react';
import './ReleaseCards.css';

const ReleaseCards = ({ username = 'UncleTyrone' }) => {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        setLoading(true);
        
        // Fetch releases from GitHub API
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);
        const repos = await response.json();
        
        console.log('Fetched repositories:', repos.length);
        
        if (!response.ok) {
          throw new Error('Failed to fetch repositories');
        }

        // Get releases from all repositories
        const releasePromises = repos.map(async (repo) => {
          try {
            const releaseResponse = await fetch(`https://api.github.com/repos/${username}/${repo.name}/releases?per_page=5`);
            if (releaseResponse.ok) {
              const releases = await releaseResponse.json();
              return releases.map(release => ({
                ...release,
                repoName: repo.name,
                repoUrl: repo.html_url
              }));
            }
          } catch (error) {
            console.log(`No releases found for ${repo.name}`);
          }
          return [];
        });

        const allReleases = (await Promise.all(releasePromises)).flat();
        
        console.log('All releases found:', allReleases.length);
        console.log('Releases:', allReleases);
        
        // Sort releases by date (newest first)
        allReleases.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
        
        // Find latest stable and nightly releases
        const latestStable = allReleases.find(release => 
          !release.prerelease && !release.draft && !release.tag_name.toLowerCase().includes('nightly')
        );
        
        const latestNightly = allReleases.find(release => 
          release.tag_name.toLowerCase().includes('nightly') || 
          release.tag_name.toLowerCase().includes('dev') ||
          release.tag_name.toLowerCase().includes('beta') ||
          release.tag_name.toLowerCase().includes('alpha')
        );
        
        console.log('Latest stable:', latestStable);
        console.log('Latest nightly:', latestNightly);

        const filteredReleases = [];
        if (latestStable) filteredReleases.push(latestStable);
        if (latestNightly && latestNightly !== latestStable) filteredReleases.push(latestNightly);

        setReleases(filteredReleases);
      } catch (error) {
        console.error('Error fetching releases:', error);
        setError('Failed to load releases');
      } finally {
        setLoading(false);
      }
    };

    fetchReleases();
  }, [username]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getReleaseType = (release) => {
    const tag = release.tag_name.toLowerCase();
    if (tag.includes('nightly') || tag.includes('dev') || tag.includes('beta') || tag.includes('alpha')) {
      return 'nightly';
    }
    return 'stable';
  };

  const getReleaseTypeColor = (type) => {
    return type === 'nightly' ? '#ff6b35' : '#4ade80';
  };

  const getReleaseTypeLabel = (type) => {
    return type === 'nightly' ? 'Nightly' : 'Latest';
  };

  if (loading) {
    return (
      <div className="release-cards-container">
        <h2 className="section-title">Latest Releases</h2>
        <div className="release-cards-loading">
          <div className="loading-spinner"></div>
          <p>Loading releases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="release-cards-container">
        <h2 className="section-title">Latest Releases</h2>
        <div className="release-cards-error">
          <p>Error loading releases: {error}</p>
        </div>
      </div>
    );
  }

  if (releases.length === 0) {
    return (
      <div className="release-cards-container">
        <h2 className="section-title">Latest Releases</h2>
        <div className="release-cards-error">
          <p>No releases found in your repositories</p>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>
            Create a release in any of your GitHub repositories to see it here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="release-cards-container">
      <h2 className="section-title">Latest Releases</h2>
      <div className="release-cards-grid">
        {releases.map((release) => {
          const releaseType = getReleaseType(release);
          const typeColor = getReleaseTypeColor(releaseType);
          const typeLabel = getReleaseTypeLabel(releaseType);
          
          return (
            <div key={release.id} className="release-card">
              <div className="release-header">
                <div className="release-type-badge" style={{ backgroundColor: typeColor }}>
                  {typeLabel}
                </div>
                <div className="release-repo">
                  <a href={release.repoUrl} target="_blank" rel="noopener noreferrer">
                    {release.repoName}
                  </a>
                </div>
              </div>
              
              <div className="release-content">
                <h3 className="release-title">
                  <a href={release.html_url} target="_blank" rel="noopener noreferrer">
                    {release.tag_name}
                  </a>
                </h3>
                
                {release.name && release.name !== release.tag_name && (
                  <p className="release-name">{release.name}</p>
                )}
                
                <p className="release-date">{formatDate(release.published_at)}</p>
                
                {release.body && (
                  <div className="release-description">
                    {release.body.length > 150 
                      ? `${release.body.substring(0, 150)}...` 
                      : release.body
                    }
                  </div>
                )}
              </div>
              
              <div className="release-footer">
                <div className="release-stats">
                  <span className="download-count">
                    📥 {release.assets.reduce((total, asset) => total + asset.download_count, 0)} downloads
                  </span>
                </div>
                
                <div className="release-actions">
                  <a 
                    href={release.html_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="release-button primary"
                  >
                    View Release
                  </a>
                  
                  {release.assets.length > 0 && (
                    <a 
                      href={release.assets[0].browser_download_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="release-button secondary"
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReleaseCards;
