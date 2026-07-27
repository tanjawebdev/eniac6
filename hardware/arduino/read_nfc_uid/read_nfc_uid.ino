/*
  NFC UID Auslese-Utility für ENIAC Six
  
  Dieses Programm liest die eindeutige Seriennummer (UID) von NFC-Tags aus.
  Es ist ein Hilfsprogramm, um die UIDs der Programmier-Karten (Tags) für das 
  ENIAC Six Projekt zu ermitteln und zuzuordnen.

  BENÖTIGTE BIBLIOTHEK:
  - "MFRC522" von GithubCommunity
    (Installation über den Arduino IDE Library Manager: 
     Sketch -> Include Library -> Manage Libraries... -> nach "MFRC522" suchen)

  VERKABELUNG (Arduino Mega 2560 -> MFRC522 Modul):
  - 3.3V  -> 3.3V (WICHTIG: Nicht an 5V anschließen, das zerstört das Modul!)
  - GND   -> GND
  - RST   -> Pin 5
  - SDA(SS)-> Pin 53
  - MOSI  -> Pin 51
  - MISO  -> Pin 50
  - SCK   -> Pin 52
*/

#include <SPI.h>
#include <MFRC522.h>

// Pin-Belegungen für den Arduino Mega 2560 definieren
#define SS_PIN 53
#define RST_PIN 5

// Erstellen der MFRC522 Instanz
MFRC522 mfrc522(SS_PIN, RST_PIN);

void setup() {
  // Serielle Kommunikation starten (Wichtig: Baudrate im Serial Monitor auf 115200 stellen!)
  Serial.begin(115200);
  
  // Warten, bis die serielle Verbindung steht (nötig bei einigen Boards)
  while (!Serial);

  // SPI-Bus initialisieren
  SPI.begin();
  
  // MFRC522 NFC-Lesegerät initialisieren
  mfrc522.PCD_Init();
  
  // Start-Nachrichten auf dem Serial Monitor ausgeben
  Serial.println(F("NFC-Leser bereit."));
  Serial.println(F("Bitte legen Sie einen NFC-Tag auf das Lesegerät..."));
  Serial.println(F("--------------------------------------------------"));
}

void loop() {
  // Prüfen, ob eine neue Karte in der Nähe ist. 
  // Wenn nicht, brechen wir diesen Durchlauf der loop() ab.
  if (!mfrc522.PICC_IsNewCardPresent()) {
    return;
  }

  // Prüfen, ob die Daten der Karte gelesen werden können.
  if (!mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  // Variable für die Formatierung der UID vorbereiten
  String uidString = "";

  // Die UID Byte für Byte auslesen und in einen Hex-String umwandeln
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    // Füge eine führende Null hinzu, wenn der Hex-Wert kleiner als 10 ist (z.B. 0A statt A)
    if (mfrc522.uid.uidByte[i] < 0x10) {
      uidString += "0";
    }
    // Hänge das Byte im Hexadezimalformat (HEX) an unseren String an
    uidString += String(mfrc522.uid.uidByte[i], HEX);
  }

  // Alle Buchstaben in Großbuchstaben umwandeln (z.B. "04a17c" -> "04A17C")
  uidString.toUpperCase();

  // Ausgabe für den Benutzer formatieren
  Serial.print(F("Karte erkannt! UID: "));
  Serial.println(uidString);
  
  // Einfache Trennlinie für bessere Lesbarkeit
  Serial.println(F("---"));

  // Den Lesevorgang für diese spezifische Karte anhalten.
  // Dadurch wird verhindert, dass dieselbe Karte in rasender Geschwindigkeit 
  // wieder und wieder gelesen wird, solange sie noch auf dem Lesegerät liegt.
  // Man muss die Karte erst entfernen, um eine neue oder dieselbe Karte wieder zu lesen.
  mfrc522.PICC_HaltA();
}
