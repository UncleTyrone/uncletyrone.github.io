import React, { useState, useEffect } from 'react';
import './FileStructure.css';

const FileStructure = ({ repository }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add global function to clear file structure cache (for debugging)
  useEffect(() => {
    window.clearFileStructureCache = () => {
      const keys = Object.keys(localStorage);
      const fileKeys = keys.filter(key => key.startsWith('file-structure-') || key.includes('file-structure'));
      fileKeys.forEach(key => localStorage.removeItem(key));
      console.log('File structure cache cleared! Refreshing page...');
      window.location.reload();
    };
  }, []);

  useEffect(() => {
    const fetchRepositoryContents = async () => {
      if (!repository || !repository.full_name) {
        setLoading(false);
        return;
      }

      // Check cache first
      const cacheKey = `file-structure-${repository.full_name}`;
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(`${cacheKey}-time`);
      const now = Date.now();
      
      if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 3600000) { // 1 hour cache
        try {
          const data = JSON.parse(cachedData);
          setFiles(data);
          setLoading(false);
          return;
        } catch (cacheError) {
          console.warn('Failed to parse cached file structure data:', cacheError);
        }
      }

      // Try to fetch real repository contents from GitHub API
      try {
        console.log('Fetching repository contents for:', repository.full_name);
        
        const contentsResponse = await fetch(`https://api.github.com/repos/${repository.full_name}/contents?per_page=20`, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'UncleTyrone-Portfolio'
          }
        });
        
        if (contentsResponse.ok) {
          const contents = await contentsResponse.json();
          console.log('Successfully fetched repository contents:', contents.length);
          
          // Filter and format the contents
          const formattedFiles = contents
            .filter(item => !item.name.startsWith('.')) // Hide hidden files
            .slice(0, 12) // Limit to 12 items for display
            .map(item => ({
              name: item.name,
              type: item.type,
              sha: item.sha,
              size: item.size
            }));
          
          setFiles(formattedFiles);
          
          // Cache the real data
          localStorage.setItem(cacheKey, JSON.stringify(formattedFiles));
          localStorage.setItem(`${cacheKey}-time`, now.toString());
          
          console.log('Repository contents cached successfully');
        } else if (contentsResponse.status === 403) {
          console.warn('GitHub API rate limit exceeded. Using fallback data.');
          throw new Error('Rate limit exceeded');
        } else {
          console.warn('Failed to fetch repository contents:', contentsResponse.status);
          throw new Error('API request failed');
        }
      } catch (apiError) {
        console.error('Error fetching repository contents:', apiError);
        
        // Use dynamic fallback data based on repository type
        const generateFallbackFiles = (repo) => {
          const repoName = repo.name.toLowerCase();
          const description = (repo.description || '').toLowerCase();
          
          if (repoName.includes('website') || repoName.includes('portfolio') || repoName.includes('uncletyrone')) {
            return [
              { name: 'src', type: 'dir' },
              { name: 'public', type: 'dir' },
              { name: 'package.json', type: 'file' },
              { name: 'README.md', type: 'file' },
              { name: 'build', type: 'dir' },
              { name: 'assets', type: 'dir' }
            ];
          } else if (repoName.includes('mod') || repoName.includes('script') || description.includes('mod')) {
            return [
              { name: 'src', type: 'dir' },
              { name: 'scripts', type: 'dir' },
              { name: 'config', type: 'dir' },
              { name: 'README.md', type: 'file' },
              { name: 'manifest.json', type: 'file' }
            ];
          } else if (description.includes('api') || repoName.includes('api')) {
            return [
              { name: 'src', type: 'dir' },
              { name: 'routes', type: 'dir' },
              { name: 'models', type: 'dir' },
              { name: 'README.md', type: 'file' },
              { name: 'package.json', type: 'file' }
            ];
          } else if (description.includes('bot') || repoName.includes('bot')) {
            return [
              { name: 'src', type: 'dir' },
              { name: 'commands', type: 'dir' },
              { name: 'events', type: 'dir' },
              { name: 'README.md', type: 'file' },
              { name: 'config.json', type: 'file' }
            ];
          } else {
            // Default for generic repositories
            return [
              { name: 'src', type: 'dir' },
              { name: 'lib', type: 'dir' },
              { name: 'README.md', type: 'file' },
              { name: 'package.json', type: 'file' },
              { name: '.gitignore', type: 'file' }
            ];
          }
        };
        
        const fallbackFiles = generateFallbackFiles(repository);
        setFiles(fallbackFiles);
        
        // Cache the fallback data
        localStorage.setItem(cacheKey, JSON.stringify(fallbackFiles));
        localStorage.setItem(`${cacheKey}-time`, now.toString());
      }

      setLoading(false);
    };

    fetchRepositoryContents();
  }, [repository]);

  const getFileIcon = (file) => {
    if (file.type === 'dir') {
      return '📁';
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    const iconMap = {
      'js': '📄',
      'jsx': '⚛️',
      'ts': '📘',
      'tsx': '⚛️',
      'html': '🌐',
      'css': '🎨',
      'scss': '🎨',
      'sass': '🎨',
      'json': '📋',
      'md': '📝',
      'txt': '📄',
      'py': '🐍',
      'java': '☕',
      'cpp': '⚙️',
      'c': '⚙️',
      'php': '🐘',
      'rb': '💎',
      'go': '🐹',
      'rs': '🦀',
      'sql': '🗄️',
      'xml': '📄',
      'yml': '⚙️',
      'yaml': '⚙️',
      'sh': '🐚',
      'bat': '🐚',
      'ps1': '🐚',
      'gitignore': '🚫',
      'dockerfile': '🐳',
      'docker-compose': '🐳',
      'package': '📦',
      'lock': '🔒',
      'png': '🖼️',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'gif': '🖼️',
      'svg': '🖼️',
      'ico': '🖼️',
      'pdf': '📕',
      'zip': '📦',
      'tar': '📦',
      'gz': '📦'
    };
    
    return iconMap[extension] || '📄';
  };

  const getFileType = (file) => {
    if (file.type === 'dir') return 'directory';
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension || 'file';
  };

  if (loading) {
    return (
      <div className="file-structure loading">
        <div className="file-structure-header">
          <span className="file-structure-title">📁 Files</span>
        </div>
        <div className="file-structure-content">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="file-structure empty">
        <div className="file-structure-header">
          <span className="file-structure-title">📁 Files</span>
        </div>
        <div className="file-structure-content">
          <div className="empty-state">
            <span className="empty-icon">📂</span>
            <span className="empty-text">No files to display</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="file-structure">
      <div className="file-structure-header">
        <span className="file-structure-title">📁 Files</span>
        <span className="file-count">{files.length}</span>
      </div>
      <div className="file-structure-content">
        <div className="file-tree">
          {files.map((file, index) => (
            <div 
              key={file.sha || index} 
              className={`file-item ${getFileType(file)}`}
              title={`${file.name} (${file.type})`}
            >
              <span className="file-icon">{getFileIcon(file)}</span>
              <span className="file-name">{file.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FileStructure;
