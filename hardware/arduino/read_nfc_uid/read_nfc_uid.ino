/*
  ENIAC Six – NFC-UID und zwei Taster auslesen

  PN532 -> Arduino Mega:
  SCK   -> 52
  MISO  -> 50
  MOSI  -> 51
  SS    -> 53
  VCC   -> 5V
  GND   -> GND

  Button 1:
  Kabel 1 -> Pin 7
  Kabel 2 -> GND

  Button 2:
  Kabel 1 -> Pin 8
  Kabel 2 -> GND

  Beide Buttons können dieselbe GND-Schiene
  auf dem Breadboard verwenden.
*/

#include <SPI.h>
#include <Adafruit_PN532.h>

// PN532
#define PN532_SS 53

// Buttons
#define BUTTON_1_PIN 7
#define BUTTON_2_PIN 8

Adafruit_PN532 nfc(PN532_SS);

// Verhindert mehrfache NFC-Ausgaben,
// solange dieselbe Karte auf dem Leser liegt.
bool cardPresent = false;

// Button 1
bool lastRawButtonState1 = HIGH;
bool stableButtonState1 = HIGH;
unsigned long lastDebounceTime1 = 0;

// Button 2
bool lastRawButtonState2 = HIGH;
bool stableButtonState2 = HIGH;
unsigned long lastDebounceTime2 = 0;

// Entprellzeit für beide Buttons
const unsigned long debounceDelay = 30;

// Funktionsdeklarationen
void readButtons();
void readButton(
  byte pin,
  const char* buttonName,
  bool& lastRawState,
  bool& stableState,
  unsigned long& lastDebounceTime
);
void readNfc();

void setup() {
  Serial.begin(115200);

  while (!Serial) {
    delay(10);
  }

  /*
    Die internen Pull-up-Widerstände werden aktiviert.

    Button nicht gedrückt: HIGH
    Button gedrückt:       LOW
  */
  pinMode(BUTTON_1_PIN, INPUT_PULLUP);
  pinMode(BUTTON_2_PIN, INPUT_PULLUP);

  Serial.println(F("PN532 wird initialisiert ..."));

  nfc.begin();

  uint32_t versionData = nfc.getFirmwareVersion();

  if (!versionData) {
    Serial.println(F("PN532 nicht gefunden."));
    Serial.println(F("Verkabelung und SPI-Schalter prüfen."));

    /*
      Die Buttons können auch dann getestet werden,
      wenn der NFC-Leser nicht gefunden wird.
    */
    while (true) {
      readButtons();
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
  Serial.println(F("NFC-Leser und zwei Buttons bereit."));
  Serial.println(F("Bitte NFC-Tag auflegen oder Button drücken."));
  Serial.println(F("--------------------------------"));
}

void loop() {
  readButtons();
  readNfc();
}

/*
  Beide Buttons auslesen.
*/
void readButtons() {
  readButton(
    BUTTON_1_PIN,
    "Button 1",
    lastRawButtonState1,
    stableButtonState1,
    lastDebounceTime1
  );

  readButton(
    BUTTON_2_PIN,
    "Button 2",
    lastRawButtonState2,
    stableButtonState2,
    lastDebounceTime2
  );
}

/*
  Einen Button auslesen und mechanisches Prellen unterdrücken.

  Die Zustandsvariablen werden als Referenzen übergeben,
  damit jeder Button seine eigenen Zustände besitzt.
*/
void readButton(
  byte pin,
  const char* buttonName,
  bool& lastRawState,
  bool& stableState,
  unsigned long& lastDebounceTime
) {
  bool currentReading = digitalRead(pin);

  // Rohzustand hat sich geändert
  if (currentReading != lastRawState) {
    lastDebounceTime = millis();
    lastRawState = currentReading;
  }

  // Zustand muss mindestens debounceDelay stabil bleiben
  if ((millis() - lastDebounceTime) >= debounceDelay) {
    if (currentReading != stableState) {
      stableState = currentReading;

      Serial.print(buttonName);

      if (stableState == LOW) {
        Serial.println(F(" gedrückt!"));
      } else {
        Serial.println(F(" losgelassen."));
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
    Kurzer Timeout, damit die NFC-Abfrage
    die Buttons nicht merklich blockiert.
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