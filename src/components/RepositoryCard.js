import React, { useEffect, useState } from 'react';
import BuildWidget from './BuildWidget';
import MiniLanguageChart from './MiniLanguageChart';
import FileStructure from './FileStructure';
import './MiniLanguageChart.css';
import { fetchGitHub } from '../utils/githubApi';

const RepositoryCard = ({ repository, getLanguageColor }) => {
  const [watcherCount, setWatcherCount] = useState(
    typeof repository.subscribers_count === 'number' ? repository.subscribers_count : null
  );

  useEffect(() => {
    const fetchWatcherCount = async () => {
      if (!repository?.full_name) return;

      const cacheKey = `repo-watchers-${repository.full_name}`;
      const cacheTimeKey = `${cacheKey}-time`;
      const now = Date.now();

      try {
        const cachedCount = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(cacheTimeKey);

        if (cachedCount && cachedTime && now - parseInt(cachedTime, 10) < 43200000) {
          setWatcherCount(parseInt(cachedCount, 10));
          return;
        }

        const response = await fetchGitHub(`/repos/${repository.full_name}`);

        if (response.ok) {
          const details = await response.json();
          const subscribers = typeof details.subscribers_count === 'number' ? details.subscribers_count : 0;
          setWatcherCount(subscribers);
          localStorage.setItem(cacheKey, subscribers.toString());
          localStorage.setItem(cacheTimeKey, now.toString());
        }
      } catch (error) {
        console.warn(`Failed to fetch watcher count for ${repository.full_name}:`, error);
      }
    };

    fetchWatcherCount();
  }, [repository?.full_name]);

  return (
    <div className="repository-card">
      <h3 className="repository-title">
        <a 
          href={repository.html_url} 
          target="_blank" 
          rel="noopener noreferrer"
        >
          {repository.name}
        </a>
      </h3>
      
      <div className="repository-divider"></div>
      
      <p className="repository-description">
        {repository.description || 'No description available'}
      </p>
      
      {/* File Structure Visualization */}
      <FileStructure repository={repository} />
      
      {/* Stats Row - Above View Project Button */}
      {(repository.stargazers_count > 0 || repository.forks_count > 0 || (watcherCount ?? 0) > 0) && (
        <div style={{ 
          display: 'flex', 
          gap: '0.75rem', 
          fontSize: '0.8rem', 
          color: '#b3b3b3',
          alignItems: 'center',
          marginBottom: '1rem',
          justifyContent: 'center'
        }}>
          {repository.stargazers_count > 0 && (
            <span title={`${repository.stargazers_count} stars`}>
              ⭐ {repository.stargazers_count}
            </span>
          )}
          {repository.forks_count > 0 && (
            <span title={`${repository.forks_count} forks`}>
              🍴 {repository.forks_count}
            </span>
          )}
          {(watcherCount ?? 0) > 0 && (
            <span title={`${watcherCount} watchers`}>
              👀 {watcherCount}
            </span>
          )}
        </div>
      )}

      {/* Bottom Row: View Project Button and Languages */}
      <div className="repository-languages">
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '60px'
        }}>
          {/* Left side: View Project Button */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center'
          }}>
            <a
              href={repository.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="view-project-btn"
            >
              View Project
            </a>
          </div>
          
          {/* Right side: Mini Language Chart */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <MiniLanguageChart
              repository={repository}
              getLanguageColor={getLanguageColor}
            />
          </div>
        </div>
      </div>
      
      <BuildWidget repository={repository} />
    </div>
  );
};

export default RepositoryCard;
