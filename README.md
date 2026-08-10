# Volleyball Trainer

Web-App für TTC Geltendorf e.V. zur Planung, Darstellung und Erklärung von Volleyball-Aufstellungen und Spielsituationen.

## Aktuell

- Struktur: **Teamaufstellung → Spielsituation → Schritt → Aktion**.
- Gespeicherte Situationen lassen sich in 2D oder 2,5D ansehen und als Rallye abspielen.
- Bearbeiten und Speichern erfolgt online über Supabase.
- Nach einem erfolgreichen Online-Start bleibt die zuletzt geladene Version für die **Offline-Anzeige** verfügbar; offline ist die App schreibgeschützt.
- Die **Taktiktafel** gehört jetzt zum Bearbeitungsmodus und erlaubt dort das freie Verschieben von eigenen Spielern, Gegnern und Ball, ohne Änderungen zu speichern.

## Neu in 2.9.2

- Die Taktiktafel wird in der normalen Anzeige nicht mehr angeboten.
- Sie erscheint erst nach dem Wechsel in den **Bearbeitungsmodus** über ✎.
- Die Taktiktafel bleibt vorerst bewusst temporär: Beim Beenden werden ihre Verschiebungen verworfen.
- Damit ist die Struktur für einen späteren eigenen, speicherbaren Taktikmodus vorbereitet.

## GitHub Pages

Alle Dateien aus dem Release-ZIP in das Repository kopieren und GitHub Pages wie bisher aus `/root` veröffentlichen.
