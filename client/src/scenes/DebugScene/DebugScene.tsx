import { useHardwareStore } from '../../stores/hardwareStore';
import { useAppStore } from '../../stores/appStore';
import { THEME_IDS, THEME_POT_MAPPING, NFC_PROGRAMMER_MAPPING } from '@shared/constants';
import { PROGRAMMERS } from '../../data/programmers';
import './DebugScene.css';

export function DebugScene() {
  const hardware = useHardwareStore();
  const wsConnected = useAppStore((state) => state.wsConnected);
  const mockMode = useAppStore((state) => state.mockMode);
  const goHome = useAppStore((state) => state.goHome);

  return (
    <div className="debug-scene container-full">
      <header className="debug-scene-header">
        <div>
          <span className="dbg-pre">system calibration</span>
          <h2 className="dbg-title">HARDWARE DIAGNOSTICS</h2>
        </div>
        <button className="dbg-exit-btn" onClick={goHome}>
          EXIT DIAGNOSTICS
        </button>
      </header>

      <div className="debug-scene-content">
        {/* Connection details */}
        <div className="dbg-card glass-panel network-info">
          <h3>SYSTEM INTERFACE</h3>
          <div className="dbg-row">
            <span>SOCKET CHANNEL</span>
            <strong className={wsConnected ? 'text-success' : 'text-danger'}>
              {wsConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </strong>
          </div>
          <div className="dbg-row">
            <span>RUNNING EMULATOR</span>
            <strong className="text-warning">{mockMode ? 'ACTIVE (MOCK)' : 'SERIAL (ARDUINO)'}</strong>
          </div>
        </div>

        {/* 16 Pots Grid */}
        <div className="dbg-card glass-panel pots-card">
          <h3>ANALOG POTENTIOMETERS (16 CHANNELS)</h3>
          <div className="dbg-pots-grid">
            {THEME_IDS.map((themeId) => {
              const { potStart } = THEME_POT_MAPPING[themeId];
              return (
                <div key={themeId} className="dbg-pot-group">
                  <div className="group-header">{themeId.toUpperCase()}</div>
                  <div className="group-pots">
                    {Array.from({ length: 4 }).map((_, offset) => {
                      const id = potStart + offset;
                      const val = hardware.pots[id] ?? 0;
                      const pct = (val / 1023) * 100;
                      return (
                        <div key={id} className="dbg-pot-item">
                          <div className="item-labels">
                            <span>CH_{id.toString().padStart(2, '0')}</span>
                            <strong>{val}</strong>
                          </div>
                          <div className="item-track">
                            <div className="item-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* NFC, Banana Plugs and Buttons */}
        <div className="dbg-right-column">
          {/* NFC Readers */}
          <div className="dbg-card glass-panel readers-card">
            <h3>NFC CONTROLLERS (6 PORTS)</h3>
            <div className="dbg-nfc-list">
              {hardware.nfc.map((reader, index) => {
                const progKey = NFC_PROGRAMMER_MAPPING[index];
                const prog = progKey ? PROGRAMMERS[progKey] : null;

                return (
                  <div key={index} className="dbg-nfc-row">
                    <div className="nfc-port">
                      <span>PORT 0{index + 1}</span>
                      <strong style={{ color: prog?.color }}>{prog?.firstName.toUpperCase() || 'UNKNOWN'}</strong>
                    </div>
                    <div className="nfc-state">
                      {reader.present ? (
                        <>
                          <span className="nfc-in-tag text-success">INSERTED</span>
                          <span className="nfc-uid-tag">{reader.uid}</span>
                        </>
                      ) : (
                        <span className="text-muted">EMPTY</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Banana plugs and buttons */}
          <div className="dbg-card glass-panel plugs-card">
            <h3>PLUGBOARD JACKS &amp; SWITCHES</h3>
            
            <div className="banana-connectors">
              <span className="sub-header">BANANA PATCH PLUGS (4)</span>
              <div className="banana-indicators-grid">
                {THEME_IDS.map((themeId, index) => {
                  const connected = hardware.banana[index] ?? false;
                  return (
                    <div key={themeId} className={`banana-plug-box ${connected ? 'active' : ''}`}>
                      <span className="plug-id">JACK_0{index + 1}</span>
                      <span className="plug-lbl">{themeId.toUpperCase()}</span>
                      <span className="plug-status">{connected ? 'PATCHED' : 'OPEN'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="switch-indicators">
              <span className="sub-header">REGISTER TRIGGERS</span>
              <div className="sw-grid">
                <div className={`sw-box ${hardware.buttons.intro ? 'active' : ''}`}>
                  <span>INTRO BUTTON</span>
                  <strong>{hardware.buttons.intro ? 'CLOSED' : 'OPEN'}</strong>
                </div>
                <div className={`sw-box ${hardware.buttons.home ? 'active' : ''}`}>
                  <span>HOME BUTTON</span>
                  <strong>{hardware.buttons.home ? 'CLOSED' : 'OPEN'}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
