import { useHardwareStore } from '../../stores/hardwareStore';
import { useAppStore } from '../../stores/appStore';
import { useDebug } from '../../hooks/useScene';
import { WebSocketService } from '../../services/WebSocketService';
import { THEME_IDS, THEME_POT_MAPPING, PROGRAMMER_UIDS, UID_TO_PROGRAMMER } from '@shared/constants';
import { PROGRAMMERS } from '../../data/programmers';
import './DebugOverlay.css';

export function DebugOverlay() {
  const hardware = useHardwareStore();
  const { wsConnected, mockMode } = useDebug();
  const activeScene = useAppStore((state) => state.currentScene);
  const activeColor = useAppStore((state) => state.activeColor);

  const wsService = WebSocketService.getInstance();

  // --- Hardware Emulation Event Dispatchers ---

  const handlePotChange = (id: number, value: number) => {
    if (!mockMode) return;
    wsService.sendEvent({ type: 'pot', id, value });
  };

  const handleBananaToggle = (bananaId: number, currentConnected: boolean) => {
    if (!mockMode) return;
    wsService.sendEvent({ type: 'banana', id: bananaId, connected: !currentConnected });
  };

  const handleNfcDropdownChange = (slotIndex: number, uid: string) => {
    if (!mockMode) return;
    if (uid === '') {
      // Remove card from slot
      wsService.sendEvent({ type: 'nfc', reader: slotIndex, present: false, uid: '' });
    } else {
      // Insert card into slot
      wsService.sendEvent({ type: 'nfc', reader: slotIndex, present: true, uid });
    }
  };

  const handleContactToggle = (id: number, currentActive: boolean) => {
    if (!mockMode) return;
    wsService.sendEvent({ type: 'contact', id, active: !currentActive });
  };

  const handleButtonPress = (id: number, name: 'home' | 'intro') => {
    if (!mockMode) return;
    // Press button
    wsService.sendEvent({ type: 'button', id, name, pressed: true });
    // Release button after 150ms to simulate a physical momentary button push
    setTimeout(() => {
      wsService.sendEvent({ type: 'button', id, name, pressed: false });
    }, 150);
  };

  return (
    <div className="debug-overlay glass-panel">
      <header className="debug-header">
        <h3>System Debug</h3>
        <span className="debug-sub">Hardware Emulation Board</span>
      </header>

      {/* Network / Mode Info */}
      <section className="debug-section">
        <h4>Status</h4>
        <div className="debug-grid-2">
          <div className="debug-item">
            <span className="debug-label">WebSocket</span>
            <span className={`debug-val ${wsConnected ? 'text-success' : 'text-danger'}`}>
              {wsConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
          <div className="debug-item">
            <span className="debug-label">Mode</span>
            <span className="debug-val accent-text">{mockMode ? 'EMULATION (MOCK)' : 'SERIAL (ARDUINO)'}</span>
          </div>
          <div className="debug-item">
            <span className="debug-label">Active Scene</span>
            <span className="debug-val" style={{ color: activeColor }}>
              {activeScene.toUpperCase()}
            </span>
          </div>
          <div className="debug-item">
            <span className="debug-label">Accent Color</span>
            <span className="debug-val" style={{ color: activeColor }}>
              {activeColor}
            </span>
          </div>
        </div>
        {mockMode && (
          <div className="emulation-notice">
            * manual emulation mode is ACTIVE. adjust controls below to simulate hardware inputs.
          </div>
        )}
      </section>

      {/* Potentiometers grouped by Theme */}
      <section className="debug-section">
        <h4>Potentiometers (16)</h4>
        <div className="pot-groups">
          {THEME_IDS.map((themeId) => {
            const { potStart } = THEME_POT_MAPPING[themeId];
            return (
              <div key={themeId} className="pot-group-container">
                <span className="pot-group-title">{themeId.toUpperCase()}</span>
                <div className="pot-group-grid">
                  {Array.from({ length: 4 }).map((_, offset) => {
                    const id = potStart + offset;
                    const val = hardware.pots[id] ?? 0;
                    const pct = (val / 1023) * 100;
                    return (
                      <div key={id} className="pot-bar-wrapper interactive">
                        <div className="pot-bar-labels">
                          <span>P{id.toString().padStart(2, '0')}</span>
                          <span>{val}</span>
                        </div>
                        <div className="pot-bar-track-container">
                          <input
                            type="range"
                            min="0"
                            max="1023"
                            value={val}
                            disabled={!mockMode}
                            onChange={(e) => handlePotChange(id, parseInt(e.target.value))}
                            className="pot-slider"
                            style={{
                              background: `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${pct}%, rgba(255, 255, 255, 0.08) ${pct}%)`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Banana Plugs (Themes) */}
      <section className="debug-section">
        <h4>Banana Plugs (4)</h4>
        <div className="banana-grid">
          {THEME_IDS.map((themeId) => {
            const { bananaId } = THEME_POT_MAPPING[themeId];
            const connected = hardware.banana[bananaId] ?? false;
            return (
              <div
                key={themeId}
                className={`banana-item ${mockMode ? 'clickable' : ''}`}
                onClick={() => handleBananaToggle(bananaId, connected)}
              >
                <div className="banana-label-group">
                  <span className="banana-id">Plug {bananaId}</span>
                  <span className="banana-theme">{themeId}</span>
                </div>
                <span className={`banana-status ${connected ? 'active' : ''}`}>
                  {connected ? 'PLUGGED' : 'OPEN'}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* NFC Readers (Slots 0-5 with select dropdown) */}
      <section className="debug-section">
        <h4>NFC Reader Slots (6)</h4>
        <div className="nfc-list">
          {hardware.nfc.map((reader, index) => {
            // Find programmer by currently detected UID in this slot
            const programmerKey = reader.present ? UID_TO_PROGRAMMER[reader.uid] : null;
            const programmer = programmerKey ? PROGRAMMERS[programmerKey] : null;

            return (
              <div key={index} className="nfc-item-row">
                <div className="nfc-label-col">
                  <span className="nfc-idx">Slot {index}</span>
                  <span className="nfc-prog" style={{ color: programmer?.color }}>
                    {programmer ? programmer.firstName : 'Empty'}
                  </span>
                </div>
                <div className="nfc-control-col">
                  {mockMode ? (
                    <select
                      className="nfc-dropdown font-monospace"
                      value={reader.present ? reader.uid : ''}
                      onChange={(e) => handleNfcDropdownChange(index, e.target.value)}
                    >
                      <option value="">[ Empty Slot ]</option>
                      <option value={PROGRAMMER_UIDS.mcnulty}>Kay McNulty (Gold)</option>
                      <option value={PROGRAMMER_UIDS.jennings}>Jean Jennings (Orange)</option>
                      <option value={PROGRAMMER_UIDS.snyder}>Betty Snyder (Red)</option>
                      <option value={PROGRAMMER_UIDS.wescoff}>Marlyn Wescoff (Brown)</option>
                      <option value={PROGRAMMER_UIDS.bilas}>Fran Bilas (Purple)</option>
                      <option value={PROGRAMMER_UIDS.lichterman}>Ruth Lichterman (Blue)</option>
                    </select>
                  ) : (
                    <span className="nfc-uid font-monospace">
                      {reader.present ? reader.uid : 'NO CARD'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Buttons and Contact Sensors */}
      <section className="debug-section">
        <h4>Buttons &amp; Contacts</h4>
        <div className="debug-grid-2">
          {/* Buttons */}
          <div className="button-group">
            <div className="debug-sub-title">Buttons</div>
            <div className="button-indicators">
              <div
                className={`btn-indicator ${mockMode ? 'clickable' : ''} ${hardware.buttons.intro ? 'active' : ''}`}
                onClick={() => handleButtonPress(1, 'intro')}
              >
                INTRO
              </div>
              <div
                className={`btn-indicator ${mockMode ? 'clickable' : ''} ${hardware.buttons.home ? 'active' : ''}`}
                onClick={() => handleButtonPress(0, 'home')}
              >
                HOME
              </div>
            </div>
          </div>

          {/* Contact Sensors */}
          <div className="contact-group">
            <div className="debug-sub-title">Contacts</div>
            <div className="contact-grid">
              {hardware.contacts.map((active, id) => (
                <div
                  key={id}
                  className={`contact-indicator ${mockMode ? 'clickable' : ''} ${active ? 'active' : ''}`}
                  onClick={() => handleContactToggle(id, active)}
                >
                  C{id}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="debug-footer">
        <span>Press &apos;D&apos; to hide overlay</span>
      </footer>
    </div>
  );
}
