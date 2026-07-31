# Ja, ein Arduino Mega 2560 reicht aus

Der Mega besitzt **54 digitale Pins und 16 analoge Eingänge**. Deine 16 Potentiometer belegen exakt `A0–A15`. Für alle übrigen Komponenten benötigt dieses Layout 32 digitale Pins einschließlich SPI; etwa 20 normale Digitalpins bleiben als Reserve, wenn `D0/D1` für USB/Serial freigehalten werden. ([Arduino Dokumentation][1])

## Empfohlene vollständige Pinbelegung

| Komponente           |     Anzahl | Arduino-Pins |
| -------------------- | ---------: | ------------ |
| Potentiometer        |         16 | `A0–A15`     |
| Momentanbuttons      |          2 | `D2–D3`      |
| Kontaktsensoren      |          6 | `D4–D9`      |
| Bananenkabel         |          6 | `D22–D27`    |
| Bananenbuchsen       |          8 | `D30–D37`    |
| PN532-SS-Pins        |          6 | `D38–D43`    |
| PN532 MISO           |  gemeinsam | `D50`        |
| PN532 MOSI           |  gemeinsam | `D51`        |
| PN532 SCK            |  gemeinsam | `D52`        |
| Hardware-SS des Mega | reserviert | `D53`        |

Bewusst frei bleiben:

```text
D10–D21
D28–D29
D44–D49
```

`D0` und `D1` bleiben für USB und Serial Monitor unbenutzt.

---

# Breadboard 1: Potentiometer 1–8

Dieses Breadboard wird ausschließlich für die erste Hälfte der analogen Eingänge verwendet.

## Stromschienen

```text
Arduino 5V  → rote Plus-Schiene
Arduino GND → blaue Minus-Schiene
```

## Potentiometer

| Potentiometer | Äußerer Pin | Mittlerer Pin | Anderer äußerer Pin |
| ------------- | ----------- | ------------- | ------------------- |
| Poti 1        | GND         | `A0`          | 5 V                 |
| Poti 2        | GND         | `A1`          | 5 V                 |
| Poti 3        | GND         | `A2`          | 5 V                 |
| Poti 4        | GND         | `A3`          | 5 V                 |
| Poti 5        | GND         | `A4`          | 5 V                 |
| Poti 6        | GND         | `A5`          | 5 V                 |
| Poti 7        | GND         | `A6`          | 5 V                 |
| Poti 8        | GND         | `A7`          | 5 V                 |

Jeder der drei Anschlüsse eines Potentiometers muss in einer **eigenen Breadboard-Reihe** enden.

```text
GND ── äußerer Anschluss
A0  ── mittlerer Anschluss
5V  ── äußerer Anschluss
```

---

# Breadboard 2: Potentiometer 9–16 und Schalter

## Stromschienen

Die Stromversorgung kann vom ersten Breadboard weitergeführt werden:

```text
Breadboard 1 rote Schiene  → Breadboard 2 rote Schiene
Breadboard 1 blaue Schiene → Breadboard 2 blaue Schiene
```

Dabei nur jeweils `5V → 5V` und `GND → GND` verbinden.

## Potentiometer

| Potentiometer | Äußerer Pin | Mittlerer Pin | Anderer äußerer Pin |
| ------------- | ----------- | ------------- | ------------------- |
| Poti 9        | GND         | `A8`          | 5 V                 |
| Poti 10       | GND         | `A9`          | 5 V                 |
| Poti 11       | GND         | `A10`         | 5 V                 |
| Poti 12       | GND         | `A11`         | 5 V                 |
| Poti 13       | GND         | `A12`         | 5 V                 |
| Poti 14       | GND         | `A13`         | 5 V                 |
| Poti 15       | GND         | `A14`         | 5 V                 |
| Poti 16       | GND         | `A15`         | 5 V                 |

## Zwei Momentanbuttons

| Button   | Anschluss 1 | Anschluss 2 |
| -------- | ----------- | ----------- |
| Button 1 | `D2`        | GND         |
| Button 2 | `D3`        | GND         |

Im Code:

```cpp
pinMode(2, INPUT_PULLUP);
pinMode(3, INPUT_PULLUP);
```

## Sechs Kontaktsensoren

Für jeden Mikroschalter werden `COM` und `NO` verwendet.

| Kontaktsensor | COM | NO   | NC   |
| ------------- | --- | ---- | ---- |
| Sensor 1      | GND | `D4` | frei |
| Sensor 2      | GND | `D5` | frei |
| Sensor 3      | GND | `D6` | frei |
| Sensor 4      | GND | `D7` | frei |
| Sensor 5      | GND | `D8` | frei |
| Sensor 6      | GND | `D9` | frei |

Im Code werden auch diese Pins als `INPUT_PULLUP` verwendet.

---

# Breadboard 3: Bananensystem und NFC-Verteilung

Dieses Breadboard dient als zentrale digitale Verteilerplatine.

## Bereich A: Sechs Bananenkabel

Jedes offene Kabelende bekommt einen **1-kΩ-Serienwiderstand**.

| Kabel   | Arduino-Ausgang |
| ------- | --------------: |
| Kabel 1 | `D22` über 1 kΩ |
| Kabel 2 | `D23` über 1 kΩ |
| Kabel 3 | `D24` über 1 kΩ |
| Kabel 4 | `D25` über 1 kΩ |
| Kabel 5 | `D26` über 1 kΩ |
| Kabel 6 | `D27` über 1 kΩ |

Beispiel:

```text
D22 ── 1 kΩ ── offenes Ende Kabel 1 ── Bananenstecker
```

Die sechs Widerstände müssen nicht unterschiedliche Werte haben. Sie dienen als Schutz; die Kabelidentität ergibt sich aus dem jeweiligen Arduino-Pin.

## Bereich B: Acht Bananenbuchsen

| Buchse   | Arduino-Eingang |
| -------- | --------------: |
| Buchse 1 |           `D30` |
| Buchse 2 |           `D31` |
| Buchse 3 |           `D32` |
| Buchse 4 |           `D33` |
| Buchse 5 |           `D34` |
| Buchse 6 |           `D35` |
| Buchse 7 |           `D36` |
| Buchse 8 |           `D37` |

An die Buchsen kommt keine zusätzliche Versorgung:

```text
Rückseite Buchse 1 ── D30
Rückseite Buchse 2 ── D31
...
Rückseite Buchse 8 ── D37
```

Der Arduino aktiviert beim Scannen nacheinander `D22–D27` als LOW-Ausgang und prüft `D30–D37` als `INPUT_PULLUP`.

---

# Sechs PN532-Reader

Alle sechs Reader werden auf **SPI-Modus** gestellt. Beim PN532 V3 ist das:

```text
Schalter 1: OFF
Schalter 2: ON
```

Die Module unterstützen SPI, können mit `3,3–5 V` versorgt werden und verwenden beim Mega die Pins `50`, `51` und `52`. ([ELECHOUSE][2])

## Gemeinsame SPI-Leitungen

Alle Reader teilen sich:

```text
Alle PN532 SCK  → D52
Alle PN532 MISO → D50
Alle PN532 MOSI → D51
Alle PN532 GND  → gemeinsames GND
```

## Jeweils eigener SS-Pin

| NFC-Reader |    SS |
| ---------- | ----: |
| NFC 1      | `D38` |
| NFC 2      | `D39` |
| NFC 3      | `D40` |
| NFC 4      | `D41` |
| NFC 5      | `D42` |
| NFC 6      | `D43` |

Damit sieht ein Reader beispielsweise so aus:

```text
PN532 1:
SCK  → D52
MISO → D50
MOSI → D51
SS   → D38
VCC  → externe 5 V
GND  → gemeinsames GND
```

`IRQ` und `RSTO` bleiben unverbunden.

Die Adafruit-Bibliothek besitzt einen Hardware-SPI-Konstruktor, bei dem pro Instanz ein eigener SS-Pin angegeben wird. Dadurch können die sechs Reader softwareseitig als getrennte Instanzen angelegt werden. ([GitHub][3])

```cpp
Adafruit_PN532 nfc1(38);
Adafruit_PN532 nfc2(39);
Adafruit_PN532 nfc3(40);
Adafruit_PN532 nfc4(41);
Adafruit_PN532 nfc5(42);
Adafruit_PN532 nfc6(43);
```

`D53` sollte als Hardware-SS des Mega reserviert und auf Ausgang gesetzt werden:

```cpp
pinMode(53, OUTPUT);
digitalWrite(53, HIGH);
```

---

# Stromversorgung

## Arduino-5-V-Schiene

Über den Mega versorgen:

* 16 Potentiometer
* Buttons
* Kontaktsensoren
* Bananensystem

Die Buttons, Kontakte und das Bananensystem benötigen praktisch keine eigene Lastversorgung. Die 16 Potentiometer mit jeweils 10 kΩ benötigen zusammen nur ungefähr:

```text
16 × (5 V / 10.000 Ω) = 8 mA
```

## NFC-Reader separat versorgen

Sechs PN532-Reader würde ich **nicht gemeinsam aus dem 5-V-Pin des Mega versorgen**. Verwende für sie ein separates, geregeltes Netzteil, beispielsweise:

```text
5 V / 2 A oder 5 V / 3 A
```

Verkabelung:

```text
Externes Netzteil +5 V → VCC aller sechs PN532
Externes Netzteil GND  → GND aller sechs PN532
Externes Netzteil GND  → Arduino GND
```

Damit haben Arduino und Reader eine gemeinsame Masse.

Wichtig:

```text
Externes +5 V nicht mit Arduino-5-V verbinden,
solange der Arduino über USB versorgt wird.
```

Nur die GND-Leitungen werden verbunden.

---

# Gesamtübersicht

```text
Arduino Mega 2560
│
├── A0–A7   → Breadboard 1 → Potis 1–8
│
├── A8–A15  → Breadboard 2 → Potis 9–16
├── D2–D3   → Breadboard 2 → Buttons 1–2
├── D4–D9   → Breadboard 2 → Kontaktsensoren 1–6
│
├── D22–D27 → Breadboard 3 → 1-kΩ-Widerstände → Kabel 1–6
├── D30–D37 → Breadboard 3 → Bananenbuchsen 1–8
│
├── D38–D43 → NFC 1–6, jeweils eigener SS
├── D50     → MISO aller NFC-Reader
├── D51     → MOSI aller NFC-Reader
├── D52     → SCK aller NFC-Reader
└── D53     → reservierter Hardware-SS
```

## Sinnvolle Kabelfarben

| Funktion                   | Farbe              |
| -------------------------- | ------------------ |
| Arduino 5 V                | Rot                |
| Externe NFC-5-V-Versorgung | Orange             |
| GND                        | Schwarz oder Braun |
| Potentiometer-Signale      | Gelb               |
| Digitale Eingänge          | Grün               |
| Bananenkabel-Ausgänge      | Violett            |
| SPI SCK/MISO/MOSI          | Blau               |
| NFC-SS-Leitungen           | Weiß               |

## Praktische Hinweise

* Die Stromschienen vieler Breadboards sind in der Mitte unterbrochen. Jede Unterbrechung muss bewusst überbrückt werden.
* Die sechs PN532-Reader sollten zunächst einzeln, anschließend zu zweit und erst danach gemeinsam getestet werden.
* SPI-Leitungen möglichst kurz halten. Bei räumlich weit verteilten NFC-Readern können lange Leitungen und sternförmige Verteilungen Kommunikationsfehler verursachen.
* Die NFC-Antennen nicht direkt übereinander oder unmittelbar nebeneinander montieren.
* Für die endgültige Installation sind Lötleisten, Schraubklemmen oder Lochrasterplatinen zuverlässiger als dauerhaft verwendete Breadboards.

[1]: https://docs.arduino.cc/hardware/mega-2560 "docs.arduino.cc"
[2]: https://www.elechouse.com/elechouse/images/product/PN532_module_V3/PN532_%20Manual_V3.pdf "www.elechouse.com"
[3]: https://github.com/adafruit/Adafruit-PN532/blob/master/Adafruit_PN532.h "Adafruit-PN532/Adafruit_PN532.h at master · adafruit/Adafruit-PN532 · GitHub"
