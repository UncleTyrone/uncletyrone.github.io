import React, { useState, useEffect } from 'react';
import './DiscordWidget.css';

const DiscordWidget = () => {
  const [serverData, setServerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Discord server invite code from your invite link
  const inviteCode = '8DH2mw22k9';

  useEffect(() => {
    const fetchDiscordData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check for cached data first (cache for 5 minutes)
        const cachedData = localStorage.getItem('discord-server-cache');
        const cacheTime = localStorage.getItem('discord-server-cache-time');
        const now = Date.now();
        
        if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 300000) {
          const data = JSON.parse(cachedData);
          setServerData(data);
          setLoading(false);
          return;
        }
        
        // Fetch Discord invite data to get server information
        const response = await fetch(`https://discord.com/api/v10/invites/${inviteCode}?with_counts=true`);
        
        if (response.ok) {
          const data = await response.json();
          setServerData(data);
          
          // Cache the data
          localStorage.setItem('discord-server-cache', JSON.stringify(data));
          localStorage.setItem('discord-server-cache-time', now.toString());
          
          console.log('Discord server data:', data);
        } else {
          console.warn('Failed to fetch Discord data:', response.status);
          setError('Unable to fetch server data');
        }
      } catch (error) {
        console.error('Error fetching Discord data:', error);
        setError('Connection error');
      } finally {
        setLoading(false);
      }
    };

    fetchDiscordData();
  }, []);

  const handleDiscordClick = () => {
    window.open('https://discord.gg/8DH2mw22k9', '_blank');
  };

  return (
    <div className="discord-widget-container">
      <div className="discord-widget">
        <div className="discord-header">
          <div className="discord-icon">
            <img 
              src="https://raw.githubusercontent.com/UncleTyrone/uncletyronepics/refs/heads/main/RescheduledNeuxs.png" 
              alt="Rescheduled Discord Server" 
              className="discord-server-image"
            />
          </div>
          <div className="discord-info">
            <h3>Join the <span className="highlight-rescheduled">Rescheduled</span> Discord!</h3>
            <p>Connect with me and a huge community of awesome Schedule I enthusiasts!</p>
          </div>
        </div>
        
        <div className="discord-stats">
          <div className="stat">
            <span className="stat-number">
              {loading ? '...' : error ? 'Active' : serverData?.approximate_member_count?.toLocaleString() || 'Active'}
            </span>
            <span className="stat-label">Members</span>
          </div>
          <div className="stat">
            <span className="stat-number">
              {loading ? '...' : error ? '24/7' : serverData?.approximate_presence_count?.toLocaleString() || '24/7'}
            </span>
            <span className="stat-label">Online</span>
          </div>
        </div>
        
        <button className="discord-button" onClick={handleDiscordClick}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="discord-button-icon">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          Join Rescheduled Discord
        </button>
      </div>
    </div>
  );
};

export default DiscordWidget;
