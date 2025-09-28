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

      try {
        console.log(`Fetching languages for repository: ${repository.full_name}`);
        const response = await fetch(`https://api.github.com/repos/${repository.full_name}/languages`);
        console.log(`Language API response status for ${repository.full_name}:`, response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Language data for ${repository.full_name}:`, data);
          const languageNames = Object.keys(data);
          
          if (languageNames.length > 0) {
            setLanguages(languageNames);
            setLanguageData(data);
            console.log(`Set languages for ${repository.full_name}:`, languageNames);
          } else {
            // Fallback to primary language or 'Other'
            const fallbackLang = repository.language || 'Other';
            setLanguages([fallbackLang]);
            setLanguageData({ [fallbackLang]: 100 });
            console.log(`No languages found, using fallback for ${repository.full_name}:`, fallbackLang);
          }
        } else {
          console.warn(`Language API failed for ${repository.full_name}:`, response.status);
          // Fallback to primary language
          const fallbackLang = repository.language || 'Other';
          setLanguages([fallbackLang]);
          setLanguageData({ [fallbackLang]: 100 });
        }
      } catch (error) {
        console.error(`Failed to fetch repository languages for ${repository.full_name}:`, error);
        // Fallback to primary language
        const fallbackLang = repository.language || 'Other';
        setLanguages([fallbackLang]);
        setLanguageData({ [fallbackLang]: 100 });
      }
      
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
      if (elements.length > 0) {
        setShowTooltip(true);
      } else {
        setShowTooltip(false);
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
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="chart-container">
          <Pie ref={chartRef} data={chartData} options={options} />
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
      
      {/* Custom tooltip that appears outside container */}
      {showTooltip && (
        <div 
          className="custom-tooltip"
          style={{
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translateX(-50%) translateY(-100%)',
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
    </>
  );
};

export default MiniLanguageChart;
