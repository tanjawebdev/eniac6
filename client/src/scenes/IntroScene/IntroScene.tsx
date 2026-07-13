import { useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import './IntroScene.css';

export function IntroScene() {
  const goToScene = useAppStore((state) => state.goToScene);

  // Auto-advance to home scene after 8 seconds of idle
  useEffect(() => {
    const timer = setTimeout(() => {
      goToScene('home');
    }, 8000);

    return () => clearTimeout(timer);
  }, [goToScene]);

  const handleScreenClick = () => {
    goToScene('home');
  };

  return (
    <div className="intro-scene" onClick={handleScreenClick}>
      <div className="intro-content">
        <h1 className="intro-title glow-text">ENIAC</h1>
        <div className="intro-line" />
        <p className="intro-subtitle">
          THE SIX WOMEN WHO
          <br />
          PROGRAMMED THE FUTURE
        </p>
        <span className="intro-prompt">TAP TO START THE EXPERIENCE</span>
      </div>
    </div>
  );
}
