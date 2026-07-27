// ==========================================
// ENIAC Six — Arduino Mega Haupt-Sketch (v2)
//
// Liest alle Hardware-Sensoren aus und sendet
// JSON-Events über die serielle Schnittstelle
// an den Node.js Server.
//
// BENÖTIGTE BIBLIOTHEKEN (Arduino Library Manager):
// - MFRC522 (von GithubCommunity)
// - ArduinoJson (von Benoit Blanchon)
//
// PIN-BELEGUNG:
// - A0–A15:  16 Potentiometer (direkt)
// - D22–D29: 8 Bananenbuchsen (RC-Zeitmessung)
// - D30–D35: 6 Kontaktsensoren
// - D36–D37: 2 Taster (Home, Intro)
// - D38–D43: 6 NFC Reader (SS/CS)
// - D44:     NFC Reader (RST, geteilt)
// - D50–D52: SPI (MISO, MOSI, SCK)
// ==========================================

#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>

// ==========================================
// PIN-DEFINITIONEN
// ==========================================

// --- Potentiometer (direkt an Analog-Pins) ---
const int POT_PINS[16] = {
  A0, A1, A2, A3,     // Pioneering:  Speed, Size, Amount, Rotate
  A4, A5, A6, A7,     // Programming: Speed, Size, Amount, Rotate
  A8, A9, A10, A11,   // Recognition: Speed, Size, Amount, Rotate
  A12, A13, A14, A15   // Teamwork:    Speed, Size, Amount, Rotate
};

// --- Bananenbuchsen (Digital-Pins mit RC-Zeitmessung) ---
const int BANANA_PINS[8] = {22, 23, 24, 25, 26, 27, 28, 29};
const char* BANANA_THEMES[8] = {
  "pioneering", "pioneering",
  "programming", "programming",
  "recognition", "recognition",
  "teamwork", "teamwork"
};
const int BANANA_SOCKETS[8] = {0, 1, 0, 1, 0, 1, 0, 1};

// --- Kontakt-Sensoren ---
const int CONTACT_PINS[6] = {30, 31, 32, 33, 34, 35};

// --- Buttons ---
const int BUTTON_HOME = 36;
const int BUTTON_INTRO = 37;

// --- NFC (MFRC522) ---
const int NFC_RST = 44;
const int NFC_SS[6] = {38, 39, 40, 41, 42, 43};


// ==========================================
// ZUSTANDSSPEICHER (für Änderungserkennung)
// ==========================================

// Potentiometer
int lastPotValues[16];
const int POT_THRESHOLD = 5; // Änderungen < 5 ignorieren (Rauschfilter)

// Bananenstecker
String lastBananaState[8];
unsigned long lastBananaDebounceTime[8];
String pendingBananaState[8];
const unsigned long DEBOUNCE_DELAY = 50; // 50 ms Entprellung

// Kontakte
bool lastContactState[6];
unsigned long lastContactDebounceTime[6];
bool pendingContactState[6];

// Buttons
bool lastButtonHome = false;
bool lastButtonIntro = false;
unsigned long lastButtonHomeDebounceTime = 0;
unsigned long lastButtonIntroDebounceTime = 0;
bool pendingButtonHome = false;
bool pendingButtonIntro = false;

// NFC
bool lastNfcPresent[6];
String lastNfcUid[6];
unsigned long lastNfcCheckTime = 0;
const unsigned long NFC_CHECK_INTERVAL = 250; // Alle 250 ms scannen

// NFC Reader Instanzen
MFRC522 nfcReaders[6];


// ==========================================
// HILFSFUNKTIONEN
// ==========================================

/**
 * RC-Zeitmessung: Misst die Ladezeit eines Kondensators (100nF)
 * über den Widerstand im Bananenkabel und identifiziert die
 * Programmiererin anhand der Ladedauer.
 *
 * Ablauf:
 * 1. Kondensator entladen (Pin → OUTPUT LOW)
 * 2. Pin auf INPUT umschalten → Kondensator lädt sich auf
 * 3. Messen, wie lange es bis HIGH dauert
 * 4. Anhand der Zeit die Programmiererin zuordnen
 */
String measureBananaSocket(int pin) {
  // Schritt 1: Kondensator entladen
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
  delayMicroseconds(1000); // 1 ms zum Entladen

  // Schritt 2: Pin auf Eingang schalten, Ladezeit messen
  pinMode(pin, INPUT);  // Kein Pull-up! Pin ist hochohmig.
  unsigned long startTime = micros();
  unsigned long timeout = 6000; // 6 ms Timeout → nichts angeschlossen

  while (digitalRead(pin) == LOW) {
    unsigned long elapsed = micros() - startTime;
    if (elapsed > timeout) {
      return ""; // Timeout = kein Stecker eingesteckt
    }
  }

  unsigned long chargeTime = micros() - startTime;

  // Schritt 3: Programmiererin anhand der Ladezeit bestimmen
  // Werte basierend auf 100nF Kondensator + Identifikationswiderstand
  //
  // Widerstand  →  Erwartete Zeit  →  Erkennungsbereich
  // 1 kΩ (McNulty)    ~92 µs          < 150 µs
  // 2.2 kΩ (Jennings) ~202 µs         150 – 300 µs
  // 4.7 kΩ (Snyder)   ~431 µs         300 – 650 µs
  // 10 kΩ (Wescoff)   ~916 µs         650 – 1400 µs
  // 22 kΩ (Bilas)     ~2015 µs        1400 – 3000 µs
  // 47 kΩ (Lichterman)~4305 µs        3000 – 5500 µs

  if (chargeTime < 150)  return "mcnulty";
  if (chargeTime < 300)  return "jennings";
  if (chargeTime < 650)  return "snyder";
  if (chargeTime < 1400) return "wescoff";
  if (chargeTime < 3000) return "bilas";
  if (chargeTime < 5500) return "lichterman";

  return ""; // Unbekannter Wert oder Rauschen
}

/**
 * NFC-UID als Hex-String formatieren (Großbuchstaben).
 * Beispiel: {0x04, 0xA1, 0x7C, 0x02} → "04A17C02"
 */
String uidToHexString(byte *buffer, byte bufferSize) {
  String out = "";
  for (byte i = 0; i < bufferSize; i++) {
    if (buffer[i] < 0x10) out += "0";
    out += String(buffer[i], HEX);
  }
  out.toUpperCase();
  return out;
}


// ==========================================
// SETUP
// ==========================================

void setup() {
  Serial.begin(115200);
  while (!Serial); // Warten, bis Serial bereit ist

  // --- Potentiometer-Pins als Eingang (Standard, aber explizit) ---
  for (int i = 0; i < 16; i++) {
    pinMode(POT_PINS[i], INPUT);
    lastPotValues[i] = -1; // -1 erzwingt erste Sendung
  }

  // --- Kontakt-Sensoren (mit internem Pull-Up) ---
  for (int i = 0; i < 6; i++) {
    pinMode(CONTACT_PINS[i], INPUT_PULLUP);
    lastContactState[i] = false;
    pendingContactState[i] = false;
    lastContactDebounceTime[i] = 0;
  }

  // --- Buttons (mit internem Pull-Up) ---
  pinMode(BUTTON_HOME, INPUT_PULLUP);
  pinMode(BUTTON_INTRO, INPUT_PULLUP);

  // --- Bananenbuchsen Zustand initialisieren ---
  for (int i = 0; i < 8; i++) {
    lastBananaState[i] = "";
    pendingBananaState[i] = "";
    lastBananaDebounceTime[i] = 0;
  }

  // --- NFC Zustand initialisieren ---
  for (int i = 0; i < 6; i++) {
    lastNfcPresent[i] = false;
    lastNfcUid[i] = "";
  }

  // --- SPI-Bus initialisieren (für NFC-Reader) ---
  SPI.begin();

  // --- NFC-Reader initialisieren ---
  for (int i = 0; i < 6; i++) {
    nfcReaders[i] = MFRC522(NFC_SS[i], NFC_RST);
    nfcReaders[i].PCD_Init();
  }

  // --- Startmeldung ---
  Serial.println("ENIAC Six Arduino ready");
}


// ==========================================
// MAIN LOOP
// ==========================================

void loop() {
  unsigned long currentMillis = millis();

  // ─────────────────────────────────────────
  // 1. POTENTIOMETER AUSLESEN (direkt, A0–A15)
  // ─────────────────────────────────────────
  for (int i = 0; i < 16; i++) {
    int rawValue = analogRead(POT_PINS[i]);

    // Nur senden wenn sich der Wert um mindestens POT_THRESHOLD geändert hat
    if (lastPotValues[i] == -1 || abs(rawValue - lastPotValues[i]) >= POT_THRESHOLD) {
      lastPotValues[i] = rawValue;

      // JSON zusammenbauen und senden
#if ARDUINOJSON_VERSION_MAJOR >= 7
      JsonDocument doc;
#else
      StaticJsonDocument<128> doc;
#endif
      doc["type"] = "pot";
      doc["id"] = i;
      doc["value"] = rawValue;

      serializeJson(doc, Serial);
      Serial.println();
    }
  }

  // ─────────────────────────────────────────
  // 2. BANANENBUCHSEN AUSLESEN (RC-Zeitmessung)
  // ─────────────────────────────────────────
  for (int i = 0; i < 8; i++) {
    String currentProg = measureBananaSocket(BANANA_PINS[i]);

    // Entprellung: Neuen Wert erst akzeptieren wenn er stabil ist
    if (currentProg != pendingBananaState[i]) {
      pendingBananaState[i] = currentProg;
      lastBananaDebounceTime[i] = currentMillis;
    }

    if ((currentMillis - lastBananaDebounceTime[i]) > DEBOUNCE_DELAY) {
      if (currentProg != lastBananaState[i]) {
        lastBananaState[i] = currentProg;

#if ARDUINOJSON_VERSION_MAJOR >= 7
        JsonDocument doc;
#else
        StaticJsonDocument<200> doc;
#endif
        doc["type"] = "banana";
        doc["theme"] = BANANA_THEMES[i];
        doc["socket"] = BANANA_SOCKETS[i];

        if (currentProg == "") {
          doc["connected"] = false;
          doc["programmer"] = nullptr; // → null in JSON
        } else {
          doc["connected"] = true;
          doc["programmer"] = currentProg;
        }

        serializeJson(doc, Serial);
        Serial.println();
      }
    }
  }

  // ─────────────────────────────────────────
  // 3. KONTAKT-SENSOREN AUSLESEN
  // ─────────────────────────────────────────
  for (int i = 0; i < 6; i++) {
    // LOW = aktiv (wegen INPUT_PULLUP)
    bool reading = (digitalRead(CONTACT_PINS[i]) == LOW);

    // Entprellung
    if (reading != pendingContactState[i]) {
      pendingContactState[i] = reading;
      lastContactDebounceTime[i] = currentMillis;
    }

    if ((currentMillis - lastContactDebounceTime[i]) > DEBOUNCE_DELAY) {
      if (reading != lastContactState[i]) {
        lastContactState[i] = reading;

#if ARDUINOJSON_VERSION_MAJOR >= 7
        JsonDocument doc;
#else
        StaticJsonDocument<128> doc;
#endif
        doc["type"] = "contact";
        doc["id"] = i;
        doc["active"] = reading;

        serializeJson(doc, Serial);
        Serial.println();
      }
    }
  }

  // ─────────────────────────────────────────
  // 4. BUTTONS AUSLESEN
  // ─────────────────────────────────────────

  // Home Button
  bool readingHome = (digitalRead(BUTTON_HOME) == LOW);
  if (readingHome != pendingButtonHome) {
    pendingButtonHome = readingHome;
    lastButtonHomeDebounceTime = currentMillis;
  }
  if ((currentMillis - lastButtonHomeDebounceTime) > DEBOUNCE_DELAY) {
    if (readingHome != lastButtonHome) {
      lastButtonHome = readingHome;

#if ARDUINOJSON_VERSION_MAJOR >= 7
      JsonDocument doc;
#else
      StaticJsonDocument<128> doc;
#endif
      doc["type"] = "button";
      doc["id"] = 0;
      doc["name"] = "home";
      doc["pressed"] = readingHome;

      serializeJson(doc, Serial);
      Serial.println();
    }
  }

  // Intro Button
  bool readingIntro = (digitalRead(BUTTON_INTRO) == LOW);
  if (readingIntro != pendingButtonIntro) {
    pendingButtonIntro = readingIntro;
    lastButtonIntroDebounceTime = currentMillis;
  }
  if ((currentMillis - lastButtonIntroDebounceTime) > DEBOUNCE_DELAY) {
    if (readingIntro != lastButtonIntro) {
      lastButtonIntro = readingIntro;

#if ARDUINOJSON_VERSION_MAJOR >= 7
      JsonDocument doc;
#else
      StaticJsonDocument<128> doc;
#endif
      doc["type"] = "button";
      doc["id"] = 1;
      doc["name"] = "intro";
      doc["pressed"] = readingIntro;

      serializeJson(doc, Serial);
      Serial.println();
    }
  }

  // ─────────────────────────────────────────
  // 5. NFC READERS AUSLESEN (alle 250ms)
  // ─────────────────────────────────────────
  if (currentMillis - lastNfcCheckTime >= NFC_CHECK_INTERVAL) {
    lastNfcCheckTime = currentMillis;

    for (int i = 0; i < 6; i++) {
      bool present = false;
      String uidStr = "";

      // Prüfen ob eine neue Karte erkannt wird
      if (nfcReaders[i].PICC_IsNewCardPresent() && nfcReaders[i].PICC_ReadCardSerial()) {
        present = true;
        uidStr = uidToHexString(nfcReaders[i].uid.uidByte, nfcReaders[i].uid.size);
        nfcReaders[i].PICC_HaltA();
      } else {
        // Reader zurücksetzen, damit er Karten-Entfernung erkennt
        nfcReaders[i].PICC_HaltA();
        nfcReaders[i].PCD_StopCrypto1();
      }

      // Nur senden wenn sich etwas geändert hat
      if (present != lastNfcPresent[i] || (present && uidStr != lastNfcUid[i])) {
        lastNfcPresent[i] = present;
        lastNfcUid[i] = present ? uidStr : "";

#if ARDUINOJSON_VERSION_MAJOR >= 7
        JsonDocument doc;
#else
        StaticJsonDocument<200> doc;
#endif
        doc["type"] = "nfc";
        doc["reader"] = i;
        doc["present"] = present;
        // UID immer als String senden (leer wenn keine Karte)
        // Der Server-Parser erwartet uid als String.
        doc["uid"] = present ? uidStr : "";

        serializeJson(doc, Serial);
        Serial.println();
      }
    }
  }

  // Kurze Pause für Systemstabilität
  delay(5);
}
