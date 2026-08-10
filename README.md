# Volleyball Trainer

Web-App für TTC Geltendorf e.V. zur Planung, Darstellung und Erklärung von Volleyball-Aufstellungen und Spielsituationen.

## Aktuell

- Struktur: **Teamaufstellung → Spielsituation → Schritt → Aktion**.
- Gespeicherte Situationen lassen sich in 2D oder 2,5D ansehen und als Rallye abspielen.
- Bearbeiten und Speichern erfolgt online über Supabase.
- Nach einem erfolgreichen Online-Start bleibt die zuletzt geladene Version für die **Offline-Anzeige** verfügbar; offline ist die App schreibgeschützt.
- Die **Taktiktafel** erlaubt freies Verschieben von eigenen Spielern, Gegnern und Ball, ohne Änderungen zu speichern.

## Neu in 2.9.1

- Die Taktiktafel nutzt die verfügbare Bildschirmhöhe deutlich besser aus.
- Teamaufstellung, Spielsituation und **Schrittname** bleiben oben kompakt sichtbar.
- Die untere Steuerung ist flacher.
- Der gerade gezogene Spieler bzw. Ball wird hervorgehoben.
- **Zurücksetzen** wird erst aktiv, wenn auf der Taktiktafel etwas verschoben wurde.
- Auf Tablets wächst die Taktiktafel stärker mit dem verfügbaren Platz.

## GitHub Pages

Alle Dateien aus dem Release-ZIP in das Repository kopieren und GitHub Pages wie bisher aus `/root` veröffentlichen.
