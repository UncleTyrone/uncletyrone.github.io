import React, { useState, useEffect, useCallback } from 'react';
import './BuildWidget.css';

const BuildWidget = ({ repository }) => {
  console.log('BuildWidget rendered with repository:', repository?.name, repository?.full_name);
  const [latestRelease, setLatestRelease] = useState(null);
  const [latestNightly, setLatestNightly] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add global function to clear build cache (for debugging)
  useEffect(() => {
    window.clearBuildCache = () => {
      const keys = Object.keys(localStorage);
      const buildKeys = keys.filter(key => key.startsWith('build-data-') || key.includes('build-data'));
      buildKeys.forEach(key => localStorage.removeItem(key));
      console.log('Build cache cleared! Refreshing page...');
      window.location.reload();
    };
  }, []);

  const fetchBuildData = useCallback(async () => {
    console.log('BuildWidget fetchBuildData called with repository:', repository);
    if (!repository || !repository.full_name) {
      console.log('No repository or full_name, skipping fetch');
      setLoading(false);
      return;
    }

    // Check cache first
    const cacheKey = `build-data-${repository.full_name}`;
    const cachedData = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(`${cacheKey}-time`);
    const now = Date.now();
    
    if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 3600000) { // 1 hour cache
      try {
        const data = JSON.parse(cachedData);
        console.log('Using cached build data:', data);
        
        // If cached data is null (old fallback), clear cache and fetch fresh
        if (data.latestRelease === null && data.latestNightly === null) {
          console.log('Detected old null cache data, clearing and fetching fresh...');
          localStorage.removeItem(cacheKey);
          localStorage.removeItem(`${cacheKey}-time`);
        } else {
          setLatestRelease(data.latestRelease);
          setLatestNightly(data.latestNightly);
          setLoading(false);
          return;
        }
      } catch (cacheError) {
        console.warn('Failed to parse cached build data:', cacheError);
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(`${cacheKey}-time`);
      }
    }

    // Fetch release data from GitHub API
    try {
      console.log('Fetching release data for:', repository.full_name);
      
      const releasesResponse = await fetch(`https://api.github.com/repos/${repository.full_name}/releases?per_page=5`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'UncleTyrone-Portfolio'
        }
      });
      
      if (releasesResponse.ok) {
        const releases = await releasesResponse.json();
        console.log('Found releases:', releases.length);
        
        // Find latest release and nightly/dev builds
        const latestRelease = releases.find(release => 
          !release.tag_name.toLowerCase().includes('alpha') &&
          !release.tag_name.toLowerCase().includes('beta') &&
          !release.tag_name.toLowerCase().includes('dev') &&
          !release.tag_name.toLowerCase().includes('nightly')
        ) || releases[0] || null;
        
        // Find the most recent beta/alpha/dev/nightly release (not just the first one)
        const preReleaseReleases = releases.filter(release => 
          release.tag_name.toLowerCase().includes('alpha') ||
          release.tag_name.toLowerCase().includes('beta') ||
          release.tag_name.toLowerCase().includes('dev') ||
          release.tag_name.toLowerCase().includes('nightly')
        );
        
        // Sort by published date and get the most recent one
        const latestNightly = preReleaseReleases
          .filter(release => release.published_at) // Only releases with valid dates
          .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))[0] || null;
        
        setLatestRelease(latestRelease);
        setLatestNightly(latestNightly);
        
        // Cache the data
        localStorage.setItem(cacheKey, JSON.stringify({ 
          latestRelease, 
          latestNightly 
        }));
        localStorage.setItem(`${cacheKey}-time`, now.toString());
        
        console.log('Release data cached successfully');
      } else if (releasesResponse.status === 403) {
        console.warn('GitHub API rate limit exceeded. Using cached data or showing fallback.');
        // Don't cache rate limit errors, but also don't fail completely
        setLatestRelease(null);
        setLatestNightly(null);
      } else {
        console.warn('Failed to fetch releases:', releasesResponse.status);
        setLatestRelease(null);
        setLatestNightly(null);
      }
    } catch (apiError) {
      console.error('Error fetching releases:', apiError);
      setLatestRelease(null);
      setLatestNightly(null);
    }

    setLoading(false);
  }, [repository]);

  useEffect(() => {
    fetchBuildData();
  }, [fetchBuildData]);

  const formatDate = (dateString) => {
    if (!dateString) return 'INVALID DATE';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'INVALID DATE';
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.warn('Date formatting error:', error);
      return 'INVALID DATE';
    }
  };

  const getBuildStatus = (build) => {
    if (!build) return 'unknown';
    
    const dateString = build.published_at || build.commit?.commit?.committer?.date;
    if (!dateString) return 'unknown';
    
    try {
      const publishedDate = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(publishedDate.getTime())) {
        return 'unknown';
      }
      
      const daysSince = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSince >= 365) return 'old'; // 1 year+
      if (daysSince >= 30) return 'monthly'; // 1 month+
      return 'recent'; // everything else
    } catch (error) {
      console.warn('Build status calculation error:', error);
      return 'unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'recent': return '#10b981'; // green
      case 'monthly': return '#f59e0b'; // yellow
      case 'old': return '#ef4444'; // red
      case 'unknown': return '#6b7280'; // gray
      default: return '#6b7280'; // gray
    }
  };

  const getBuildType = (build) => {
    if (!build) return 'release';
    
    const tagName = build.tag_name || build.name || '';
    const name = tagName.toLowerCase();
    
    // Check for specific patterns to avoid duplicates
    if (name.includes('alpha')) return 'alpha';
    if (name.includes('beta')) return 'beta';
    if (name.includes('dev')) return 'dev';
    if (name.includes('nightly')) return 'nightly';
    return 'release';
  };

  const getBuildTypeColor = (type) => {
    switch (type) {
      case 'nightly': return '#7c3aed'; // dark purple
      case 'release': return '#ffffff'; // white
      case 'dev': return '#f59e0b'; // yellow
      case 'beta': return '#3b82f6'; // blue
      case 'alpha': return '#ef4444'; // red
      default: return '#ffffff';
    }
  };

  if (loading) {
    return (
      <div className="build-widget">
        <div className="build-widget-header">
          <h4>Build Status</h4>
        </div>
        <div className="build-widget-content">
          <div className="build-loading">Loading builds...</div>
        </div>
      </div>
    );
  }


  return (
    <div className="build-widget">
      <div className="build-widget-header">
        <h4>Build Status</h4>
      </div>
      <div className="build-widget-content">
        <div className="build-items">
          {latestRelease && (
            <div className="build-item">
              <div className="build-item-header">
                <div className="build-type-with-version">
                  <span 
                    className="build-type"
                    style={{ color: getBuildTypeColor(getBuildType(latestRelease)) }}
                  >
                    {getBuildType(latestRelease).charAt(0).toUpperCase() + getBuildType(latestRelease).slice(1)}
                  </span>
                  <span className="build-version" title={latestRelease.tag_name}>
                    {latestRelease.tag_name.replace(/^(beta|alpha|dev|nightly)-/i, '')}
                  </span>
                </div>
                <div 
                  className="build-date"
                  style={{ backgroundColor: getStatusColor(getBuildStatus(latestRelease)) }}
                >
                  {formatDate(latestRelease.published_at)}
                </div>
              </div>
              
              {latestRelease.body && (
                <div className="build-description">
                  {latestRelease.body.length > 150 
                    ? latestRelease.body.substring(0, 150) + '...' 
                    : latestRelease.body
                  }
                </div>
              )}
              
              <div className="build-actions">
                <a 
                  href={latestRelease.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="build-download-btn"
                >
                  Download
                </a>
                {latestRelease.assets && latestRelease.assets.length > 0 && (
                  <div className="build-downloads">
                    📥 {latestRelease.assets.reduce((total, asset) => total + asset.download_count, 0)} downloads
                  </div>
                )}
              </div>
            </div>
          )}

          {latestNightly && latestNightly.tag_name !== latestRelease?.tag_name && (
            <div className="build-item">
              <div className="build-item-header">
                <div className="build-type-with-version">
                  <span 
                    className="build-type"
                    style={{ color: getBuildTypeColor(getBuildType(latestNightly)) }}
                  >
                    {getBuildType(latestNightly).charAt(0).toUpperCase() + getBuildType(latestNightly).slice(1)}
                  </span>
                  <span className="build-version" title={latestNightly.tag_name}>
                    {latestNightly.tag_name.replace(/^(beta|alpha|dev|nightly)-/i, '')}
                  </span>
                </div>
                <div 
                  className="build-date"
                  style={{ backgroundColor: getStatusColor(getBuildStatus(latestNightly)) }}
                >
                  {formatDate(latestNightly.published_at)}
                </div>
              </div>
              
              <div className="build-actions">
                <a 
                  href={`https://github.com/${repository.full_name}/releases/tag/${latestNightly.tag_name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="build-download-btn"
                >
                  Download
                </a>
              </div>
            </div>
          )}

          {!latestRelease && !latestNightly && (
            <div className="build-no-data">
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '0.5rem',
                color: '#9ca3af'
              }}>
                <span>📦</span>
                <span>No builds available</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                  Check back later for releases
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuildWidget;

