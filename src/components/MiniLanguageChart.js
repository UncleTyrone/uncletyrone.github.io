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

  // Add global function to clear language cache (for debugging)
  useEffect(() => {
    window.clearLanguageCache = () => {
      const keys = Object.keys(localStorage);
      const languageKeys = keys.filter(key => key.startsWith('languages-') || key.includes('languages'));
      languageKeys.forEach(key => localStorage.removeItem(key));
      console.log('Language cache cleared! Refreshing page...');
      window.location.reload();
    };
  }, []);

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

      // Try to fetch real language data from GitHub API
      try {
        console.log('Fetching language data for:', repository.full_name);
        
        const languagesResponse = await fetch(`https://api.github.com/repos/${repository.full_name}/languages`, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'UncleTyrone-Portfolio'
          }
        });
        
        if (languagesResponse.ok) {
          const languageData = await languagesResponse.json();
          console.log('Successfully fetched language data:', languageData);
          
          const languages = Object.keys(languageData);
          
          if (languages.length > 0) {
            setLanguages(languages);
            setLanguageData(languageData);
            
            // Cache the real data
            localStorage.setItem(cacheKey, JSON.stringify({ languages, languageData }));
            localStorage.setItem(`${cacheKey}-time`, now.toString());
            
            console.log('Language data cached successfully');
          } else {
            throw new Error('No language data available');
          }
        } else if (languagesResponse.status === 403) {
          console.warn('GitHub API rate limit exceeded. Using fallback data.');
          throw new Error('Rate limit exceeded');
        } else {
          console.warn('Failed to fetch language data:', languagesResponse.status);
          throw new Error('API request failed');
        }
      } catch (apiError) {
        console.error('Error fetching language data:', apiError);
        
        // Use conservative fallback behavior:
        // - Prefer GitHub's primary language if present
        // - Otherwise show "Other" instead of guessed languages
        const generateFallbackLanguage = (repo) => {
          if (repo.language) {
            return {
              languages: [repo.language],
              languageData: { [repo.language]: 100 }
            };
          }

          return {
            languages: ['Other'],
            languageData: { Other: 100 }
          };
        };
        
        const fallbackData = generateFallbackLanguage(repository);
        setLanguages(fallbackData.languages);
        setLanguageData(fallbackData.languageData);
        
        // Cache the fallback data
        localStorage.setItem(cacheKey, JSON.stringify(fallbackData));
        localStorage.setItem(`${cacheKey}-time`, now.toString());
      }
      
      setLoading(false);
    };

    fetchRepositoryLanguages();
  }, [repository]);
  
  const getLanguageStats = () => {
    const totalBytes = Object.values(languageData).reduce((sum, bytes) => sum + bytes, 0);
    return languages.map((lang) => {
      const bytes = languageData[lang] || 0;
      const percentage = totalBytes > 0 ? (bytes / totalBytes) * 100 : 0;
      return { lang, bytes, percentage };
    });
  };

  const languageStats = getLanguageStats();

  // Create data for the mini chart
  const chartData = {
    labels: languages,
    datasets: [
      {
        // Use raw byte counts to preserve tiny language slivers.
        data: Object.keys(languageData).length > 0 ? languageStats.map((item) => item.bytes) : languages.map(() => 1),
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
                  {languageStats.map(({ lang, percentage }, index) => {
                    const formattedPercentage =
                      percentage > 0 && percentage < 0.1 ? '<0.1' : percentage.toFixed(1);

                    return (
                      <div key={index} className="tooltip-language">
                        <span 
                          className="tooltip-color" 
                          style={{ backgroundColor: getLanguageColor(lang) }}
                        ></span>
                        <span className="tooltip-language-name">{lang}</span>
                        <span className="tooltip-percentage">{formattedPercentage}%</span>
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
                
                // For single languages, just show the language name (truncated if too long)
                const displayName = primaryLang.length > 6 ? primaryLang.substring(0, 6) + '...' : primaryLang;
                return displayName;
              })()
          }
        </div>
      </div>
    </>
  );
};

export default MiniLanguageChart;
