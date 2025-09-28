import React, { useState, useEffect, useCallback } from 'react';
import './BuildWidget.css';

const BuildWidget = ({ repository }) => {
  const [latestRelease, setLatestRelease] = useState(null);
  const [latestNightly, setLatestNightly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBuildData = useCallback(async () => {
    if (!repository || !repository.full_name) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch latest release
      const releaseResponse = await fetch(`https://api.github.com/repos/${repository.full_name}/releases/latest`);
      if (releaseResponse.ok) {
        const releaseData = await releaseResponse.json();
        setLatestRelease(releaseData);
      }

      // For nightly builds, we'll look for tags with "nightly" or "dev" in the name
      // This is a simplified approach - you might need to adjust based on your tagging strategy
      const tagsResponse = await fetch(`https://api.github.com/repos/${repository.full_name}/tags?per_page=10`);
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        const nightlyTag = tagsData.find(tag => 
          tag.name.toLowerCase().includes('nightly') || 
          tag.name.toLowerCase().includes('dev') ||
          tag.name.toLowerCase().includes('beta')
        );
        if (nightlyTag) {
          setLatestNightly(nightlyTag);
        }
      }

      setLoading(false);
    } catch (err) {
      console.warn(`Failed to fetch build data for ${repository.full_name}:`, err.message);
      setError(null); // Don't show error for individual repos
      setLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    fetchBuildData();
  }, [fetchBuildData]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getBuildStatus = (build) => {
    if (!build) return 'unknown';
    const publishedDate = new Date(build.published_at || build.commit?.commit?.committer?.date);
    const daysSince = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSince >= 365) return 'old'; // 1 year+
    if (daysSince >= 30) return 'monthly'; // 1 month+
    return 'recent'; // everything else
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'recent': return '#10b981'; // green
      case 'monthly': return '#f59e0b'; // yellow
      case 'old': return '#ef4444'; // red
      default: return '#6b7280';
    }
  };

  const getBuildType = (build) => {
    if (!build) return 'release';
    
    const tagName = build.tag_name || build.name || '';
    const name = tagName.toLowerCase();
    
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

  if (error) {
    return (
      <div className="build-widget">
        <div className="build-widget-header">
          <h4>Build Status</h4>
        </div>
        <div className="build-widget-content">
          <div className="build-error">Failed to load builds</div>
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
                  <span className="build-version">{latestRelease.tag_name}</span>
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
                  {latestRelease.body.length > 100 
                    ? latestRelease.body.substring(0, 100) + '...' 
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

          {latestNightly && (
            <div className="build-item">
              <div className="build-item-header">
                <div className="build-type-with-version">
                  <span 
                    className="build-type"
                    style={{ color: getBuildTypeColor(getBuildType(latestNightly)) }}
                  >
                    {getBuildType(latestNightly).charAt(0).toUpperCase() + getBuildType(latestNightly).slice(1)}
                  </span>
                  <span className="build-version">{latestNightly.name}</span>
                </div>
                <div 
                  className="build-date"
                  style={{ backgroundColor: getStatusColor(getBuildStatus(latestNightly)) }}
                >
                  {formatDate(latestNightly.commit?.commit?.committer?.date)}
                </div>
              </div>
              
              <div className="build-actions">
                <a 
                  href={`https://github.com/${repository.full_name}/releases/tag/${latestNightly.name}`}
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
              No builds available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuildWidget;
