# Volleyball Trainer 2.4.9

## Neu in 2.4.9

- Feste Schritt-Vorlagen im Bearbeitungsmodus: **Aufschlag, Annahme, Angriff, Block, Abwehr**.
- Eine Vorlage setzt nur den Ausgangsnamen. Das Namensfeld bleibt editierbar, z. B. **Block → Doppelblock**.
- Eigene Namen werden exakt so am Schritt gespeichert; die fünf Standardvorlagen bleiben unverändert erhalten.
- Supabase Project URL und Publishable Key sind bereits in `config.js` eingetragen.
- Die App liest jetzt ausdrücklich `SUPABASE_PUBLISHABLE_KEY` (mit Fallback auf den alten `SUPABASE_ANON_KEY`).
- Alle CSS-, Logo-, Config- und App-Dateien tragen `?v=2.4.9`, damit GitHub Pages/Safari keine alte 2.4.2-Datei aus dem Cache verwenden.
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


## Version 2.4.9
Lokale Browserdaten können im Bearbeitungsmodus einmalig nach Supabase übertragen werden. Im Anzeigemodus wird keine Migrationsfunktion angezeigt.
