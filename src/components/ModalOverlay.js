import React from 'react';

const ModalOverlay = ({ onStart, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h1 className="modal-title">UncleTyrone's Portfolio</h1>
          <p className="modal-subtitle">
            Explore my projects and creative work.
          </p>
        </div>
        
        <button 
          className="modal-start-btn"
          onClick={onStart}
          aria-label="Enter portfolio site"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="modal-arrow-icon">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
          <span>Explore Portfolio</span>
        </button>
        
      </div>
    </div>
  );
};

export default ModalOverlay;
