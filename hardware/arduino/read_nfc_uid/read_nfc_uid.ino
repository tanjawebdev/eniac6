/*
  ENIAC Six – NFC, zwei Buttons, Kontaktsensor und Potentiometer

  PN532:
  SCK  -> 52
  MISO -> 50
  MOSI -> 51
  SS   -> 53
  VCC  -> 5V
  GND  -> GND

  Button 1:
  Pin 7 und GND

  Button 2:
  Pin 8 und GND

  Kontaktsensor:
  COM -> GND
  NO  -> Pin 9
  NC  -> nicht verbunden

  Potentiometer:
  äußerer Pin  -> 5V
  mittlerer Pin -> A0
  äußerer Pin  -> GND
*/

#include <SPI.h>
#include <Adafruit_PN532.h>

// PN532
#define PN532_SS 53

// Digitale Eingänge
#define BUTTON_1_PIN 7
#define BUTTON_2_PIN 8
#define CONTACT_SENSOR_PIN 9

// Analoger Eingang
#define POTENTIOMETER_PIN A0

Adafruit_PN532 nfc(PN532_SS);

bool nfcAvailable = false;
bool cardPresent = false;

// Button 1
bool lastRawButtonState1 = HIGH;
bool stableButtonState1 = HIGH;
unsigned long lastDebounceTime1 = 0;

// Button 2
bool lastRawButtonState2 = HIGH;
bool stableButtonState2 = HIGH;
unsigned long lastDebounceTime2 = 0;

// Kontaktsensor
bool lastRawContactState = HIGH;
bool stableContactState = HIGH;
unsigned long lastContactDebounceTime = 0;

const unsigned long debounceDelay = 30;

// Potentiometer
unsigned long lastPotentiometerTime = 0;
const unsigned long potentiometerInterval = 100;
int lastPotentiometerValue = -1;

// Funktionsdeklarationen
void readDigitalInputs();

void readDigitalInput(
  byte pin,
  const char* inputName,
  bool& lastRawState,
  bool& stableState,
  unsigned long& lastDebounceTime
);

void readPotentiometer();
void readNfc();

void setup() {
  Serial.begin(115200);

  while (!Serial) {
    delay(10);
  }

  pinMode(BUTTON_1_PIN, INPUT_PULLUP);
  pinMode(BUTTON_2_PIN, INPUT_PULLUP);
  pinMode(CONTACT_SENSOR_PIN, INPUT_PULLUP);

  Serial.println(F("PN532 wird initialisiert ..."));

  nfc.begin();

  uint32_t versionData = nfc.getFirmwareVersion();

  if (!versionData) {
    nfcAvailable = false;

    Serial.println(F("PN532 nicht gefunden."));
    Serial.println(F("Andere Eingaben werden trotzdem ausgelesen."));
    Serial.println(F("Verkabelung und SPI-Schalter prüfen."));
  } else {
    nfcAvailable = true;

    Serial.print(F("PN532 erkannt. Chip: PN5"));
    Serial.println((versionData >> 24) & 0xFF, HEX);

    Serial.print(F("Firmware: "));
    Serial.print((versionData >> 16) & 0xFF, DEC);
    Serial.print('.');
    Serial.println((versionData >> 8) & 0xFF, DEC);

    nfc.SAMConfig();
  }

  Serial.println(F("--------------------------------"));
  Serial.println(F("Eingaben bereit."));
  Serial.println(F("--------------------------------"));
}

void loop() {
  readDigitalInputs();
  readPotentiometer();

  if (nfcAvailable) {
    readNfc();
  }
}

/*
  Buttons und Kontaktsensor auslesen.
*/
void readDigitalInputs() {
  readDigitalInput(
    BUTTON_1_PIN,
    "Button 1",
    lastRawButtonState1,
    stableButtonState1,
    lastDebounceTime1
  );

  readDigitalInput(
    BUTTON_2_PIN,
    "Button 2",
    lastRawButtonState2,
    stableButtonState2,
    lastDebounceTime2
  );

  readDigitalInput(
    CONTACT_SENSOR_PIN,
    "Kontaktsensor",
    lastRawContactState,
    stableContactState,
    lastContactDebounceTime
  );
}

/*
  Digitalen Eingang auslesen und entprellen.
*/
void readDigitalInput(
  byte pin,
  const char* inputName,
  bool& lastRawState,
  bool& stableState,
  unsigned long& lastDebounceTime
) {
  bool currentReading = digitalRead(pin);

  if (currentReading != lastRawState) {
    lastDebounceTime = millis();
    lastRawState = currentReading;
  }

  if ((millis() - lastDebounceTime) >= debounceDelay) {
    if (currentReading != stableState) {
      stableState = currentReading;

      Serial.print(inputName);

      if (stableState == LOW) {
        Serial.println(F(" betätigt!"));
      } else {
        Serial.println(F(" losgelassen."));
      }
    }
  }
}

/*
  Potentiometer auslesen.
*/
void readPotentiometer() {
  if (millis() - lastPotentiometerTime < potentiometerInterval) {
    return;
  }

  lastPotentiometerTime = millis();

  int potentiometerValue = analogRead(POTENTIOMETER_PIN);

  // Nur ausgeben, wenn sich der Wert merklich geändert hat
  if (
    lastPotentiometerValue == -1 ||
    abs(potentiometerValue - lastPotentiometerValue) >= 3
  ) {
    lastPotentiometerValue = potentiometerValue;

    Serial.print(F("Potentiometer: "));
    Serial.println(potentiometerValue);
  }
}

/*
  NFC-Tag auslesen.
*/
void readNfc() {
  uint8_t uid[7];
  uint8_t uidLength = 0;

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