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
  const previousScene = useAppStore((state) => state.previousScene);
  const introRunId = useAppStore((state) => state.introRunId);

  // Context-aware transition config: returning from theme to home should have a soft,
  // clearly visible fade-in (0.55s with a smooth curve) starting immediately at t=0.
  const transitionConfig = (() => {
    if (currentScene === 'home' && previousScene === 'theme') {
      return {
        type: 'fade' as const,
        duration: 0.55,
        ease: [0.25, 0.1, 0.25, 1], // Smooth standard ease for a noticeable, gentle fade
      };
    }
    if (currentScene === 'theme' && previousScene === 'home') {
      return {
        type: 'slide-up' as const,
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
      };
    }
    return {
      ...(SCENE_TRANSITIONS[currentScene] || DEFAULT_TRANSITION),
      ease: [0.16, 1, 0.3, 1],
    };
  })();

  const renderScene = () => {
    switch (currentScene) {
      case 'intro':
        return <IntroScene key={introRunId} />;
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
      {/* Omitting mode="wait" allows simultaneous cross-fade transitions,
          so the incoming home scene mounts and fades in immediately at t=0
          instead of waiting for the old scene to finish exiting. */}
      <AnimatePresence>
        <motion.div
          key={currentScene}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={variants}
          transition={{
            duration: transitionConfig.duration,
            ease: transitionConfig.ease,
          }}
          className="scene-wrapper"
        >
          {renderScene()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
