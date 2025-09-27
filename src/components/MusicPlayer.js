import React, { useState, useRef, useEffect } from 'react';

// Move tracks outside component to avoid dependency issues
const tracks = [
  {
    title: "Enemy Under Arms",
    artist: "Trippie Redd",
    src: "/uncletyrone-portfolio/music/track1.mp3",
    image: "/uncletyrone-portfolio/music/track1.png"
  },
  {
    title: "Until I Die (Unreleased)", 
    artist: "Juice WRLD",
    src: "/uncletyrone-portfolio/music/track2.mp3",
    image: "/uncletyrone-portfolio/music/track2.png"
  },
  {
    title: "Reanimator",
    artist: "Joji Ft. Yves Tumor", 
    src: "/uncletyrone-portfolio/music/track3.mp3",
    image: "/uncletyrone-portfolio/music/track3.png"
  },
  {
    title: "Pneuma",
    artist: "Tool",
    src: "/uncletyrone-portfolio/music/track4.mp3",
    image: "/uncletyrone-portfolio/music/track4.png"
  },
  {
    title: "The Color Violet",
    artist: "Tory Lanez",
    src: "/uncletyrone-portfolio/music/track5.mp3",
    image: "/uncletyrone-portfolio/music/track5.png"
  }
];

const MusicPlayer = ({ shouldStartPlaying }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [audioData, setAudioData] = useState(new Array(80).fill(0));
  const [audioEnergy, setAudioEnergy] = useState(0);
  const [volume, setVolume] = useState(() => {
    // Load volume from localStorage or default to 1
    try {
      const savedVolume = localStorage.getItem('musicPlayerVolume');
      return savedVolume ? parseFloat(savedVolume) : 1;
    } catch (error) {
      console.log('localStorage not available, using default volume');
      return 1;
    }
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaSourceRef = useRef(null);
  const animationFrameRef = useRef(null);
  const progressBarRef = useRef(null);
  const playerRef = useRef(null);

  // Handle first user interaction for autoplay
  useEffect(() => {
    const handleFirstInteraction = async () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
        
        // Start playing music on first interaction
        const audio = audioRef.current;
        if (audio) {
          try {
            await audio.play();
            setIsPlaying(true);
          } catch (error) {
            console.log('Autoplay failed:', error);
            // If autoplay fails, user can still manually play
          }
        }
      }
    };

    // Listen for minimal valid user interactions that browsers recognize
    const events = ['touchstart', 'pointerdown', 'click', 'keydown'];
    
    events.forEach(event => {
      document.addEventListener(event, handleFirstInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleFirstInteraction);
      });
    };
  }, []); // Run once on mount

  // Handle modal-triggered autoplay
  useEffect(() => {
    const startMusic = async () => {
      if (shouldStartPlaying && !hasUserInteracted && !isPlaying) {
        setHasUserInteracted(true);
        
        const audio = audioRef.current;
        if (audio) {
          try {
            await audio.play();
            setIsPlaying(true);
          } catch (error) {
            console.log('Modal-triggered autoplay failed:', error);
          }
        }
      }
    };

    startMusic();
  }, [shouldStartPlaying, hasUserInteracted, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const updateTime = () => setCurrentTime(audio.currentTime);
      const updateDuration = () => setDuration(audio.duration);
      const handleEnded = () => {
        // Auto-advance to next track when current track ends
        const next = (currentTrack + 1) % tracks.length;
        setCurrentTrack(next);
        setHasError(false);
        setIsPlaying(true);
      };
      const handleError = (e) => {
        console.error('Audio error in useEffect:', e);
        console.error('Current track:', tracks[currentTrack]);
        if (e.target.error) {
          console.error('Error code:', e.target.error.code);
          console.error('Error message:', e.target.error.message);
        }
        setIsPlaying(false);
        setHasError(true);
      };

      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      // Load the new track
      audio.load();
      
      // Auto-play if isPlaying is true (when changing tracks)
      if (isPlaying) {
        // Wait for the audio to be ready to play
        const handleCanPlay = () => {
          audio.removeEventListener('canplay', handleCanPlay);
          audio.play().catch(error => {
            console.log('Auto-play failed:', error);
            setIsPlaying(false);
          });
        };
        
        audio.addEventListener('canplay', handleCanPlay);
      }

      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [currentTrack]);

  // Handle volume changes without reloading the track
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Audio analysis setup
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && isPlaying) {
      const setupAudioAnalysis = async () => {
        try {
          // Only create new context if we don't have one or it's closed
          if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            // Clean up existing context if it exists
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
              audioContextRef.current.close();
            }
            
            // Create new audio context
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioContext;
          }
          
          // Only create MediaElementSource if we don't have one
          if (!mediaSourceRef.current) {
            const analyser = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaElementSource(audio);
            
            analyser.fftSize = 256; // Increased for more frequency bins
            analyser.smoothingTimeConstant = 0.3; // Reduced for more responsive waveform
            
            source.connect(analyser);
            analyser.connect(audioContextRef.current.destination);
            
            analyserRef.current = analyser;
            mediaSourceRef.current = source;
          }
          
          // Start animation loop
          const animate = () => {
            if (analyserRef.current && isPlaying) {
              const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
              analyserRef.current.getByteFrequencyData(dataArray);
              
              // Convert to normalized values (0-1) with enhanced scaling
              const normalizedData = Array.from(dataArray).map(value => {
                // Apply square root for better visual representation
                return Math.sqrt(value / 255);
              });
              
              // Downsample to 80 points for optimal waveform resolution
              const downsampledData = [];
              const step = Math.floor(normalizedData.length / 80);
              for (let i = 0; i < 80; i++) {
                const start = i * step;
                const end = Math.min(start + step, normalizedData.length);
                const avg = normalizedData.slice(start, end).reduce((sum, val) => sum + val, 0) / (end - start);
                downsampledData.push(avg);
              }
              
              setAudioData(downsampledData);
              
              // Calculate audio energy for dynamic coloring
              const energy = normalizedData.reduce((sum, value) => sum + value, 0) / normalizedData.length;
              setAudioEnergy(energy);
              
              animationFrameRef.current = requestAnimationFrame(animate);
            }
          };
          
          animate();
        } catch (error) {
          console.log('Audio analysis setup failed:', error);
        }
      };
      
      setupAudioAnalysis();
    } else if (!isPlaying) {
      // Clean up animation when not playing
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTrack]); // Add currentTrack to dependencies

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      // Clear media source reference
      mediaSourceRef.current = null;
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = () => {
    const next = (currentTrack + 1) % tracks.length;
    setCurrentTrack(next);
    setHasError(false);
    setIsPlaying(true);
    // The useEffect will handle loading and playing the new track
  };

  const prevTrack = () => {
    const prev = currentTrack === 0 ? tracks.length - 1 : currentTrack - 1;
    setCurrentTrack(prev);
    setHasError(false);
    setIsPlaying(true);
    // The useEffect will handle loading and playing the new track
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    // Save volume to localStorage
    try {
      localStorage.setItem('musicPlayerVolume', newVolume.toString());
    } catch (error) {
      console.log('Could not save volume to localStorage');
    }
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleProgressClick = (e) => {
    if (audioRef.current && duration && progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleProgressMouseDown = () => {
    setIsDragging(true);
  };

  const handleProgressMouseUp = () => {
    setIsDragging(false);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  // Generate SVG path from live audio data
  const generateWaveformPath = () => {
    if (!audioData || audioData.length === 0) return '';
    
    // Get actual container width for responsive waveform
    const containerWidth = playerRef.current ? playerRef.current.offsetWidth - 48 : 280; // Account for padding
    const width = Math.max(containerWidth, 280); // Ensure minimum width
    const height = 57; // Decreased height by 5% (60 * 0.95 = 57)
    const centerY = height / 2;
    const stepX = width / (audioData.length - 1);
    const maxAmplitude = 25; // Increased amplitude for more height resolution
    
    let path = `M 0 ${centerY}`;
    
    // Generate top half of waveform from audio data
    for (let i = 0; i < audioData.length; i++) {
      const x = i * stepX;
      const amplitude = audioData[i] * maxAmplitude; // Scale audio data to amplitude
      const y = centerY - Math.max(amplitude, 2); // Ensure minimum separation
      
      if (i === 0) {
        path += ` L ${x} ${y}`;
      } else {
        // Use quadratic curves for smooth waveform
        const prevX = (i - 1) * stepX;
        const controlX = (prevX + x) / 2;
        path += ` Q ${controlX} ${centerY} ${x} ${y}`;
      }
    }
    
    // Add a small gap in the center before starting bottom half
    path += ` L ${width} ${centerY - 1}`;
    
    // Mirror the bottom half
    for (let i = audioData.length - 1; i >= 0; i--) {
      const x = i * stepX;
      const amplitude = audioData[i] * maxAmplitude;
      const y = centerY + Math.max(amplitude, 2); // Ensure minimum separation
      
      if (i === audioData.length - 1) {
        path += ` L ${x} ${y}`;
      } else {
        const nextX = (i + 1) * stepX;
        const controlX = (x + nextX) / 2;
        path += ` Q ${controlX} ${centerY} ${x} ${y}`;
      }
    }
    
    // Close the gap at the beginning
    path += ` L 0 ${centerY + 1}`;
    
    path += ' Z';
    return path;
  };

  // Dynamic color based on audio energy
  const getWaveformColor = () => {
    const intensity = Math.min(audioEnergy * 2, 1); // Amplify energy for more dramatic color changes
    
    if (intensity < 0.2) {
      return `rgba(96, 165, 250, ${0.4 + intensity * 0.2})`; // Blue with transparency
    } else if (intensity < 0.5) {
      return `rgba(139, 92, 246, ${0.5 + intensity * 0.15})`; // Purple with transparency
    } else if (intensity < 0.8) {
      return `rgba(236, 72, 153, ${0.6 + intensity * 0.1})`; // Pink with transparency
    } else {
      return `rgba(239, 68, 68, ${0.7 + intensity * 0.1})`; // Red with transparency
    }
  };

  return (
    <div className="music-player" ref={playerRef}>
      {/* Background Waveform */}
      <div className="waveform-background">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${Math.max(playerRef.current ? playerRef.current.offsetWidth - 48 : 280, 280)} 57`}
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            opacity: isPlaying ? 0.8 : 0.4,
            transition: 'opacity 0.3s ease'
          }}
        >
          <defs>
            <linearGradient id="waveformGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={getWaveformColor()} />
              <stop offset="50%" stopColor={getWaveformColor()} />
              <stop offset="100%" stopColor={getWaveformColor()} />
            </linearGradient>
          </defs>
          <path
            d={generateWaveformPath()}
            fill="url(#waveformGradient)"
            stroke="none"
            style={{
              transition: 'all 0.1s ease',
              opacity: 0.7
            }}
          />
        </svg>
      </div>

      <audio
        ref={audioRef}
        preload="metadata"
        onError={(e) => {
          console.error('Audio loading error:', e);
          console.error('Audio error details:', e.target.error);
          if (e.target.error) {
            console.error('Error code:', e.target.error.code);
            console.error('Error message:', e.target.error.message);
          }
          console.error('Failed to load track:', tracks[currentTrack].src);
          setHasError(true);
        }}
        onLoadStart={() => console.log('Audio loading started:', tracks[currentTrack].src)}
        onCanPlay={() => {
          console.log('Audio can play:', tracks[currentTrack].src);
          setHasError(false);
        }}
        onLoadedData={() => console.log('Audio data loaded:', tracks[currentTrack].src)}
      >
        <source src={tracks[currentTrack].src} type="audio/mpeg" />
        <source src={tracks[currentTrack].src} type="audio/mp3" />
        Your browser does not support the audio element.
      </audio>
      
      <div className="player-header" style={{ position: 'relative', zIndex: 2 }}>
        <div className="player-title">Now Playing</div>
        {hasError && (
          <div className="error-indicator" style={{ color: '#ff6b6b', fontSize: '0.8rem' }}>
            ⚠️ Track unavailable
          </div>
        )}
      </div>

      <div className="track-info" style={{ position: 'relative', zIndex: 2 }}>
        <div className="track-image-container">
          <img 
            src={tracks[currentTrack].image} 
            alt={`${tracks[currentTrack].title} cover`}
            className="track-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
        <div className="track-details">
          <div className="track-title">{tracks[currentTrack].title}</div>
          <div className="track-artist">{tracks[currentTrack].artist}</div>
        </div>
      </div>

      <div className="player-controls" style={{ position: 'relative', zIndex: 2 }}>
        <button className="control-btn" onClick={prevTrack} aria-label="Previous track">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
          </svg>
        </button>
        
        <button className="control-btn play-pause-btn" onClick={togglePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
        
        <button className="control-btn" onClick={nextTrack} aria-label="Next track">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
          </svg>
        </button>
      </div>

      <div className="volume-controls" style={{ position: 'relative', zIndex: 2 }}>
        <button className="control-btn volume-btn" onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted || volume === 0 ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          ) : volume < 0.5 ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          )}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="volume-slider"
          aria-label="Volume control"
        />
      </div>

      <div 
        className="progress-bar" 
        ref={progressBarRef}
        style={{ position: 'relative', zIndex: 2 }}
        onClick={handleProgressClick}
        onMouseDown={handleProgressMouseDown}
        onMouseUp={handleProgressMouseUp}
      >
        <div className="progress" style={{ width: `${progressPercentage}%` }}></div>
      </div>

      <div className="time-display" style={{ position: 'relative', zIndex: 2 }}>
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default MusicPlayer;
