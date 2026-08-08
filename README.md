# Volleyball Trainer 2.5.1

## Neu in 2.5.1

- Feste Schritt-Vorlagen im Bearbeitungsmodus: **Aufschlag, Annahme, Angriff, Block, Abwehr**.
- Eine Vorlage setzt nur den Ausgangsnamen. Das Namensfeld bleibt editierbar, z. B. **Block → Doppelblock**.
- Eigene Namen werden exakt so am Schritt gespeichert; die fünf Standardvorlagen bleiben unverändert erhalten.
- Supabase Project URL und Publishable Key sind bereits in `config.js` eingetragen.
- Die App liest jetzt ausdrücklich `SUPABASE_PUBLISHABLE_KEY` (mit Fallback auf den alten `SUPABASE_ANON_KEY`).
- Alle CSS-, Logo-, Config- und App-Dateien tragen `?v=2.5.1`, damit GitHub Pages/Safari keine alte 2.4.2-Datei aus dem Cache verwenden.
- Supabase: `pgcrypto`-Funktionen werden schemaqualifiziert über `extensions.crypt` und `extensions.gen_salt` aufgerufen; behebt den Fehler `function crypt(text, text) does not exist` in SECURITY-DEFINER-Funktionen.

- Fehler beim Verschieben von Spielern behoben: abgeschlossene Schrittanimationen werden sauber entfernt und überdecken die im Bearbeitungsmodus gesetzten SVG-Positionen nicht mehr.
- Im Bearbeitungsmodus lässt sich jeder Spieler wieder direkt im aktuellen Schritt positionieren.
- Die Pfeile links/rechts animieren im Anzeigemodus weiterhin genau den vorherigen bzw. nächsten Schritt.
- **Play** springt immer auf Schritt 1 und spielt anschließend automatisch alle Schritte bis zum letzten Schritt durch.
- Ein erneuter Druck auf Play/Stop während der Wiedergabe beendet die laufende Sequenz.
- Änderungen werden weiterhin erst durch Speichern dauerhaft übernommen.
- Testpasswort bleibt leer: Passwortdialog öffnen und einfach **OK** drücken.

## GitHub Pages

Alle Dateien dieses Ordners in das Repository kopieren und GitHub Pages wie bisher aus `/root` veröffentlichen.

## Supabase

Die Supabase-Anbindung ist in dieser Version bereits vorkonfiguriert. Nach dem Upload sollte unten `Speicherung: Supabase verbunden` erscheinen. Falls noch eine alte Seite im Safari-Cache liegt, die Seite einmal vollständig neu laden oder den Tab schließen und erneut öffnen.


## Version 2.5.1
Lokale Browserdaten können im Bearbeitungsmodus einmalig nach Supabase übertragen werden. Im Anzeigemodus wird keine Migrationsfunktion angezeigt.


## 2,5D-Anzeige (ab 2.5.1)
- Im Anzeigemodus kann zwischen 2D und 2,5D gewechselt werden.
- Der Bearbeitungsmodus bleibt immer 2D.
- Die 2,5D-Kamera blickt erhöht von hinter der eigenen Grundlinie auf das Netz.
- Die gespeicherten Spielerkoordinaten sind in beiden Ansichten identisch.
- Jeder Spieler wird mit einer perspektivischen Standfläche von ungefähr 1 x 1 Meter dargestellt, damit Abstände und Überlappungen insbesondere in der Annahme sichtbar bleiben.


## Neu in 2.5.1
- 2,5D-Perspektive: eigenes Feld breiter, gegnerisches Hinterfeld kompakter, Netzpfosten weiter außen.
- Optionale Aktionsverknüpfungen pro Schritt: Aufschlag, Annahme, Zuspiel, Angriff, Block.
- Akteur, Zielspieler und bei Block ein zweiter Blockspieler können gespeichert werden.
- Der Ball kann im Bearbeitungsmodus explizit an die Position des Akteurs gesetzt werden.
- Aktionen ergänzen die freie 2D-Positionsplanung und verändern sie nicht automatisch.


## Neu in 2.5.4
- Ein an den Kontaktspieler gekoppelter Ball fängt im Bearbeitungsmodus keine Touch-/Pointer-Ereignisse mehr ab. Der Spieler bleibt dadurch auch direkt unter dem Ball zuverlässig verschiebbar.
- Der Ballflug zwischen zwei Schritten verwendet je nach Ballkontakt unterschiedliche Kurven und Geschwindigkeiten. Zuspiel ist höher, Angriff schneller/flacher; Aufschlag, Annahme, Block und Abwehr haben eigene Bewegungsprofile.
- Die gelbe Ballflug-Markierung wird als Kurve statt als Gerade dargestellt.
