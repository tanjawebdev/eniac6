/*
  PN532 UID-Ausleseprogramm
  Arduino Mega 2560, Hardware-SPI

  PN532 -> Mega:
  SCK   -> 52
  MISO  -> 50
  MOSI  -> 51
  SS    -> 53
  VCC   -> 5V
  GND   -> GND

  IRQ und RSTO bleiben unverbunden.
*/

#include <SPI.h>
#include <Adafruit_PN532.h>

#define PN532_SS 53

// Hardware-SPI verwenden
Adafruit_PN532 nfc(PN532_SS);

bool cardPresent = false;

void setup() {
  Serial.begin(115200);

  while (!Serial) {
    delay(10);
  }

  Serial.println(F("PN532 wird initialisiert ..."));

  nfc.begin();

  uint32_t versionData = nfc.getFirmwareVersion();

  if (!versionData) {
    Serial.println(F("PN532 nicht gefunden."));
    Serial.println(F("Verkabelung, Versorgung und SPI-Schalter prüfen."));

    while (true) {
      delay(100);
    }
  }

  Serial.print(F("PN532 erkannt. Chip: PN5"));
  Serial.println((versionData >> 24) & 0xFF, HEX);

  Serial.print(F("Firmware: "));
  Serial.print((versionData >> 16) & 0xFF, DEC);
  Serial.print('.');
  Serial.println((versionData >> 8) & 0xFF, DEC);

  // PN532 für das Lesen von Karten konfigurieren
  nfc.SAMConfig();

  Serial.println(F("NFC-Leser bereit."));
  Serial.println(F("Bitte NFC-Tag auflegen."));
  Serial.println(F("--------------------------------"));
}

void loop() {
  uint8_t uid[7];
  uint8_t uidLength = 0;

  bool success = nfc.readPassiveTargetID(
    PN532_MIFARE_ISO14443A,
    uid,
    &uidLength,
    100
  );

  if (!success) {
    // Karte wurde entfernt und darf erneut ausgegeben werden
    cardPresent = false;
    return;
  }

  // Dieselbe aufgelegte Karte nicht ständig erneut ausgeben
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