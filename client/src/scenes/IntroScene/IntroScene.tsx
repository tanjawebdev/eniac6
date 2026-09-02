import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAppStore } from '../../stores/appStore';
import { INTRO_STEPS } from './introStory';
import { IntroIllustration } from './IntroIllustrations';
import './IntroScene.css';

export function IntroScene() {
  const goHome = useAppStore((state) => state.goHome);
  const reducedMotion = useReducedMotion();
  const [stepIndex, setStepIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pageHidden, setPageHidden] = useState(document.hidden);
  const elapsed = useRef(0);
  const step = INTRO_STEPS[stepIndex];
  const isLast = stepIndex === INTRO_STEPS.length - 1;
  const isPlaying = !paused && !pageHidden;

  const moveTo = useCallback((index: number) => {
    elapsed.current = 0;
    setProgress(0);
    setStepIndex(Math.max(0, Math.min(INTRO_STEPS.length - 1, index)));
  }, []);

  const next = useCallback(() => {
    if (stepIndex === INTRO_STEPS.length - 1) goHome();
    else moveTo(stepIndex + 1);
  }, [stepIndex, goHome, moveTo]);

  useEffect(() => {
    const updateVisibility = () => setPageHidden(document.hidden);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  // Preserve reading time when paused or when the browser tab is hidden.
  useEffect(() => {
    if (!isPlaying) return;
    let lastTick = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      elapsed.current += now - lastTick;
      lastTick = now;
      setProgress(Math.min(elapsed.current / step.duration, 1));
      if (elapsed.current >= step.duration) {
        window.clearInterval(timer);
        next();
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [isPlaying, step.duration, next]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('button, a, input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); moveTo(stepIndex - 1); }
      if (event.code === 'Space') { event.preventDefault(); setPaused((value) => !value); }
      if (event.key === 'Escape') goHome();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goHome, moveTo, next, stepIndex]);

  return (
    <section className={`intro-scene ${!isPlaying ? 'intro-is-paused' : ''}`} aria-label="Introduction to the ENIAC Six">
      <div className="intro-layout">
        <header className="intro-header">
          <span className="intro-brand"><span className="intro-brand-mark" aria-hidden="true">Ⅵ</span> THE ENIAC 6</span>
          <span className="intro-header-label">A story. A machine. Your turn.</span>
          <button className="intro-skip" onClick={goHome}>Skip intro <span aria-hidden="true">↗</span></button>
        </header>

        <div className="intro-stage" aria-live={paused ? 'polite' : 'off'}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step.id}
              className={`intro-slide intro-slide--${step.id}`}
              initial={{ opacity: 0, y: reducedMotion ? 0 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reducedMotion ? 0 : -12 }}
              transition={{ duration: reducedMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="intro-copy">
                <p className="intro-eyebrow"><span aria-hidden="true" />{step.eyebrow}</p>
                {step.id === 'title' ? (
                  <h1 className="intro-title"><span>THE</span>ENIAC <em>6</em></h1>
                ) : <h2 className="intro-heading">{step.title}</h2>}
                <p className="intro-body">{step.body}</p>
              </div>
              <div className="intro-art"><IntroIllustration step={step.id} /></div>
              {'note' in step && <p className="intro-note">{step.note}</p>}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="intro-footer">
          <div className="intro-chapter-caption">
            <span>{String(stepIndex + 1).padStart(2, '0')} <span className="intro-dim">/ 08</span></span>
            <span>{step.label}</span>
            <span className="intro-play-status">{paused ? 'Paused' : 'Auto-playing'}</span>
          </div>
          <nav className="intro-timeline" aria-label="Introduction chapters">
            {INTRO_STEPS.map((item, index) => (
              <button key={item.id} className="intro-segment" aria-label={`Go to ${item.label}`} aria-current={index === stepIndex ? 'step' : undefined} onClick={() => moveTo(index)}>
                <span className="intro-segment-track"><span style={{ transform: `scaleX(${index < stepIndex ? 1 : index === stepIndex ? progress : 0})` }} /></span>
              </button>
            ))}
          </nav>
          <div className="intro-controls">
            <button className="intro-control" disabled={stepIndex === 0} onClick={() => moveTo(stepIndex - 1)}><span aria-hidden="true">←</span> Back</button>
            <button className="intro-control intro-pause" aria-pressed={paused} onClick={() => setPaused((value) => !value)}><span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span> {paused ? 'Resume' : 'Pause'}</button>
            <button className="intro-control intro-next" onClick={next}>{isLast ? 'Begin exploring' : 'Next'} <span aria-hidden="true">→</span></button>
          </div>
          <p className="intro-hardware-hint">Press <strong>INTRO</strong> to restart this guide <span>·</span> Press <strong>HOME</strong> to explore</p>
        </footer>
      </div>
    </section>
  );
}
