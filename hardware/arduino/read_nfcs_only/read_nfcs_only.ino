/*
  ENIAC Six -  PN532-Multi-Reader-Test

  Arduino Mega 2560, gemeinsamer Hardware-SPI-Bus:
    SCK  -> D52
    MISO -> D50
    MOSI -> D51

*/

#include <SPI.h>
#include <Adafruit_PN532.h>

constexpr uint8_t HARDWARE_SS_PIN = 53;

const uint8_t NFC_SS_PINS[] = {43, 44, 7, 42, 41, 40};
constexpr uint8_t NFC_COUNT = sizeof(NFC_SS_PINS) / sizeof(NFC_SS_PINS[0]);

constexpr unsigned long NFC_POLL_INTERVAL_MS = 10;
constexpr uint16_t NFC_READ_TIMEOUT_MS = 100;

// Für sechs Reader werden sechs PN532-Instanzen benötigt. Das SS-Pin-Array
// darüber bleibt die zentrale Stelle für die Pinbelegung.
Adafruit_PN532 nfc1(NFC_SS_PINS[0]);
Adafruit_PN532 nfc2(NFC_SS_PINS[1]);
Adafruit_PN532 nfc3(NFC_SS_PINS[2]);
Adafruit_PN532 nfc4(NFC_SS_PINS[3]);
Adafruit_PN532 nfc5(NFC_SS_PINS[4]);
Adafruit_PN532 nfc6(NFC_SS_PINS[5]);

Adafruit_PN532* const NFC_READERS[NFC_COUNT] = {
  &nfc1, &nfc2, &nfc3, &nfc4, &nfc5, &nfc6
};

bool nfcAvailable[NFC_COUNT] = {false};
bool cardPresent[NFC_COUNT] = {false};

uint8_t nextReader = 0;
unsigned long lastPollTime = 0;

void deselectAllReaders() {
  for (uint8_t i = 0; i < NFC_COUNT; i++) {
    digitalWrite(NFC_SS_PINS[i], HIGH);
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

void initializeReaders() {
  pinMode(HARDWARE_SS_PIN, OUTPUT);
  digitalWrite(HARDWARE_SS_PIN, HIGH);

  for (uint8_t i = 0; i < NFC_COUNT; i++) {
    digitalWrite(NFC_SS_PINS[i], HIGH);
    pinMode(NFC_SS_PINS[i], OUTPUT);
  }

  deselectAllReaders();
  SPI.begin();
  delay(500);

  for (uint8_t i = 0; i < NFC_COUNT; i++) {
    deselectAllReaders();
    delay(100);

    Serial.print(F("NFC_READER,"));
    Serial.print(i + 1);
    Serial.print(F(",SS,D"));
    Serial.print(NFC_SS_PINS[i]);
    Serial.println(F(",INITIALIZING"));

    NFC_READERS[i]->begin();
    delay(10);

    uint32_t versionData = NFC_READERS[i]->getFirmwareVersion();

    if (versionData == 0) {
      Serial.print(F("NFC_READER,"));
      Serial.print(i + 1);
      Serial.println(F(",ERROR,NO_FIRMWARE_RESPONSE"));
      continue;
    }

    if (!NFC_READERS[i]->SAMConfig()) {
      Serial.print(F("NFC_READER,"));
      Serial.print(i + 1);
      Serial.println(F(",ERROR,SAM_CONFIG_FAILED"));
      continue;
    }

    // Ein Versuch pro Poll: Der loop() sucht danach automatisch weiter.
    if (!NFC_READERS[i]->setPassiveActivationRetries(0x00)) {
      Serial.print(F("NFC_READER,"));
      Serial.print(i + 1);
      Serial.println(F(",ERROR,PASSIVE_RETRIES_CONFIG_FAILED"));
      continue;
    }

    nfcAvailable[i] = true;

    Serial.print(F("NFC_READER,"));
    Serial.print(i + 1);
    Serial.print(F(",READY,SS,D"));
    Serial.print(NFC_SS_PINS[i]);
    Serial.print(F(",CHIP,PN5"));
    Serial.print((versionData >> 24) & 0xFF, HEX);
    Serial.print(F(",FIRMWARE,"));
    Serial.print((versionData >> 16) & 0xFF, DEC);
    Serial.print('.');
    Serial.println((versionData >> 8) & 0xFF, DEC);
  }

  deselectAllReaders();
}

void pollNextReader() {
  unsigned long now = millis();

  if (now - lastPollTime < NFC_POLL_INTERVAL_MS) {
    return;
  }


  lastPollTime = now;

  uint8_t readerIndex = nextReader;
  nextReader = (nextReader + 1) % NFC_COUNT;

  //Serial.print(nextReader);
  //Serial.println(F(",nextReader"));


  if (!nfcAvailable[readerIndex]) {
    return;
  }

  deselectAllReaders();

  uint8_t uid[7] = {0};
  uint8_t uidLength = 0;

  bool success = NFC_READERS[readerIndex]->readPassiveTargetID(
    PN532_MIFARE_ISO14443A,
    uid,
    &uidLength,
    NFC_READ_TIMEOUT_MS
  );

  deselectAllReaders();

  if (!success) {
    if (cardPresent[readerIndex]) {
      cardPresent[readerIndex] = false;

      Serial.print(F("NFC,"));
      Serial.print(readerIndex + 1);
      Serial.println(F(",REMOVED"));
    }

    return;
  }

  if (cardPresent[readerIndex]) {
    return;
  }

  cardPresent[readerIndex] = true;

  Serial.print(F("NFC,"));
  Serial.print(readerIndex + 1);
  Serial.print(F(",PRESENT,"));
  printUid(uid, uidLength);
  Serial.println();
}

void setup() {
  Serial.begin(115200);

  while (!Serial) {
    delay(10);
  }

  Serial.println(F("SYSTEM,START,NFC_ONLY_TEST"));
  initializeReaders();
  delay(2000);
  Serial.println(F("SYSTEM,READY"));
}

void loop() {
  pollNextReader();
}
