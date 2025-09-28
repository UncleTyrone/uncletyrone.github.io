import React from 'react';
import BuildWidget from './BuildWidget';
import MiniLanguageChart from './MiniLanguageChart';
import FileStructure from './FileStructure';
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
      
      {/* File Structure Visualization */}
      <FileStructure repository={repository} />
      
      <div className="repository-languages">
        <div style={{ 
          display: 'flex', 
          gap: '0.75rem', 
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '75px'
        }}>
          {/* Left side: View Project Button and Stats */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            {/* View Project Button */}
            <a
              href={repository.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="view-project-btn"
            >
              View Project
            </a>
            
            {/* Stats */}
            {(repository.stargazers_count > 0 || repository.forks_count > 0 || repository.subscribers_count > 0) && (
              <div style={{ 
                display: 'flex', 
                gap: '0.75rem', 
                fontSize: '0.8rem', 
                color: '#b3b3b3',
                alignItems: 'center'
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
                {repository.subscribers_count > 0 && (
                  <span title={`${repository.subscribers_count} watchers`}>
                    👀 {repository.subscribers_count}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Right side: Mini Language Chart */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            alignItems: 'center',
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
        </div>
      </div>
      
      <BuildWidget repository={repository} />
    </div>
  );
};

export default RepositoryCard;
