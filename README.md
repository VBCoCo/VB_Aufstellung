# Volleyball Trainer 2.4.2

## Neu in 2.4.2

- Die Infobox **„So funktioniert es“** wird nur noch im Bearbeitungsmodus angezeigt.
- **Spielsituation** ersetzt den bisherigen Begriff „Rotation“ in der Oberfläche.
- Die sechs vorhandenen Spielsituationen heißen **Grundaufstellung**, **Grundaufstellung +1** bis **Grundaufstellung +5**.
- Spielsituation und Schrittsteuerung stehen kompakt in zwei Zeilen direkt über dem Spielfeld.
- Im Bearbeitungsmodus können neue Spielsituationen angelegt, umbenannt und gelöscht werden.
- Antippen/Ziehen der Spieler wurde robuster gemacht. Beim Antipp-Modus kann das Ziel jetzt auch auf bzw. nahe einem anderen Spieler liegen.
- Die Positionsprüfung bei Aufschlag/Annahme ist nur noch eine visuelle Warnung und blockiert das Verschieben nicht.
- Passwortabfrage bleibt aktiv, zum Testen ist das Passwort weiterhin leer: einfach **OK** drücken.
- Browser-Speicherung und die vorbereitete Supabase-Synchronisation bleiben kompatibel.

## GitHub Pages

Alle Dateien in das Repository hochladen bzw. die vorhandenen Dateien ersetzen. Danach GitHub Pages erneut deployen oder den automatischen Pages-Deploy abwarten.

## Supabase

Die optionale Supabase-Anbindung verwendet weiterhin `config.js` und `supabase.sql`. Ohne konfigurierte Supabase-Zugangsdaten speichert die App lokal im Browser.
