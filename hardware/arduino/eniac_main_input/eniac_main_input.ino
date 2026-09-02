/*
  ENIAC Six — Haupt-Arduino (Mega 2560)

  Dieses Sketch läuft auf dem zentralen Arduino Mega.
  Es verwaltet alle Eingaben AUSSER NFC und Kontaktsensoren.
  Diese werden von den 6 dedizierten NFC-Arduinos übernommen.

  Serielle Ausgabe: CSV-artige Ereigniszeilen bei 115200 Baud

  Beispiele:
    BUTTON,1,PRESSED
    BUTTON,1,RELEASED
    POT,12,742
    CABLE,4,SOCKET,7
    CABLE,4,REMOVED

  ------------------------------------------------------------
  PINBELEGUNG — Arduino Mega 2560
  ------------------------------------------------------------

  16 Potentiometer:
    Poti  1 → A0     Poti  9 → A8
    Poti  2 → A1     Poti 10 → A9
    Poti  3 → A2     Poti 11 → A10
    Poti  4 → A3     Poti 12 → A11
    Poti  5 → A4     Poti 13 → A12
    Poti  6 → A5     Poti 14 → A13
    Poti  7 → A6     Poti 15 → A14
    Poti  8 → A7     Poti 16 → A15

    Je Poti:
      äußerer Pin → 5V
      mittlerer Pin → Analog-Pin
      anderer äußerer Pin → GND

  2 Momentanbuttons:
    Button 1 → D2 und GND
    Button 2 → D3 und GND

  6 Bananenkabel:
    Kabel 1 → D22 über 1-kOhm-Serienwiderstand
    Kabel 2 → D23 über 1-kOhm-Serienwiderstand
    Kabel 3 → D24 über 1-kOhm-Serienwiderstand
    Kabel 4 → D25 über 1-kOhm-Serienwiderstand
    Kabel 5 → D26 über 1-kOhm-Serienwiderstand
    Kabel 6 → D27 über 1-kOhm-Serienwiderstand

  8 Bananenbuchsen:
    Buchse 1 → D30
    Buchse 2 → D31
    Buchse 3 → D32
    Buchse 4 → D33
    Buchse 5 → D34
    Buchse 6 → D35
    Buchse 7 → D36
    Buchse 8 → D37
*/

// ============================================================
// Konfiguration
// ============================================================

constexpr unsigned long SERIAL_BAUD = 115200;

constexpr uint8_t BUTTON_COUNT = 2;
constexpr uint8_t POT_COUNT    = 16;
constexpr uint8_t CABLE_COUNT  = 6;
constexpr uint8_t SOCKET_COUNT = 8;

const uint8_t BUTTON_PINS[BUTTON_COUNT] = {2, 3};

const uint8_t POT_PINS[POT_COUNT] = {
  A0, A1, A2, A3, A4, A5, A6, A7,
  A8, A9, A10, A11, A12, A13, A14, A15
};

/*
  Hier zentral festlegen, welche Potentiometer aktiviert sind.

  true  = Potentiometer wird gelesen und ausgegeben
  false = Potentiometer wird vollständig übersprungen
*/
const bool POT_ENABLED[POT_COUNT] = {
  true, true, true, true, true, true, true, true,
  true, true, true, true, true, true, true, true
};

const uint8_t CABLE_PINS[CABLE_COUNT]   = {22, 23, 24, 25, 26, 27};
const uint8_t SOCKET_PINS[SOCKET_COUNT] = {30, 31, 32, 33, 34, 35, 36, 37};

// Entprellung
constexpr unsigned long DIGITAL_DEBOUNCE_MS = 30;
constexpr unsigned long CABLE_DEBOUNCE_MS   = 50;

// Potentiometer — nur bei merklicher Änderung ausgeben
constexpr unsigned long POT_READ_INTERVAL_MS = 50;
constexpr int           POT_CHANGE_THRESHOLD = 40;

// Kabelmatrix
constexpr unsigned long CABLE_SCAN_INTERVAL_MS = 20;
constexpr unsigned int  CABLE_SETTLE_TIME_US   = 100;

// ============================================================
// Zustände
// ============================================================

struct DebouncedInputState {
  bool lastRawState;
  bool stableState;
  unsigned long lastRawChangeTime;
};

DebouncedInputState buttonStates[BUTTON_COUNT];

int          lastPotValue[POT_COUNT];
unsigned long lastPotReadTime = 0;

/*
  -1:    Kabel nicht eingesteckt
   0–7:  Buchse 1–8 (0-basiert)
  -2:    mehrere Buchsen gleichzeitig erkannt
*/
int8_t  rawSocketForCable[CABLE_COUNT];
int8_t  stableSocketForCable[CABLE_COUNT];
unsigned long cableRawChangeTime[CABLE_COUNT];
unsigned long lastCableScanTime = 0;

// ============================================================
// Hilfsfunktionen — serielle Ausgabe
// ============================================================

void printDigitalEvent(const char* category, uint8_t number, bool isActive) {
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

// ============================================================
// Initialisierung
// ============================================================

void initializeDigitalInputs() {
  for (uint8_t i = 0; i < BUTTON_COUNT; i++) {
    pinMode(BUTTON_PINS[i], INPUT_PULLUP);
    bool initialState = digitalRead(BUTTON_PINS[i]);
    buttonStates[i] = {initialState, initialState, millis()};
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
    rawSocketForCable[i]    = -1;
    stableSocketForCable[i] = -1;
    cableRawChangeTime[i]   = millis();
  }
}

// ============================================================
// Digitale Eingänge (Buttons)
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

void readButtons() {
  for (uint8_t i = 0; i < BUTTON_COUNT; i++) {
    updateDebouncedInput(
      BUTTON_PINS[i],
      "BUTTON",
      i + 1,
      buttonStates[i]
    );
  }
}

void printInitialButtonStates() {
  for (uint8_t i = 0; i < BUTTON_COUNT; i++) {
    printDigitalEvent(
      "BUTTON",
      i + 1,
      buttonStates[i].stableState == LOW
    );
  }
}

// ============================================================
// Potentiometer
// ============================================================

void readPotentiometers() {
  unsigned long now = millis();

  if (now - lastPotReadTime < POT_READ_INTERVAL_MS) return;
  lastPotReadTime = now;

  for (uint8_t i = 0; i < POT_COUNT; i++) {
    if (!POT_ENABLED[i]) continue;

    // Ersten Messwert verwerfen (ADC-Übersprechen reduzieren)
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

  digitalWrite(CABLE_PINS[cableIndex], LOW);
  pinMode(CABLE_PINS[cableIndex], INPUT);

  if (detectionCount > 1) return -2;
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

  if (now - lastCableScanTime < CABLE_SCAN_INTERVAL_MS) return;
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
// Arduino setup / loop
// ============================================================

void setup() {
  Serial.begin(SERIAL_BAUD);

  while (!Serial) {
    delay(10);
  }

  Serial.println(F("SYSTEM,START"));
  Serial.flush();

  Serial.println(F("SYSTEM,INIT,DIGITAL"));
  Serial.flush();
  initializeDigitalInputs();

  Serial.println(F("SYSTEM,INIT,POTENTIOMETERS"));
  Serial.flush();
  initializePotentiometers();

  Serial.println(F("SYSTEM,INIT,CABLE_MATRIX"));
  Serial.flush();
  initializeCableMatrix();

  Serial.println(F("SYSTEM,READY"));
  printInitialButtonStates();
}

void loop() {
  readButtons();
  readPotentiometers();
  scanCableConnections();
}
