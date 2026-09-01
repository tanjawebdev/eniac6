/*
  PN532-Firmware-Langzeittest fuer einen einzelnen Reader

  Verkabelung (Software-SPI):
  PN532 SCK  -> Arduino D13
  PN532 MISO -> Arduino D12
  PN532 MOSI -> Arduino D11
  PN532 SS   -> Arduino D7
  PN532 VCC  -> 5V
  PN532 GND  -> GND

  IRQ und RSTO bleiben unverbunden.
  Der Schalter am PN532 muss auf SPI stehen.
*/

#include <Adafruit_PN532.h>

constexpr uint8_t PN532_SCK  = 13;
constexpr uint8_t PN532_MISO = 12;
constexpr uint8_t PN532_MOSI = 11;
constexpr uint8_t PN532_SS   = 7;

constexpr unsigned long TEST_INTERVAL_MS = 1000;

// Konstruktor-Reihenfolge: SCK, MISO, MOSI, SS.
Adafruit_PN532 nfc(PN532_SCK, PN532_MISO, PN532_MOSI, PN532_SS);

uint32_t firmwareAttempts = 0;
uint32_t firmwareSuccesses = 0;
uint32_t firmwareFailures = 0;
uint32_t firmwareLossEvents = 0;
uint32_t firmwareRecoveryEvents = 0;

bool hasPreviousResult = false;
bool previousAttemptSucceeded = false;
unsigned long lastTestTime = 0;

void runFirmwareTest();
void printStatistics();

void setup() {
  Serial.begin(115200);

  while (!Serial) {
    delay(10);
  }

  pinMode(PN532_SS, OUTPUT);
  digitalWrite(PN532_SS, HIGH);

  Serial.println(F("SYSTEM,START,NFC_FIRMWARE_STABILITY_TEST"));
  Serial.println(F("SYSTEM,PINS,SCK,D13,MISO,D12,MOSI,D11,SS,D7"));
  Serial.println(F("SYSTEM,TEST_INTERVAL_MS,1000"));

  // Den ersten Versuch sofort ausfuehren.
  runFirmwareTest();
  lastTestTime = millis();
}

void loop() {
  unsigned long now = millis();

  if (now - lastTestTime < TEST_INTERVAL_MS) {
    return;
  }

  lastTestTime = now;
  runFirmwareTest();
}

void runFirmwareTest() {
  firmwareAttempts++;

  // Wie beim bisherigen Multi-Reader-Test wird fuer jeden Versuch die
  // PN532-Schnittstelle neu initialisiert.
  digitalWrite(PN532_SS, HIGH);
  nfc.begin();
  delay(10);

  uint32_t versionData = nfc.getFirmwareVersion();
  bool attemptSucceeded = versionData != 0;

  if (attemptSucceeded) {
    firmwareSuccesses++;

    if (hasPreviousResult && !previousAttemptSucceeded) {
      firmwareRecoveryEvents++;
      Serial.println(F("EVENT,FIRMWARE_RECOVERED"));
    }

    Serial.print(F("TEST,"));
    Serial.print(firmwareAttempts);
    Serial.print(F(",RESULT,OK,CHIP,PN5"));
    Serial.print((versionData >> 24) & 0xFF, HEX);
    Serial.print(F(",FIRMWARE,"));
    Serial.print((versionData >> 16) & 0xFF, DEC);
    Serial.print('.');
    Serial.println((versionData >> 8) & 0xFF, DEC);
  } else {
    firmwareFailures++;

    if (!hasPreviousResult || previousAttemptSucceeded) {
      firmwareLossEvents++;
      Serial.println(F("EVENT,FIRMWARE_LOST"));
    }

    Serial.print(F("TEST,"));
    Serial.print(firmwareAttempts);
    Serial.println(F(",RESULT,ERROR,NO_FIRMWARE_RESPONSE"));
  }

  hasPreviousResult = true;
  previousAttemptSucceeded = attemptSucceeded;
  printStatistics();
}

void printStatistics() {
  Serial.print(F("STATS,ATTEMPTS,"));
  Serial.print(firmwareAttempts);
  Serial.print(F(",SUCCESS,"));
  Serial.print(firmwareSuccesses);
  Serial.print(F(",FAILURES,"));
  Serial.print(firmwareFailures);
  Serial.print(F(",LOSS_EVENTS,"));
  Serial.print(firmwareLossEvents);
  Serial.print(F(",RECOVERIES,"));
  Serial.println(firmwareRecoveryEvents);
}
