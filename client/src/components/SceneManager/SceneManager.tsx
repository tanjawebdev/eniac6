import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../../stores/appStore';
import { SCENE_TRANSITIONS, DEFAULT_TRANSITION } from '../../types/scenes';

// Scenes
import { IntroScene } from '../../scenes/IntroScene/IntroScene';
import { HomeScene } from '../../scenes/HomeScene/HomeScene';
import { ThemeScene } from '../../scenes/ThemeScene/ThemeScene';
import { ResetScene } from '../../scenes/ResetScene/ResetScene';
import { DebugScene } from '../../scenes/DebugScene/DebugScene';

import './SceneManager.css';

export function SceneManager() {
  const currentScene = useAppStore((state) => state.currentScene);
  const transitionConfig = SCENE_TRANSITIONS[currentScene] || DEFAULT_TRANSITION;

  const renderScene = () => {
    switch (currentScene) {
      case 'intro':
        return <IntroScene />;
      case 'home':
        return <HomeScene />;
      case 'theme':
        return <ThemeScene />;
      case 'reset':
        return <ResetScene />;
      case 'debug':
        return <DebugScene />;
      default:
        return <IntroScene />;
    }
  };

  // Setup motion variants based on transition configurations
  const getVariants = () => {
    switch (transitionConfig.type) {
      case 'slide-up':
        return {
          initial: { opacity: 0, y: 100 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -100 },
        };
      case 'slide-down':
        return {
          initial: { opacity: 0, y: -100 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: 100 },
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.1 },
        };
      case 'fade':
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
    }
  };

  const variants = getVariants();

  return (
    <div className="scene-manager">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScene}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={variants}
          transition={{
            duration: transitionConfig.duration,
            ease: [0.16, 1, 0.3, 1], // Custom expo ease-out from prototype
          }}
          className="scene-wrapper"
        >
          {renderScene()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
