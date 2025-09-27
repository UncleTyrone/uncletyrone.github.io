import React, { useState, useEffect } from 'react';

const ScrollIndicator = () => {
  const [isVisible, setIsVisible] = useState(true);

  const scrollToRepositories = () => {
    const repositoriesSection = document.querySelector('.repositories-section');
    if (repositoriesSection) {
      repositoriesSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const repositoriesSection = document.querySelector('.repositories-section');
      if (repositoriesSection) {
        const rect = repositoriesSection.getBoundingClientRect();
        // Hide indicator when repositories section is in view (top of section reaches viewport)
        const shouldHide = rect.top <= window.innerHeight * 0.1; // Hide when section is 10% into viewport
        setIsVisible(!shouldHide);
      }
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Check initial state
    handleScroll();

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="scroll-indicator" onClick={scrollToRepositories}>
      <div className="scroll-text">Scroll Down</div>
      <div className="scroll-arrow"></div>
    </div>
  );
};

export default ScrollIndicator;
