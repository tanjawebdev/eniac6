/*
  Minimaler PN532-Test für Arduino Mega 2560

  PN532:
  SCK  -> 52
  MISO -> 50
  MOSI -> 51
  SS   -> 38
  VCC  -> 5V
  GND  -> GND

  IRQ und RSTO bleiben unverbunden.
*/

#include <SPI.h>
#include <Adafruit_PN532.h>

constexpr uint8_t PN532_SS = 38;
constexpr uint8_t HARDWARE_SS = 53;

Adafruit_PN532 nfc(PN532_SS);

bool nfcAvailable = false;
bool cardPresent = false;

void readNfc();

void setup() {
  Serial.begin(115200);

  while (!Serial) {
    delay(10);
  }

  // D53 muss beim Mega als OUTPUT bleiben, damit Hardware-SPI im Master-Modus
  // arbeitet. An D53 wird dabei kein Kabel angeschlossen.
  pinMode(HARDWARE_SS, OUTPUT);
  digitalWrite(HARDWARE_SS, HIGH);

  pinMode(PN532_SS, OUTPUT);
  digitalWrite(PN532_SS, HIGH);

  Serial.println(F("PN532 wird initialisiert ..."));

  nfc.begin();

  uint32_t versionData = nfc.getFirmwareVersion();

  if (!versionData) {
    nfcAvailable = false;

    Serial.println(F("PN532 nicht gefunden."));
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
  Serial.println(F("NFC-Test bereit."));
  Serial.println(F("--------------------------------"));
}

void loop() {
  if (nfcAvailable) {
    readNfc();
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
