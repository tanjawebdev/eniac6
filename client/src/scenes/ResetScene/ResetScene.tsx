import { useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import './ResetScene.css';

export function ResetScene() {
  const resetInstallation = useAppStore((state) => state.resetInstallation);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Performs store cleanup and routes back to Intro
      resetInstallation();
    }, 2000);

    return () => clearTimeout(timer);
  }, [resetInstallation]);

  return (
    <div className="reset-scene">
      <div className="reset-content">
        <div className="reset-spinner" />
        <h2 className="reset-title glow-text">RESETTING SYSTEM</h2>
        <span className="reset-sub">CLEARING REGISTER LOOPS...</span>
      </div>
    </div>
  );
}
