import React from 'react';

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
          gap: '0.5rem', 
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {languages.length > 0 && languages.map((language, index) => (
            <span
              key={index}
              className="language-tag"
              style={{ 
                backgroundColor: `${getLanguageColor(language)}20`,
                color: getLanguageColor(language),
                border: `1px solid ${getLanguageColor(language)}40`
              }}
            >
              {formatLanguage(language)}
            </span>
          ))}
          
          {(repository.stargazers_count > 0 || repository.forks_count > 0) && (
            <div style={{ 
              display: 'flex', 
              gap: '0.75rem', 
              fontSize: '0.8rem', 
              color: '#b3b3b3',
              alignItems: 'center'
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
    </div>
  );
};

export default RepositoryCard;
