# Volleyball Trainer

Web-App für TTC Geltendorf e.V. zur Planung, Darstellung und Erklärung von Volleyball-Aufstellungen und Spielsituationen.

## Aktuell

- Struktur: **Teamaufstellung → Spielsituation → Schritt → Aktion**.
- Gespeicherte Situationen lassen sich in 2D oder 2,5D ansehen und als Rallye abspielen.
- Bearbeiten und Speichern erfolgt online über Supabase.
- Nach einem erfolgreichen Online-Start bleibt die zuletzt geladene Version für die **Offline-Anzeige** verfügbar; offline ist die App schreibgeschützt.
- Teamaufstellungen und Spielsituationen können im Bearbeitungsmodus konfiguriert und benannt werden.

## Neu in 2.9.0

- Neue **Taktiktafel** unter dem Spielfeld für Training und Tablet-Nutzung.
- Die Taktiktafel übernimmt Teamaufstellung, Spielsituation und Schritt als Ausgangspunkt.
- Eigene Spieler, Gegner und Ball lassen sich dort frei per **Ziehen** verschieben.
- Änderungen in der Taktiktafel sind rein temporär und werden **nie gespeichert**.
- Mit **Zurücksetzen** wird der gespeicherte Schritt wiederhergestellt; mit Pfeilen kann der vorherige oder nächste gespeicherte Schritt als Ausgangspunkt geladen werden.
- In der normalen Anzeige stehen **Teamaufstellung und Spielsituation nebeneinander in einer Zeile**, um Höhe zu sparen.

## GitHub Pages

Alle Dateien aus dem Release-ZIP in das Repository kopieren und GitHub Pages wie bisher aus `/root` veröffentlichen.
