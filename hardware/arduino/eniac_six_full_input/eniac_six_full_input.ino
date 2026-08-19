/*
  ENIAC Six – vollständige Eingabeerfassung

  Serielle Ausgabe: CSV-artige Ereigniszeilen bei 115200 Baud

  Beispiele:
    BUTTON,1,PRESSED
    CONTACT,3,ACTIVE
    POT,12,742
    NFC,2,PRESENT,04A1B2C3
    NFC,2,REMOVED
    CABLE,4,SOCKET,7
    CABLE,4,REMOVED

  ------------------------------------------------------------
  PINBELEGUNG – Arduino Mega 2560
  ------------------------------------------------------------

  16 Potentiometer:
    Poti  1 -> A0     Poti  9 -> A8
    Poti  2 -> A1     Poti 10 -> A9
    Poti  3 -> A2     Poti 11 -> A10
    Poti  4 -> A3     Poti 12 -> A11
    Poti  5 -> A4     Poti 13 -> A12
    Poti  6 -> A5     Poti 14 -> A13
    Poti  7 -> A6     Poti 15 -> A14
    Poti  8 -> A7     Poti 16 -> A15

    Je Poti:
      äußerer Pin -> 5V
      mittlerer Pin -> Analog-Pin
      anderer äußerer Pin -> GND

  2 Momentanbuttons:
    Button 1 -> D2 und GND
    Button 2 -> D3 und GND

  6 Kontaktsensoren / Mikroschalter:
    Sensor 1: NO -> D4, COM -> GND
    Sensor 2: NO -> D5, COM -> GND
    Sensor 3: NO -> D6, COM -> GND
    Sensor 4: NO -> D7, COM -> GND
    Sensor 5: NO -> D8, COM -> GND
    Sensor 6: NO -> D9, COM -> GND
    NC bleibt jeweils frei.

  6 Bananenkabel:
    Kabel 1 -> D22 über 1-kOhm-Serienwiderstand
    Kabel 2 -> D23 über 1-kOhm-Serienwiderstand
    Kabel 3 -> D24 über 1-kOhm-Serienwiderstand
    Kabel 4 -> D25 über 1-kOhm-Serienwiderstand
    Kabel 5 -> D26 über 1-kOhm-Serienwiderstand
    Kabel 6 -> D27 über 1-kOhm-Serienwiderstand

  8 Bananenbuchsen:
    Buchse 1 -> D30
    Buchse 2 -> D31
    Buchse 3 -> D32
    Buchse 4 -> D33
    Buchse 5 -> D34
    Buchse 6 -> D35
    Buchse 7 -> D36
    Buchse 8 -> D37

  6 PN532 im SPI-Modus:
    Gemeinsame Leitungen aller Reader:
      MISO -> D50
      MOSI -> D51
      SCK  -> D52
      GND  -> gemeinsames GND

    Eigene SS-Leitung pro Reader:
      NFC 1 SS -> D38
      NFC 2 SS -> D39
      NFC 3 SS -> D40
      NFC 4 SS -> D41
      NFC 5 SS -> D42
      NFC 6 SS -> D43

    D53 bleibt als Hardware-SS des Mega reserviert und wird als OUTPUT/HIGH gesetzt.

  Für eine externe 5-V-Versorgung der NFC-Reader:
    Netzteil-GND muss mit Arduino-GND verbunden sein.
*/

#include <SPI.h>
#include <Adafruit_PN532.h>
#include <string.h>

// ============================================================
// Konfiguration
// ============================================================

constexpr unsigned long SERIAL_BAUD = 115200;

constexpr uint8_t BUTTON_COUNT = 2;
constexpr uint8_t CONTACT_COUNT = 6;
constexpr uint8_t POT_COUNT = 16;
constexpr uint8_t CABLE_COUNT = 6;
constexpr uint8_t SOCKET_COUNT = 8;
constexpr uint8_t NFC_COUNT = 6;

const uint8_t BUTTON_PINS[BUTTON_COUNT] = {2, 3};
const uint8_t CONTACT_PINS[CONTACT_COUNT] = {4, 5, 6, 7, 8, 9};

const uint8_t POT_PINS[POT_COUNT] = {
  A0, A1, A2, A3, A4, A5, A6, A7,
  A8, A9, A10, A11, A12, A13, A14, A15
};

/*
  Hier zentral festlegen, welche Potentiometer aktiviert sind.

  true  = Potentiometer wird gelesen und ausgegeben
  false = Potentiometer wird vollständig übersprungen

  Aktuell aktiv: Poti 1-8 auf A0-A7
*/
const bool POT_ENABLED[POT_COUNT] = {
  true, true, true, true, true, true, true, true,
  true, true, true, true, true, true, true, true
};

const uint8_t CABLE_PINS[CABLE_COUNT] = {22, 23, 24, 25, 26, 27};
const uint8_t SOCKET_PINS[SOCKET_COUNT] = {30, 31, 32, 33, 34, 35, 36, 37};

const uint8_t NFC_SS_PINS[NFC_COUNT] = {38, 39, 44, 42, 43, 40};
constexpr uint8_t MEGA_HARDWARE_SS_PIN = 53;

/*
  Hier zentral festlegen, welche NFC-Reader aktiviert sind.

  true  = Reader wird initialisiert und abgefragt
  false = Reader wird vollständig übersprungen

  Reihenfolge: NFC 1 bis NFC 6
*/
/*
  Globaler NFC-Hauptschalter.

  false = kompletter NFC-/SPI-Teil bleibt aus (Diagnosemodus)
  true  = die unten mit NFC_ENABLED aktivierten Reader werden verwendet

  Für den ersten Hardware-Test absichtlich auf false gesetzt.
*/
constexpr bool NFC_SYSTEM_ENABLED = true;

const bool NFC_ENABLED[NFC_COUNT] = {
  true, true, true, true, false, false
};

/*
  NFC-Initialisierungs-Debugging.

  NFC_INIT_DEBUG = true  -> detaillierte Meldungen beim Start
  NFC_DEBUG_READER = 4   -> nur Reader 4 detailliert protokollieren
  NFC_DEBUG_READER = 0   -> alle aktivierten Reader detailliert protokollieren

  getFirmwareVersion() ist der entscheidende Kommunikationstest mit dem PN532.
  Für den Debug-Reader wird die Abfrage mehrfach versucht, damit man zwischen
  einem einmaligen Kommunikationsfehler und einem dauerhaft nicht erreichbaren
  Reader unterscheiden kann.
*/
constexpr bool NFC_INIT_DEBUG = false;
constexpr uint8_t NFC_DEBUG_READER = 4;
constexpr uint8_t NFC_FIRMWARE_RETRIES = 5;
constexpr unsigned long NFC_FIRMWARE_RETRY_DELAY_MS = 150;

// Entprellung für Buttons, Kontaktsensoren und Kabelverbindungen
constexpr unsigned long DIGITAL_DEBOUNCE_MS = 30;
constexpr unsigned long CABLE_DEBOUNCE_MS = 50;

// Potentiometer werden nur bei einer merklichen Änderung ausgegeben.
constexpr unsigned long POT_READ_INTERVAL_MS = 50;
constexpr int POT_CHANGE_THRESHOLD = 40;

// Kabelmatrix
constexpr unsigned long CABLE_SCAN_INTERVAL_MS = 20;
constexpr unsigned int CABLE_SETTLE_TIME_US = 100;

// Pro Durchlauf wird nur ein NFC-Reader abgefragt.
constexpr unsigned long NFC_POLL_INTERVAL_MS = 5;
constexpr uint16_t NFC_READ_TIMEOUT_MS = 20;
constexpr uint8_t NFC_REMOVAL_MISSES = 2;

// ============================================================
// PN532-Instanzen
// ============================================================

Adafruit_PN532 nfc1(NFC_SS_PINS[0]);
Adafruit_PN532 nfc2(NFC_SS_PINS[1]);
Adafruit_PN532 nfc3(NFC_SS_PINS[2]);
Adafruit_PN532 nfc4(NFC_SS_PINS[3]);
Adafruit_PN532 nfc5(NFC_SS_PINS[4]);
Adafruit_PN532 nfc6(NFC_SS_PINS[5]);

Adafruit_PN532* const NFC_READERS[NFC_COUNT] = {
  &nfc1, &nfc2, &nfc3, &nfc4, &nfc5, &nfc6
};

bool nfcAvailable[NFC_COUNT] = {false, false, false, false, false, false};
bool nfcCardPresent[NFC_COUNT] = {false, false, false, false, false, false};
uint8_t lastNfcUid[NFC_COUNT][7] = {};
uint8_t lastNfcUidLength[NFC_COUNT] = {0, 0, 0, 0, 0, 0};
uint8_t nfcMissCount[NFC_COUNT] = {0, 0, 0, 0, 0, 0};
uint8_t nextNfcReader = 0;
unsigned long lastNfcPollTime = 0;

// ============================================================
// Zustände der digitalen Eingänge
// ============================================================

struct DebouncedInputState {
  bool lastRawState;
  bool stableState;
  unsigned long lastRawChangeTime;
};

DebouncedInputState buttonStates[BUTTON_COUNT];
DebouncedInputState contactStates[CONTACT_COUNT];

// ============================================================
// Potentiometerzustände
// ============================================================

int lastPotValue[POT_COUNT];
unsigned long lastPotReadTime = 0;

// ============================================================
// Kabel-/Buchsen-Zustände
// ============================================================

/*
  -1: Kabel nicht eingesteckt
   0 bis 7: Buchse 1 bis 8
  -2: mehrere Buchsen gleichzeitig erkannt
*/
int8_t rawSocketForCable[CABLE_COUNT];
int8_t stableSocketForCable[CABLE_COUNT];
unsigned long cableRawChangeTime[CABLE_COUNT];
unsigned long lastCableScanTime = 0;

// ============================================================
// Hilfsfunktionen – serielle Ausgabe
// ============================================================

void printDigitalEvent(
  const char* category,
  uint8_t number,
  bool isActive
) {
  Serial.print(category);
  Serial.print(',');
  Serial.print(number);
  Serial.print(',');

  if (strcmp(category, "BUTTON") == 0) {
    Serial.println(isActive ? F("PRESSED") : F("RELEASED"));
  } else {
    Serial.println(isActive ? F("ACTIVE") : F("INACTIVE"));
  }
}

void printUid(const uint8_t* uid, uint8_t uidLength) {
  for (uint8_t i = 0; i < uidLength; i++) {
    if (uid[i] < 0x10) {
      Serial.print('0');
    }
    Serial.print(uid[i], HEX);
  }
}

bool uidEquals(
  const uint8_t* uidA,
  uint8_t lengthA,
  const uint8_t* uidB,
  uint8_t lengthB
) {
  if (lengthA != lengthB) {
    return false;
  }

  for (uint8_t i = 0; i < lengthA; i++) {
    if (uidA[i] != uidB[i]) {
      return false;
    }
  }

  return true;
}

// ============================================================
// Initialisierung
// ============================================================

void initializeDigitalInputs() {
  for (uint8_t i = 0; i < BUTTON_COUNT; i++) {
    pinMode(BUTTON_PINS[i], INPUT_PULLUP);

    bool initialState = digitalRead(BUTTON_PINS[i]);
    buttonStates[i] = {initialState, initialState, millis()};
  }

  for (uint8_t i = 0; i < CONTACT_COUNT; i++) {
    pinMode(CONTACT_PINS[i], INPUT_PULLUP);

    bool initialState = digitalRead(CONTACT_PINS[i]);
    contactStates[i] = {initialState, initialState, millis()};
  }
}

void initializePotentiometers() {
  for (uint8_t i = 0; i < POT_COUNT; i++) {
    pinMode(POT_PINS[i], INPUT);
    lastPotValue[i] = -1;
  }
}

void setAllCablePinsHighImpedance() {
  for (uint8_t i = 0; i < CABLE_COUNT; i++) {
    // LOW schreiben, damit beim Umschalten auf INPUT kein Pull-up aktiv bleibt.
    digitalWrite(CABLE_PINS[i], LOW);
    pinMode(CABLE_PINS[i], INPUT);
  }
}

void initializeCableMatrix() {
  for (uint8_t i = 0; i < SOCKET_COUNT; i++) {
    pinMode(SOCKET_PINS[i], INPUT_PULLUP);
  }

  setAllCablePinsHighImpedance();

  for (uint8_t i = 0; i < CABLE_COUNT; i++) {
    rawSocketForCable[i] = -1;
    stableSocketForCable[i] = -1;
    cableRawChangeTime[i] = millis();
  }
}

bool shouldDebugNfcReader(uint8_t readerIndex) {
  if (!NFC_INIT_DEBUG) {
    return false;
  }

  // 0 bedeutet: alle Reader detailliert debuggen.
  return NFC_DEBUG_READER == 0 || NFC_DEBUG_READER == readerIndex + 1;
}

void deselectAllNfcReaders() {
  for (uint8_t i = 0; i < NFC_COUNT; i++) {
    digitalWrite(NFC_SS_PINS[i], HIGH);
  }
}

void printNfcDebug(uint8_t readerIndex, const __FlashStringHelper* message) {
  Serial.print(F("NFC_DEBUG,"));
  Serial.print(readerIndex + 1);
  Serial.print(',');
  Serial.println(message);
}

uint32_t readNfcFirmwareWithDebug(uint8_t readerIndex) {
  const bool debugThisReader = shouldDebugNfcReader(readerIndex);
  const uint8_t attempts = debugThisReader ? NFC_FIRMWARE_RETRIES : 1;

  uint32_t versionData = 0;

  for (uint8_t attempt = 1; attempt <= attempts; attempt++) {
    // Vor jedem Versuch sicherstellen, dass kein anderer PN532 selektiert ist.
    deselectAllNfcReaders();
    delay(5);

    if (debugThisReader) {
      Serial.print(F("NFC_DEBUG,"));
      Serial.print(readerIndex + 1);
      Serial.print(F(",FIRMWARE_ATTEMPT,"));
      Serial.print(attempt);
      Serial.print('/');
      Serial.println(attempts);
    }

    versionData = NFC_READERS[readerIndex]->getFirmwareVersion();

    if (debugThisReader) {
      Serial.print(F("NFC_DEBUG,"));
      Serial.print(readerIndex + 1);
      Serial.print(F(",FIRMWARE_RAW,0x"));
      Serial.println(versionData, HEX);
    }

    if (versionData != 0) {
      if (debugThisReader && attempt > 1) {
        Serial.print(F("NFC_DEBUG,"));
        Serial.print(readerIndex + 1);
        Serial.print(F(",RECOVERED_ON_ATTEMPT,"));
        Serial.println(attempt);
      }
      break;
    }

    if (attempt < attempts) {
      delay(NFC_FIRMWARE_RETRY_DELAY_MS);
    }
  }

  return versionData;
}

void initializeNfcReaders() {
  // Alle Chip-Select-Leitungen zuerst sicher deaktivieren.
  // Auch deaktivierte Reader bekommen ein festes HIGH auf SS,
  // damit kein Chip-Select-Pin floatet.
  pinMode(MEGA_HARDWARE_SS_PIN, OUTPUT);
  digitalWrite(MEGA_HARDWARE_SS_PIN, HIGH);

  for (uint8_t i = 0; i < NFC_COUNT; i++) {
    pinMode(NFC_SS_PINS[i], OUTPUT);
    digitalWrite(NFC_SS_PINS[i], HIGH);
  }

  if (!NFC_SYSTEM_ENABLED) {
    for (uint8_t i = 0; i < NFC_COUNT; i++) {
      nfcAvailable[i] = false;
    }
    Serial.println(F("NFC_SYSTEM,DISABLED"));
    return;
  }

  bool anyNfcEnabled = false;
  for (uint8_t i = 0; i < NFC_COUNT; i++) {
    if (NFC_ENABLED[i]) {
      anyNfcEnabled = true;
      break;
    }
  }

  if (!anyNfcEnabled) {
    Serial.println(F("NFC_SYSTEM,NO_READERS_ENABLED"));
    return;
  }

  if (NFC_INIT_DEBUG) {
    Serial.println(F("NFC_DEBUG,SPI,BEFORE_BEGIN"));
  }

  SPI.begin();
  deselectAllNfcReaders();

  if (NFC_INIT_DEBUG) {
    Serial.println(F("NFC_DEBUG,SPI,AFTER_BEGIN"));
  }

  for (uint8_t i = 0; i < NFC_COUNT; i++) {
    if (!NFC_ENABLED[i]) {
      nfcAvailable[i] = false;
      Serial.print(F("NFC_READER,"));
      Serial.print(i + 1);
      Serial.println(F(",DISABLED"));
      continue;
    }

    const bool debugThisReader = shouldDebugNfcReader(i);

    // Wichtig bei mehreren PN532 am selben SPI-Bus:
    // vor der Initialisierung alle CS/SS-Leitungen auf HIGH setzen.
    deselectAllNfcReaders();

    if (debugThisReader) {
      printNfcDebug(i, F("DEBUG_START"));

      Serial.print(F("NFC_DEBUG,"));
      Serial.print(i + 1);
      Serial.print(F(",SS_PIN,D"));
      Serial.println(NFC_SS_PINS[i]);

      Serial.print(F("NFC_DEBUG,"));
      Serial.print(i + 1);
      Serial.print(F(",SS_IDLE_LEVEL,"));
      Serial.println(digitalRead(NFC_SS_PINS[i]) == HIGH ? F("HIGH") : F("LOW"));

      printNfcDebug(i, F("BEFORE_BEGIN"));
    }

    NFC_READERS[i]->begin();
    delay(20);

    if (debugThisReader) {
      printNfcDebug(i, F("AFTER_BEGIN"));
    }

    uint32_t versionData = readNfcFirmwareWithDebug(i);

    if (!versionData) {
      nfcAvailable[i] = false;

      Serial.print(F("NFC_READER,"));
      Serial.print(i + 1);
      Serial.println(F(",ERROR,NO_FIRMWARE_RESPONSE"));

      if (debugThisReader) {
        printNfcDebug(i, F("FAILED_AT_GET_FIRMWARE_VERSION"));
        printNfcDebug(i, F("BEGIN_RETURNED_BUT_PN532_DID_NOT_ANSWER"));
        printNfcDebug(i, F("CHECK_SS_D41_POWER_GND_OR_READER_IF_SHARED_SPI_READERS_WORK"));
      }
      continue;
    }

    nfcAvailable[i] = true;

    // Normale READY-Ausgabe beibehalten.
    Serial.print(F("NFC_READER,"));
    Serial.print(i + 1);
    Serial.print(F(",READY,CHIP,PN5"));
    Serial.print((versionData >> 24) & 0xFF, HEX);
    Serial.print(F(",FIRMWARE,"));
    Serial.print((versionData >> 16) & 0xFF, DEC);
    Serial.print('.');
    Serial.println((versionData >> 8) & 0xFF, DEC);

    if (debugThisReader) {
      printNfcDebug(i, F("BEFORE_SAM_CONFIG"));
    }

    NFC_READERS[i]->SAMConfig();
    delay(20);

    if (debugThisReader) {
      printNfcDebug(i, F("AFTER_SAM_CONFIG"));
      printNfcDebug(i, F("INIT_COMPLETE"));
    }
  }

  deselectAllNfcReaders();
}

// ============================================================
// Digitale Eingänge
// ============================================================

void updateDebouncedInput(
  uint8_t pin,
  const char* category,
  uint8_t number,
  DebouncedInputState& state
) {
  bool rawState = digitalRead(pin);
  unsigned long now = millis();

  if (rawState != state.lastRawState) {
    state.lastRawState = rawState;
    state.lastRawChangeTime = now;
  }

  if (
    rawState != state.stableState &&
    now - state.lastRawChangeTime >= DIGITAL_DEBOUNCE_MS
  ) {
    state.stableState = rawState;

    // INPUT_PULLUP: LOW bedeutet betätigt.
    printDigitalEvent(category, number, state.stableState == LOW);
  }
}

void readButtonsAndContacts() {
  for (uint8_t i = 0; i < BUTTON_COUNT; i++) {
    updateDebouncedInput(
      BUTTON_PINS[i],
      "BUTTON",
      i + 1,
      buttonStates[i]
    );
  }

  for (uint8_t i = 0; i < CONTACT_COUNT; i++) {
    updateDebouncedInput(
      CONTACT_PINS[i],
      "CONTACT",
      i + 1,
      contactStates[i]
    );
  }
}


void printInitialDigitalStates() {
  for (uint8_t i = 0; i < BUTTON_COUNT; i++) {
    printDigitalEvent(
      "BUTTON",
      i + 1,
      buttonStates[i].stableState == LOW
    );
  }

  for (uint8_t i = 0; i < CONTACT_COUNT; i++) {
    printDigitalEvent(
      "CONTACT",
      i + 1,
      contactStates[i].stableState == LOW
    );
  }
}

// ============================================================
// Potentiometer
// ============================================================

void readPotentiometers() {
  unsigned long now = millis();

  if (now - lastPotReadTime < POT_READ_INTERVAL_MS) {
    return;
  }

  lastPotReadTime = now;

  for (uint8_t i = 0; i < POT_COUNT; i++) {
    // Deaktivierte Potentiometer weder lesen noch ausgeben.
    if (!POT_ENABLED[i]) {
      continue;
    }

    /*
      Der erste Messwert wird verworfen. Das reduziert Übersprechen,
      wenn der ADC zwischen verschiedenen Analogkanälen umschaltet.
    */
    analogRead(POT_PINS[i]);
    int value = analogRead(POT_PINS[i]);

    if (
      lastPotValue[i] == -1 ||
      abs(value - lastPotValue[i]) >= POT_CHANGE_THRESHOLD
    ) {
      lastPotValue[i] = value;

      Serial.print(F("POT,"));
      Serial.print(i + 1);
      Serial.print(',');
      Serial.println(value);
    }
  }
}

// ============================================================
// Bananenkabel und Buchsen
// ============================================================

int8_t detectSocketForCable(uint8_t cableIndex) {
  setAllCablePinsHighImpedance();

  // Nur das aktuell geprüfte Kabel wird auf LOW gezogen.
  digitalWrite(CABLE_PINS[cableIndex], LOW);
  pinMode(CABLE_PINS[cableIndex], OUTPUT);

  delayMicroseconds(CABLE_SETTLE_TIME_US);

  int8_t detectedSocket = -1;
  uint8_t detectionCount = 0;

  for (uint8_t socketIndex = 0; socketIndex < SOCKET_COUNT; socketIndex++) {
    if (digitalRead(SOCKET_PINS[socketIndex]) == LOW) {
      detectedSocket = static_cast<int8_t>(socketIndex);
      detectionCount++;
    }
  }

  // Das geprüfte Kabel sofort wieder hochohmig setzen.
  digitalWrite(CABLE_PINS[cableIndex], LOW);
  pinMode(CABLE_PINS[cableIndex], INPUT);

  if (detectionCount > 1) {
    return -2;
  }

  return detectedSocket;
}

void printCableState(uint8_t cableIndex, int8_t socketState) {
  Serial.print(F("CABLE,"));
  Serial.print(cableIndex + 1);
  Serial.print(',');

  if (socketState >= 0) {
    Serial.print(F("SOCKET,"));
    Serial.println(socketState + 1);
  } else if (socketState == -1) {
    Serial.println(F("REMOVED"));
  } else {
    Serial.println(F("ERROR_MULTIPLE_SOCKETS"));
  }
}

void scanCableConnections() {
  unsigned long now = millis();

  if (now - lastCableScanTime < CABLE_SCAN_INTERVAL_MS) {
    return;
  }

  lastCableScanTime = now;

  for (uint8_t cableIndex = 0; cableIndex < CABLE_COUNT; cableIndex++) {
    int8_t detectedSocket = detectSocketForCable(cableIndex);

    if (detectedSocket != rawSocketForCable[cableIndex]) {
      rawSocketForCable[cableIndex] = detectedSocket;
      cableRawChangeTime[cableIndex] = now;
    }

    if (
      rawSocketForCable[cableIndex] != stableSocketForCable[cableIndex] &&
      now - cableRawChangeTime[cableIndex] >= CABLE_DEBOUNCE_MS
    ) {
      stableSocketForCable[cableIndex] = rawSocketForCable[cableIndex];
      printCableState(cableIndex, stableSocketForCable[cableIndex]);
    }
  }

  setAllCablePinsHighImpedance();
}

// ============================================================
// NFC-Reader
// ============================================================

void pollOneNfcReader() {
  if (!NFC_SYSTEM_ENABLED) {
    return;
  }

  unsigned long now = millis();

  if (now - lastNfcPollTime < NFC_POLL_INTERVAL_MS) {
    return;
  }

  lastNfcPollTime = now;

  // Den nächsten aktivierten Reader suchen.
  // Dadurch verschwenden deaktivierte Reader keine Poll-Zyklen.
  uint8_t readerIndex = nextNfcReader;
  bool foundEnabledReader = false;

  for (uint8_t attempts = 0; attempts < NFC_COUNT; attempts++) {
    if (NFC_ENABLED[readerIndex]) {
      foundEnabledReader = true;
      break;
    }

    readerIndex = (readerIndex + 1) % NFC_COUNT;
  }

  if (!foundEnabledReader) {
    return;
  }

  nextNfcReader = (readerIndex + 1) % NFC_COUNT;

  if (!nfcAvailable[readerIndex]) {
    return;
  }

  uint8_t uid[7];
  uint8_t uidLength = 0;

  bool success = NFC_READERS[readerIndex]->readPassiveTargetID(
    PN532_MIFARE_ISO14443A,
    uid,
    &uidLength,
    NFC_READ_TIMEOUT_MS
  );

  if (!success) {
    if (nfcMissCount[readerIndex] < 255) {
      nfcMissCount[readerIndex]++;
    }

    if (
      nfcCardPresent[readerIndex] &&
      nfcMissCount[readerIndex] >= NFC_REMOVAL_MISSES
    ) {
      nfcCardPresent[readerIndex] = false;
      lastNfcUidLength[readerIndex] = 0;

      Serial.print(F("NFC,"));
      Serial.print(readerIndex + 1);
      Serial.println(F(",REMOVED"));
    }

    return;
  }

  nfcMissCount[readerIndex] = 0;

  bool uidChanged = !uidEquals(
    uid,
    uidLength,
    lastNfcUid[readerIndex],
    lastNfcUidLength[readerIndex]
  );

  if (!nfcCardPresent[readerIndex] || uidChanged) {
    nfcCardPresent[readerIndex] = true;
    lastNfcUidLength[readerIndex] = uidLength;

    for (uint8_t i = 0; i < uidLength; i++) {
      lastNfcUid[readerIndex][i] = uid[i];
    }

    Serial.print(F("NFC,"));
    Serial.print(readerIndex + 1);
    Serial.print(F(",PRESENT,"));
    printUid(uid, uidLength);
    Serial.println();
  }
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

  initializeDigitalInputs();
  initializePotentiometers();
  initializeCableMatrix();
  initializeNfcReaders();

  Serial.println(F("SYSTEM,READY"));
  printInitialDigitalStates();
}

void loop() {
  readButtonsAndContacts();
  readPotentiometers();
  scanCableConnections();
  pollOneNfcReader();
}