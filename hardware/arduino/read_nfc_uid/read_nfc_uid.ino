/*
  ENIAC Six – NFC-UID und Taster auslesen

  PN532 -> Arduino Mega:
  SCK   -> 52
  MISO  -> 50
  MOSI  -> 51
  SS    -> 53
  VCC   -> 5V
  GND   -> GND

  Taster -> Arduino Mega:
  Kabel 1 -> Pin 7
  Kabel 2 -> GND
*/

#include <SPI.h>
#include <Adafruit_PN532.h>

// PN532
#define PN532_SS 53

// Taster
#define BUTTON_PIN 7

Adafruit_PN532 nfc(PN532_SS);

// Verhindert mehrfache NFC-Ausgaben
bool cardPresent = false;

// Variablen für die Taster-Entprellung
bool lastRawButtonState = HIGH;
bool stableButtonState = HIGH;

unsigned long lastDebounceTime = 0;
const unsigned long debounceDelay = 30;

// Funktionsdeklarationen
void readButton();
void readNfc();

void setup() {
  Serial.begin(115200);

  while (!Serial) {
    delay(10);
  }

  /*
    Der interne Pull-up-Widerstand wird aktiviert.

    Taster nicht gedrückt: HIGH
    Taster gedrückt:       LOW
  */
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  Serial.println(F("PN532 wird initialisiert ..."));

  nfc.begin();

  uint32_t versionData = nfc.getFirmwareVersion();

  if (!versionData) {
    Serial.println(F("PN532 nicht gefunden."));
    Serial.println(F("Verkabelung und SPI-Schalter prüfen."));

    while (true) {
      // Der Taster kann auch im Fehlerfall getestet werden
      readButton();
      delay(5);
    }
  }

  Serial.print(F("PN532 erkannt. Chip: PN5"));
  Serial.println((versionData >> 24) & 0xFF, HEX);

  Serial.print(F("Firmware: "));
  Serial.print((versionData >> 16) & 0xFF, DEC);
  Serial.print('.');
  Serial.println((versionData >> 8) & 0xFF, DEC);

  nfc.SAMConfig();

  Serial.println(F("--------------------------------"));
  Serial.println(F("NFC-Leser und Taster bereit."));
  Serial.println(F("Bitte NFC-Tag auflegen oder Taster drücken."));
  Serial.println(F("--------------------------------"));
}

void loop() {
  readButton();
  readNfc();
}

/*
  Taster auslesen und mechanisches Prellen unterdrücken.
*/
void readButton() {
  bool currentReading = digitalRead(BUTTON_PIN);

  // Rohzustand hat sich geändert
  if (currentReading != lastRawButtonState) {
    lastDebounceTime = millis();
    lastRawButtonState = currentReading;
  }

  // Zustand muss mindestens debounceDelay stabil bleiben
  if ((millis() - lastDebounceTime) >= debounceDelay) {
    if (currentReading != stableButtonState) {
      stableButtonState = currentReading;

      if (stableButtonState == LOW) {
        Serial.println(F("Taster gedrückt!"));
      } else {
        Serial.println(F("Taster losgelassen."));
      }
    }
  }
}

/*
  NFC-Tag auslesen.
*/
void readNfc() {
  uint8_t uid[7];
  uint8_t uidLength = 0;

  /*
    Kurzer Timeout, damit die NFC-Abfrage den Taster
    nicht merklich blockiert.
  */
  bool success = nfc.readPassiveTargetID(
    PN532_MIFARE_ISO14443A,
    uid,
    &uidLength,
    20
  );

  if (!success) {
    cardPresent = false;
    return;
  }

  // Dieselbe aufgelegte Karte nicht ständig ausgeben
  if (cardPresent) {
    return;
  }

  cardPresent = true;

  Serial.print(F("Karte erkannt! UID: "));

  for (uint8_t i = 0; i < uidLength; i++) {
    if (uid[i] < 0x10) {
      Serial.print('0');
    }

    Serial.print(uid[i], HEX);
  }

  Serial.println();
  Serial.println(F("---"));
}