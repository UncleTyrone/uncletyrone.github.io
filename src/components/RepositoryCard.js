import React from 'react';
import BuildWidget from './BuildWidget';
import MiniLanguageChart from './MiniLanguageChart';
import './MiniLanguageChart.css';

const RepositoryCard = ({ repository, formatLanguage, getLanguageColor, getRepositoryLanguages }) => {
  const languages = getRepositoryLanguages(repository);

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
      
      <div className="repository-languages">
        <div style={{ 
          display: 'flex', 
          gap: '0.75rem', 
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          minHeight: '75px'
        }}>
          {/* Mini Language Chart */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            alignItems: 'flex-start',
            flexWrap: 'wrap'
          }}>
            {languages.length > 0 && languages.map((language, index) => (
              <MiniLanguageChart
                key={index}
                repository={repository}
                getLanguageColor={getLanguageColor}
              />
            ))}
          </div>
          
          {/* Stats */}
          {(repository.stargazers_count > 0 || repository.forks_count > 0) && (
            <div style={{ 
              display: 'flex', 
              gap: '0.75rem', 
              fontSize: '0.8rem', 
              color: '#b3b3b3',
              alignItems: 'center',
              alignSelf: 'flex-start',
              marginTop: '0.5rem'
            }}>
              {repository.stargazers_count > 0 && (
                <span>⭐ {repository.stargazers_count}</span>
              )}
              {repository.forks_count > 0 && (
                <span>🍴 {repository.forks_count}</span>
              )}
            </div>
          )}
        </div>
        
        <a
          href={repository.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="view-project-btn"
        >
          View Project
        </a>
      </div>
      
      <BuildWidget repository={repository} />
    </div>
  );
};

export default RepositoryCard;
