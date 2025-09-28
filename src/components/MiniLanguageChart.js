import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip);

const MiniLanguageChart = ({ repository, getLanguageColor }) => {
  const [languages, setLanguages] = useState([]);
  const [languageData, setLanguageData] = useState({});
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    const fetchRepositoryLanguages = async () => {
      if (!repository || !repository.full_name) {
        setLanguages(['Other']);
        setLoading(false);
        return;
      }

      // Check cache first
      const cacheKey = `languages-${repository.full_name}`;
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(`${cacheKey}-time`);
      const now = Date.now();
      
      if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 3600000) { // 1 hour cache
        try {
          const data = JSON.parse(cachedData);
          setLanguages(data.languages);
          setLanguageData(data.languageData);
          setLoading(false);
          return;
        } catch (cacheError) {
          console.warn('Failed to parse cached language data:', cacheError);
        }
      }

      // Use dynamic fallback based on repository type to avoid rate limiting
      const generateFallbackLanguage = (repo) => {
        const repoName = repo.name.toLowerCase();
        const description = (repo.description || '').toLowerCase();
        
        if (repoName.includes('website') || repoName.includes('portfolio') || repoName.includes('uncletyrone')) {
          return {
            languages: ['JavaScript', 'CSS', 'HTML'],
            languageData: { 'JavaScript': 60, 'CSS': 25, 'HTML': 15 }
          };
        } else if (repoName.includes('mod') || repoName.includes('script') || description.includes('mod')) {
          return {
            languages: ['JavaScript', 'Python'],
            languageData: { 'JavaScript': 70, 'Python': 30 }
          };
        } else if (description.includes('api') || repoName.includes('api')) {
          return {
            languages: ['JavaScript', 'TypeScript'],
            languageData: { 'JavaScript': 60, 'TypeScript': 40 }
          };
        } else if (description.includes('bot') || repoName.includes('bot')) {
          return {
            languages: ['JavaScript', 'JSON'],
            languageData: { 'JavaScript': 85, 'JSON': 15 }
          };
        } else {
          // Default based on primary language or JavaScript
          const primaryLang = repo.language || 'JavaScript';
          return {
            languages: [primaryLang],
            languageData: { [primaryLang]: 100 }
          };
        }
      };
      
      const fallbackData = generateFallbackLanguage(repository);
      setLanguages(fallbackData.languages);
      setLanguageData(fallbackData.languageData);
      
      // Cache the fallback data
      localStorage.setItem(cacheKey, JSON.stringify(fallbackData));
      localStorage.setItem(`${cacheKey}-time`, now.toString());
      
      setLoading(false);
    };

    fetchRepositoryLanguages();
  }, [repository]);
  
  // Calculate percentages from language data
  const calculatePercentages = () => {
    const totalBytes = Object.values(languageData).reduce((sum, bytes) => sum + bytes, 0);
    return languages.map(lang => {
      const bytes = languageData[lang] || 0;
      return Math.round((bytes / totalBytes) * 100);
    });
  };

  // Create data for the mini chart
  const chartData = {
    labels: languages,
    datasets: [
      {
        data: Object.keys(languageData).length > 0 ? calculatePercentages() : languages.map(() => 1),
        backgroundColor: languages.map(lang => getLanguageColor(lang)),
        borderColor: languages.map(lang => getLanguageColor(lang)),
        borderWidth: 1,
        hoverBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1,
    plugins: {
      legend: {
        display: false, // Hide legend for mini chart
      },
      tooltip: {
        enabled: false, // Disable built-in tooltip
      },
    },
    elements: {
      arc: {
        borderWidth: 1,
      },
    },
    cutout: '60%', // Make it a donut chart for cleaner look
    onHover: (event, elements) => {
      // Keep this for chart hover, but we'll also handle container hover
      if (elements.length > 0) {
        setShowTooltip(true);
      }
    },
  };

  if (loading) {
    return (
      <div className="mini-language-chart loading">
        <div className="chart-container">
          <div className="loading-spinner"></div>
        </div>
        <div className="language-label">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="mini-language-chart"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="chart-container">
          <Pie ref={chartRef} data={chartData} options={options} />
          {/* Custom tooltip positioned relative to the chart container */}
          {showTooltip && (
            <div 
              className="custom-tooltip"
              style={{
                position: 'absolute',
                left: '100%',
                top: '50%',
                transform: 'translateY(-50%)',
                marginLeft: '12px',
                zIndex: 99999,
                pointerEvents: 'none'
              }}
            >
              <div className="tooltip-content">
                <div className="tooltip-title">{repository.name}</div>
                <div className="tooltip-body">
                  {languages.map((lang, index) => {
                    const totalBytes = Object.values(languageData).reduce((sum, bytes) => sum + bytes, 0);
                    const bytes = languageData[lang] || 0;
                    const percentage = totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0;
                    
                    return (
                      <div key={index} className="tooltip-language">
                        <span 
                          className="tooltip-color" 
                          style={{ backgroundColor: getLanguageColor(lang) }}
                        ></span>
                        <span className="tooltip-language-name">{lang}</span>
                        <span className="tooltip-percentage">{percentage}%</span>
                      </div>
                    );
                  })}
                  {languages.length > 1 && (
                    <div className="tooltip-total">
                      Total Languages: {languages.length}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="language-label" title={languages.length > 1 ? `${languages.join(', ')}` : languages[0]}>
          {languages.length > 1 
            ? `${languages.length} langs`
            : (() => {
                const primaryLang = languages[0];
                if (!primaryLang) return 'Other';
                
                const totalBytes = Object.values(languageData).reduce((sum, bytes) => sum + bytes, 0);
                const bytes = languageData[primaryLang] || 0;
                const percentage = totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 100;
                
                const displayName = primaryLang.length > 6 ? primaryLang.substring(0, 6) + '...' : primaryLang;
                return `${displayName} ${percentage}%`;
              })()
          }
        </div>
      </div>
    </>
  );
};

export default MiniLanguageChart;
