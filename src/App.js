import React, { useState, useEffect } from 'react';
import './App.css';
import HeroSection from './components/HeroSection';
import MusicPlayer from './components/MusicPlayer';
import RepositoriesSection from './components/RepositoriesSection';
import ModalOverlay from './components/ModalOverlay';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [showModal, setShowModal] = useState(true);
  const [shouldStartMusic, setShouldStartMusic] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection and video autoplay handling
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Handle mobile video autoplay
    const handleUserInteraction = () => {
      const video = document.querySelector('.background-video');
      if (video && video.paused) {
        video.play().catch(error => {
          console.log('Video autoplay failed:', error);
        });
      }
    };
    
    // Add user interaction listeners for mobile autoplay
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    document.addEventListener('click', handleUserInteraction, { once: true });
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('click', handleUserInteraction);
    };
  }, []);

  const handleStart = () => {
    setShowModal(false);
    setShouldStartMusic(true);
  };

  return (
    <div className="App">
      {/* Video Background - Fallback to CSS gradient */}
      <div 
        className="background-video-fallback"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
          zIndex: -2,
          display: 'block' // Always show fallback
        }}
      />
      <video
        autoPlay
        loop
        muted
        playsInline
        webkit-playsinline="true"
        className="background-video"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: -2,
          display: 'none' // Hide video by default, show only when it loads
        }}
        onError={(e) => {
          console.error('Video loading error:', e);
          e.target.style.display = 'none';
          // Ensure fallback is visible when video fails
          const fallback = document.querySelector('.background-video-fallback');
          if (fallback) fallback.style.display = 'block';
        }}
        onLoadStart={() => console.log('Video loading started')}
        onCanPlay={() => {
          console.log('Video can play');
          // Show video and hide fallback when video is ready
          const video = document.querySelector('.background-video');
          const fallback = document.querySelector('.background-video-fallback');
          if (video) video.style.display = 'block';
          if (fallback) fallback.style.display = 'none';
        }}
        onPlay={() => {
          console.log('Video started playing');
          // Ensure video is visible when it starts playing
          const video = document.querySelector('.background-video');
          const fallback = document.querySelector('.background-video-fallback');
          if (video) video.style.display = 'block';
          if (fallback) fallback.style.display = 'none';
        }}
      >
      <source src={process.env.PUBLIC_URL + "/background.mp4"} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Overlay for better text readability */}
      <div className="video-overlay"></div>
      
      {/* Main Content */}
      <div className="main-content">
        <HeroSection />
        <RepositoriesSection />
      </div>
      
      {/* Music Player */}
      <ErrorBoundary>
        <MusicPlayer shouldStartPlaying={shouldStartMusic} />
      </ErrorBoundary>
      
      {/* Modal Overlay */}
      <ModalOverlay 
        onStart={handleStart} 
        isVisible={showModal} 
      />
    </div>
  );
}

export default App;