/*
  ENIAC Six — NFC Arduino (einzelner Slot)

  Dieses Sketch läuft auf einem der 6 dedizierten NFC-Arduinos.
  Jeder NFC-Arduino verwaltet genau:
    – 1 PN532 NFC-Reader (per SPI)
    – 1 Kontaktsensor / Mikroschalter

  Serielle Ausgabe: CSV-artige Ereigniszeilen bei 115200 Baud

  Beispiele:
    CONTACT,1,ACTIVE
    CONTACT,1,INACTIVE
    NFC,1,PRESENT,04A1B2C3
    NFC,1,REMOVED

  Der Reader-Index und die Kontakt-ID sind immer 1,
  da jeder Arduino nur einen Slot kennt.
  Das Backend übersetzt die ID anhand des COM-Ports in den
  globalen Slot-Index (0–5).

  ------------------------------------------------------------
  PINBELEGUNG — Arduino Uno / Nano / Mega (anpassbar)
  ------------------------------------------------------------

  1 Kontaktsensor / Mikroschalter:
    NO  → D4
    COM → GND
    NC bleibt frei.

  1 PN532 im SPI-Modus:
    MISO → D12 (Uno) / D50 (Mega)
    MOSI → D11 (Uno) / D51 (Mega)
    SCK  → D13 (Uno) / D52 (Mega)
    SS   → D7
    GND  → GND
    VCC  → 5V (oder 3,3 V je nach Modul)

  Hinweis Mega: D53 als Hardware-SS als OUTPUT/HIGH setzen.
*/

#include <SPI.h>
#include <Adafruit_PN532.h>

// Software-Reset ohne externe Library: Sprung zu Adresse 0
void (* softReset)(void) = 0;

// ============================================================
// Konfiguration
// ============================================================

constexpr unsigned long SERIAL_BAUD = 115200;

// SS-Pin des PN532
constexpr uint8_t NFC_SS_PIN = 7;

// Pin des Kontaktsensors
constexpr uint8_t CONTACT_PIN = 8;

// Auf Mega: Hardware-SS-Pin reservieren
// Kommentiere diese Zeile aus, wenn kein Mega verwendet wird.
// constexpr uint8_t MEGA_HARDWARE_SS_PIN = 53;

// Entprellung
constexpr unsigned long DIGITAL_DEBOUNCE_MS = 30;

// NFC-Polling-Intervall (ms zwischen zwei Suchversuchen)
// Erhöht von 5ms → 50ms, um RF-Stromschwankungen auf dem Netzteil zu reduzieren.
constexpr unsigned long NFC_POLL_INTERVAL_MS = 50;

// Timeout für einen einzelnen Suchversuch
constexpr uint16_t NFC_READ_TIMEOUT_MS    = 150;
constexpr uint16_t NFC_TIMEOUT_MARGIN_MS  = 30;
constexpr unsigned long NFC_COMMAND_RECOVERY_DELAY_MS = 10;

// NFC-Initialisierungs-Debugging
constexpr bool     NFC_INIT_DEBUG          = true;
constexpr uint8_t  NFC_FIRMWARE_RETRIES    = 5;
constexpr unsigned long NFC_FIRMWARE_RETRY_DELAY_MS = 200;

// Auto-Recovery-Watchdog:
// Wenn der NFC-Reader nicht verfügbar ist, wartet der Watchdog
// NFC_REINIT_BACKOFF_MS ms und versucht dann eine Neu-Initialisierung.
// Nach NFC_MAX_REINIT_ATTEMPTS Fehlschlägen wird ein harter Reset ausgeführt.
constexpr unsigned long NFC_REINIT_BACKOFF_MS    = 2000;
constexpr uint8_t       NFC_MAX_REINIT_ATTEMPTS  = 3;

// SPI-Takt reduziert auf 500 kHz für Stabilität bei langen Jumperkabeln.
// (Standard wäre 1 MHz oder mehr.)
constexpr uint32_t SPI_CLOCK_HZ = 500000UL;

// ============================================================
// PN532-Instanz
// ============================================================

Adafruit_PN532 nfc(NFC_SS_PIN);
bool nfcAvailable    = false;
bool nfcCardPresent  = false;
bool nfcSearchArmed  = false;

unsigned long lastNfcPollTime    = 0;
unsigned long nfcFailedSince     = 0;   // Zeitstempel des ersten Fehlschlags
uint8_t       nfcReinitAttempts  = 0;   // Zähler für Reinit-Versuche

// ============================================================
// Kontaktsensor-Zustand
// ============================================================

struct DebouncedInputState {
  bool lastRawState;
  bool stableState;
  unsigned long lastRawChangeTime;
};

DebouncedInputState contactState;

// ============================================================
// Hilfsfunktionen — serielle Ausgabe
// ============================================================

void printUid(const uint8_t* uid, uint8_t uidLength) {
  for (uint8_t i = 0; i < uidLength; i++) {
    if (uid[i] < 0x10) Serial.print('0');
    Serial.print(uid[i], HEX);
  }
}

// ============================================================
// NFC — Hilfsfunktionen
// ============================================================

/*
  Sendet einen ACK-Frame, um einen noch laufenden PN532-Befehl abzubrechen.
  Wichtig nach einem Timeout von readPassiveTargetID().
*/
void abortPendingNfcCommand() {
  const uint8_t abortFrame[] = {
    PN532_SPI_DATAWRITE,
    0x00, 0x00, 0xFF, 0x00, 0xFF, 0x00
  };

  SPI.beginTransaction(SPISettings(SPI_CLOCK_HZ, LSBFIRST, SPI_MODE0));
  digitalWrite(NFC_SS_PIN, LOW);
  for (uint8_t i = 0; i < sizeof(abortFrame); i++) {
    SPI.transfer(abortFrame[i]);
  }
  digitalWrite(NFC_SS_PIN, HIGH);
  SPI.endTransaction();
  delay(5);
}

/*
  Liest einen kurzen PN532-Response-Frame und prüft Header, Länge,
  Command, Datenchecksumme und Postamble.
*/
bool readNfcResponseFrame(uint8_t command, uint8_t* responseData, uint8_t responseDataLength) {
  const uint8_t payloadLength = 2 + responseDataLength;
  const uint8_t frameLength   = payloadLength + 7;

  if (frameLength > 16) return false;

  uint8_t frame[16] = {0};
  delay(2);

  SPI.beginTransaction(SPISettings(SPI_CLOCK_HZ, LSBFIRST, SPI_MODE0));
  digitalWrite(NFC_SS_PIN, LOW);
  SPI.transfer(PN532_SPI_DATAREAD);
  for (uint8_t i = 0; i < frameLength; i++) {
    frame[i] = SPI.transfer(0x00);
  }
  digitalWrite(NFC_SS_PIN, HIGH);
  SPI.endTransaction();

  if (
    frame[0] != 0x00 ||
    frame[1] != 0x00 ||
    frame[2] != 0xFF ||
    frame[3] != payloadLength ||
    static_cast<uint8_t>(frame[3] + frame[4]) != 0x00 ||
    frame[5] != PN532_PN532TOHOST ||
    frame[6] != static_cast<uint8_t>(command + 1) ||
    frame[frameLength - 1] != 0x00
  ) {
    return false;
  }

  uint8_t checksum = 0;
  for (uint8_t i = 5; i < frameLength - 1; i++) {
    checksum += frame[i];
  }
  if (checksum != 0x00) return false;

  for (uint8_t i = 0; i < responseDataLength; i++) {
    responseData[i] = frame[7 + i];
  }
  return true;
}

/*
  Deselektiert alle aktiven NFC-Targets mit InDeselect (NICHT InRelease).

  Warum InDeselect statt InRelease?
  InRelease sendet HLTA an den Tag → Tag geht in HALT-Zustand →
  antwortet nur noch auf WUPA (0x52), nicht auf REQA (0x26).
  Die Adafruit-Library verwendet intern immer REQA, daher würde ein
  ge-HALTeter Tag beim nächsten Poll nicht mehr gefunden.

  InDeselect (ohne HLTA) lässt den Tag in IDLE-Zustand: er antwortet
  auf REQA wieder. Danach schalten wir das RF-Feld manuell ab, damit
  der Tag vollständig von der Spannungsversorgung getrennt wird und
  beim nächsten Einschalten frisch startet.
*/
bool deselectAndRfOff() {
  // 1) InDeselect(Tg=0x01) — Tag → IDLE, kein HLTA
  uint8_t deselectCmd[] = { PN532_COMMAND_INDESELECT, 0x01 };
  if (!nfc.sendCommandCheckAck(deselectCmd, sizeof(deselectCmd))) {
    return false;
  }
  uint8_t status = 0xFF;
  bool ok = readNfcResponseFrame(PN532_COMMAND_INDESELECT, &status, 1) && status == 0x00;

  // 2) RF-Feld explizit abschalten (RFConfiguration, CfgItem=0x01, AutoRFCA=0x00, RF=0x00)
  uint8_t rfOffCmd[] = { PN532_COMMAND_RFCONFIGURATION, 0x01, 0x00 };
  nfc.sendCommandCheckAck(rfOffCmd, sizeof(rfOffCmd));
  // Keine Antwort auslesen nötig — Chip bestätigt intern
  delay(5);

  return ok;
}

// ============================================================
// Initialisierung
// ============================================================

void initializeContact() {
  pinMode(CONTACT_PIN, INPUT_PULLUP);
  bool initialState = digitalRead(CONTACT_PIN);
  contactState = { initialState, initialState, millis() };
}

/*
  Initialisiert den PN532. Gibt true zurück wenn erfolgreich.
*/
bool initializeNfc() {
  // Auf Mega: Hardware-SS-Pin sichern
  // digitalWrite(MEGA_HARDWARE_SS_PIN, HIGH);
  // pinMode(MEGA_HARDWARE_SS_PIN, OUTPUT);

  digitalWrite(NFC_SS_PIN, HIGH);
  pinMode(NFC_SS_PIN, OUTPUT);

  SPI.begin();

  if (NFC_INIT_DEBUG) {
    Serial.println(F("NFC_DEBUG,STARTUP,SPI_READY"));
    Serial.flush();
  }

  nfc.begin();
  delay(30);

  uint32_t versionData = 0;

  for (uint8_t attempt = 1; attempt <= NFC_FIRMWARE_RETRIES; attempt++) {
    if (NFC_INIT_DEBUG) {
      Serial.print(F("NFC_DEBUG,1,FIRMWARE_ATTEMPT,"));
      Serial.print(attempt);
      Serial.print('/');
      Serial.println(NFC_FIRMWARE_RETRIES);
      Serial.flush();
    }

    versionData = nfc.getFirmwareVersion();

    if (versionData != 0) {
      break;
    }

    if (attempt < NFC_FIRMWARE_RETRIES) {
      delay(NFC_FIRMWARE_RETRY_DELAY_MS);
    }
  }

  if (!versionData) {
    nfcAvailable = false;
    Serial.println(F("NFC_READER,1,ERROR,NO_FIRMWARE_RESPONSE"));
    Serial.flush();
    return false;
  }

  nfcAvailable = true;

  Serial.print(F("NFC_READER,1,READY,CHIP,PN5"));
  Serial.print((versionData >> 24) & 0xFF, HEX);
  Serial.print(F(",FIRMWARE,"));
  Serial.print((versionData >> 16) & 0xFF, DEC);
  Serial.print('.');
  Serial.println((versionData >> 8) & 0xFF, DEC);

  nfc.SAMConfig();
  delay(20);

  // 0xFF = unbegrenzte Wiederholungen bis zum Timeout.
  // Wichtig für NTAG-Sticker und andere Tags mit kleiner Antenne:
  // Diese brauchen 20-50ms zum Aufwachen nach dem RF-Einschalten.
  // Mit 0x01 (nur 1 Retry ≈ 15ms) würden sie oft übersehen.
  // Mit 0xFF sendet der PN532 REQA für die vollen 150ms → alle Tag-Typen werden zuverlässig erkannt.
  bool passiveRetriesConfigured = nfc.setPassiveActivationRetries(0xFF);
  if (passiveRetriesConfigured) {
    passiveRetriesConfigured = readNfcResponseFrame(PN532_COMMAND_RFCONFIGURATION, nullptr, 0);
  }
  delay(5);

  if (NFC_INIT_DEBUG) {
    if (!passiveRetriesConfigured) {
      Serial.println(F("NFC_DEBUG,1,WARNING_PASSIVE_RETRIES_CONFIG_FAILED"));
    }
    Serial.println(F("NFC_DEBUG,1,INIT_COMPLETE"));
    Serial.flush();
  }

  // Suche armed, wenn Contact zum Zeitpunkt des Starts bereits aktiv ist
  nfcSearchArmed = nfcAvailable && (contactState.stableState == LOW);

  // Watchdog-Zähler zurücksetzen nach erfolgreichem Init
  nfcFailedSince    = 0;
  nfcReinitAttempts = 0;

  return true;
}

// ============================================================
// NFC-Watchdog (Auto-Recovery)
// ============================================================

/*
  Wird jedes Loop aufgerufen, wenn nfcAvailable == false.
  Wartet NFC_REINIT_BACKOFF_MS, dann versucht eine Neu-Initialisierung.
  Nach NFC_MAX_REINIT_ATTEMPTS Fehlschlägen → harter Reset.
*/
void checkNfcWatchdog() {
  if (nfcAvailable) return;

  unsigned long now = millis();

  // Ersten Fehler-Zeitstempel setzen
  if (nfcFailedSince == 0) {
    nfcFailedSince = now;
    return;
  }

  // Noch innerhalb der Backoff-Zeit
  if (now - nfcFailedSince < NFC_REINIT_BACKOFF_MS) return;

  // Backoff abgelaufen — Reinit versuchen
  nfcReinitAttempts++;

  if (nfcReinitAttempts > NFC_MAX_REINIT_ATTEMPTS) {
    Serial.println(F("NFC_DEBUG,1,MAX_REINIT_REACHED,SOFTRESET"));
    Serial.flush();
    delay(50);
    softReset(); // Arduino neu starten als letztes Mittel
    return;
  }

  Serial.print(F("SYSTEM,REINIT,NFC,ATTEMPT,"));
  Serial.println(nfcReinitAttempts);
  Serial.flush();

  bool ok = initializeNfc();
  if (!ok) {
    // Backoff zurücksetzen, damit wir wieder warten
    nfcFailedSince = millis();
  }
}

// ============================================================
// Kontaktsensor-Update
// ============================================================

void updateContact() {
  bool rawState = digitalRead(CONTACT_PIN);
  unsigned long now = millis();

  if (rawState != contactState.lastRawState) {
    contactState.lastRawState = rawState;
    contactState.lastRawChangeTime = now;
  }

  if (
    rawState != contactState.stableState &&
    now - contactState.lastRawChangeTime >= DIGITAL_DEBOUNCE_MS
  ) {
    contactState.stableState = rawState;
    bool isActive = (rawState == LOW); // INPUT_PULLUP: LOW = betätigt

    Serial.print(F("CONTACT,1,"));
    Serial.println(isActive ? F("ACTIVE") : F("INACTIVE"));

    if (isActive) {
      // Contact aktiviert → NFC-Suche armed (sofern Reader verfügbar)
      nfcCardPresent  = false;
      nfcSearchArmed  = nfcAvailable;
    } else {
      // Contact deaktiviert → Suche stoppen, Karte entfernt melden
      nfcSearchArmed = false;
      if (nfcCardPresent) {
        Serial.println(F("NFC,1,REMOVED"));
        nfcCardPresent = false;
      }
    }
  }
}

// ============================================================
// NFC-Polling
// ============================================================

void pollNfc() {
  // Nur pollen wenn Reader verfügbar UND Suche armed
  if (!nfcAvailable || !nfcSearchArmed) return;

  unsigned long now = millis();
  if (now - lastNfcPollTime < NFC_POLL_INTERVAL_MS) return;
  lastNfcPollTime = now;

  // Nur pollen, solange Contact aktiv
  if (contactState.stableState != LOW) return;

  uint8_t uid[7];
  uint8_t uidLength = 0;

  unsigned long readStartedAt = millis();

  bool success = nfc.readPassiveTargetID(
    PN532_MIFARE_ISO14443A,
    uid,
    &uidLength,
    NFC_READ_TIMEOUT_MS
  );

  unsigned long readDurationMs = millis() - readStartedAt;
  bool commandTimedOut = !success && (readDurationMs + NFC_TIMEOUT_MARGIN_MS >= NFC_READ_TIMEOUT_MS);

  if (commandTimedOut) {
    abortPendingNfcCommand();
    delay(NFC_COMMAND_RECOVERY_DELAY_MS);
  } else {
    delay(5);
  }

  if (!success) return;

  // Tag deselektieren (IDLE, kein HALT) + RF-Feld abschalten
  bool ok = deselectAndRfOff();
  if (!ok) {
    abortPendingNfcCommand();
    delay(NFC_COMMAND_RECOVERY_DELAY_MS);
    deselectAndRfOff();
  }

  nfcCardPresent = true;
  nfcSearchArmed = false; // Suche erst bei nächstem INACTIVE→ACTIVE wieder armed

  Serial.print(F("NFC,1,PRESENT,"));
  printUid(uid, uidLength);
  Serial.println();
}

// ============================================================
// Arduino setup / loop
// ============================================================

void setup() {
  Serial.begin(SERIAL_BAUD);

  while (!Serial) {
    delay(10);
  }

  Serial.println(F("SYSTEM,START"));
  Serial.flush();

  Serial.println(F("SYSTEM,INIT,CONTACT"));
  Serial.flush();
  initializeContact();

  Serial.println(F("SYSTEM,INIT,NFC"));
  Serial.flush();
  initializeNfc();

  Serial.println(F("SYSTEM,READY"));

  // Initialzustand des Kontaktsensors melden
  Serial.print(F("CONTACT,1,"));
  Serial.println(contactState.stableState == LOW ? F("ACTIVE") : F("INACTIVE"));
}

void loop() {
  updateContact();
  checkNfcWatchdog();  // Auto-Recovery wenn nfcAvailable == false
  pollNfc();
}
