import './GlobalOverlay.css';

export function GlobalOverlay() {
  return (
    <>
      <div className="global-overlay-container">
        {/* Screen noise layer */}
        <div className="overlay-noise" />
      </div>
      <div className="overlay-texture" />
    </>
  );
}
