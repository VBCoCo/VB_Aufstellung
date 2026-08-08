# Volleyball Trainer 2.4.5

## Neu in 2.4.5
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

Die bestehende vorbereitete Supabase-Anbindung bleibt unverändert. `config.js` kann weiterhin leer bleiben, solange nur die Browser-Speicherung verwendet wird.
