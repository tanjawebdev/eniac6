import { div } from 'framer-motion/client';
import './GlobalOverlay.css';

export function GlobalOverlay() {
  return (
    <>
      <div className="global-overlay-container">
        {/* Vignette Shadow Overlay */}
        {/*<div className="overlay-vignette" />*/}
        {/* Scanline CRT overlay */}
        {/*<div className="overlay-scanlines" />*/}

        {/* Screen noise layer */}
        <div className="overlay-noise" />
        {/* Custom dust and scratch texture overlay */}
      </div>
      <div className="overlay-texture" />
    </>
  );
}
