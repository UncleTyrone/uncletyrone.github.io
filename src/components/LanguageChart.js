import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const LanguageChart = ({ repositories }) => {
  const [languageData, setLanguageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!repositories || repositories.length === 0) {
      setLoading(false);
      return;
    }

    // Count languages from repositories
    const languageCounts = {};
    
    repositories.forEach(repo => {
      if (repo.language) {
        languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      } else {
        // Handle repositories without a primary language
        languageCounts['Other'] = (languageCounts['Other'] || 0) + 1;
      }
    });

    // Convert to chart data
    const labels = Object.keys(languageCounts);
    const data = Object.values(languageCounts);
    
    // Define colors for each language
    const getLanguageColor = (language) => {
      const colors = {
        'JavaScript': '#f1e05a',
        'TypeScript': '#3178c6',
        'Python': '#3776ab',
        'Java': '#d4af37',
        'C++': '#f34b7d',
        'C#': '#4CAF50',
        'Go': '#00add8',
        'Rust': '#dea584',
        'PHP': '#4f5d95',
        'Ruby': '#701516',
        'Swift': '#fa7343',
        'Kotlin': '#a97bff',
        'HTML': '#e34c26',
        'CSS': '#1572b6',
        'Shell': '#89e051',
        'Other': '#9ca3af'
      };
      return colors[language] || '#6c757d';
    };

    const backgroundColors = labels.map(lang => getLanguageColor(lang));
    const borderColors = labels.map(lang => getLanguageColor(lang));

    setLanguageData({
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
          hoverBorderWidth: 3,
        },
      ],
    });
    
    setLoading(false);
  }, [repositories]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#ffffff',
          font: {
            family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
            size: 12,
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} repository${value !== 1 ? 'ies' : ''} (${percentage}%)`;
          }
        }
      },
    },
    elements: {
      arc: {
        borderWidth: 2,
      },
    },
  };

  if (loading) {
    return (
      <div className="language-chart-container">
        <h3 className="chart-title">Language Distribution</h3>
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <p>Loading language statistics...</p>
        </div>
      </div>
    );
  }

  if (!languageData || languageData.labels.length === 0) {
    return (
      <div className="language-chart-container">
        <h3 className="chart-title">Language Distribution</h3>
        <div className="chart-no-data">
          <p>No language data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="language-chart-container">
      <h3 className="chart-title">Language Distribution</h3>
      <div className="chart-wrapper">
        <Pie data={languageData} options={options} />
      </div>
      <div className="chart-stats">
        <p className="total-repos">
          Total Repositories: {repositories.length}
        </p>
        <p className="unique-languages">
          Languages Used: {languageData.labels.length}
        </p>
      </div>
    </div>
  );
};

export default LanguageChart;
