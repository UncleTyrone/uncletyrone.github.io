import React, { useState } from 'react';
import './App.css';
import HeroSection from './components/HeroSection';
import MusicPlayer from './components/MusicPlayer';
import RepositoriesSection from './components/RepositoriesSection';
import ModalOverlay from './components/ModalOverlay';

function App() {
  const [showModal, setShowModal] = useState(true);
  const [shouldStartMusic, setShouldStartMusic] = useState(false);

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
          zIndex: -2
        }}
      />
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        webkit-playsinline="true"
        className="background-video"
        onError={(e) => {
          console.error('Video loading error:', e);
          console.error('Video error details:', e.target.error);
          if (e.target.error) {
            console.error('Error code:', e.target.error.code);
            console.error('Error message:', e.target.error.message);
          }
          // Hide video and show fallback
          e.target.style.display = 'none';
        }}
        onLoadStart={() => console.log('Video loading started')}
        onCanPlay={() => {
          console.log('Video can play');
          // Hide fallback when video loads successfully
          const fallback = document.querySelector('.background-video-fallback');
          if (fallback) fallback.style.display = 'none';
        }}
        onLoadedData={() => console.log('Video data loaded')}
      >
        <source src="/uncletyrone-portfolio/background.mp4" type="video/mp4; codecs=avc1.42E01E,mp4a.40.2" />
        <source src="/uncletyrone-portfolio/background.mp4" type="video/mp4" />
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
      <MusicPlayer shouldStartPlaying={shouldStartMusic} />
      
      {/* Modal Overlay */}
      <ModalOverlay 
        onStart={handleStart} 
        isVisible={showModal} 
      />
    </div>
  );
}

export default App;