import React from 'react';
import SocialLinks from './SocialLinks';
import ScrollIndicator from './ScrollIndicator';

const HeroSection = () => {
  return (
    <section className="hero-section">
      <h1 className="hero-title">UncleTyrone</h1>
      <p className="hero-description">Modder and Script Developer</p>
      
      <SocialLinks />
      
      <ScrollIndicator />
    </section>
  );
};

export default HeroSection;
