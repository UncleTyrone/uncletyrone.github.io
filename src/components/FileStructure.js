import React, { useState, useEffect } from 'react';
import './FileStructure.css';

const FileStructure = ({ repository }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRepositoryContents = async () => {
      if (!repository || !repository.full_name) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`https://api.github.com/repos/${repository.full_name}/contents`, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'UncleTyrone-Portfolio'
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Filter out hidden files and limit to top 8 items for space
          const visibleFiles = data
            .filter(item => !item.name.startsWith('.'))
            .slice(0, 8);
          setFiles(visibleFiles);
        } else if (response.status === 403) {
          console.warn('GitHub API rate limit exceeded for file structure');
          setError('API rate limit exceeded');
        } else {
          console.warn(`Failed to fetch contents for ${repository.full_name}:`, response.status);
          setError('Failed to load file structure');
        }
      } catch (error) {
        console.error(`Error fetching repository contents for ${repository.full_name}:`, error);
        setError('Error loading file structure');
      } finally {
        setLoading(false);
      }
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

  if (error || files.length === 0) {
    return (
      <div className="file-structure empty">
        <div className="file-structure-header">
          <span className="file-structure-title">📁 Files</span>
        </div>
        <div className="file-structure-content">
          <div className="empty-state">
            <span className="empty-icon">📂</span>
            <span className="empty-text">
              {error === 'API rate limit exceeded' ? 'Rate limit exceeded' : 'No files to display'}
            </span>
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
