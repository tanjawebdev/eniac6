export type SceneName = 'intro' | 'home' | 'theme' | 'complete' | 'reset' | 'debug';

export interface TransitionConfig {
  type: 'fade' | 'slide-up' | 'slide-down' | 'scale';
  duration: number;
}

export const DEFAULT_TRANSITION: TransitionConfig = {
  type: 'fade',
  duration: 0.6,
};

export const SCENE_TRANSITIONS: Partial<Record<SceneName, TransitionConfig>> = {
  intro: { type: 'fade', duration: 1.0 },
  home: { type: 'fade', duration: 0.6 },
  theme: { type: 'slide-up', duration: 0.5 },
  reset: { type: 'fade', duration: 0.8 },
};
