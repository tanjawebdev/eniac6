import { useAppStore } from '../../stores/appStore';
import { useHardwareStore } from '../../stores/hardwareStore';
import './Hud.css';

export function Hud() {
  const currentScene = useAppStore((state) => state.currentScene);
  const nfc = useHardwareStore((state) => state.nfc);

  // Show header text only on home and theme scenes
  if (currentScene !== 'home' && currentScene !== 'theme') {
    return null;
  }

  const insertedCount = nfc.filter((n) => n.present && n.uid).length;

  return (
    <div className="home-header-text">
      <span className="home-header-text-inside">
        {insertedCount}<span className="text-light">/6 </span>programmers inserted
      </span>
    </div>
  );
}
