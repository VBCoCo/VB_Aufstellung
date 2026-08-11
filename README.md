# Volleyball Trainer

Web-App für TTC Geltendorf e.V. zur Planung, Darstellung und Erklärung von Volleyball-Aufstellungen und Spielsituationen.

## Aktuell

- Struktur: **Teamaufstellung → Spielsituation → Schritt → Aktion**.
- Anzeige in 2D oder 2,5D, inklusive Rallye-Wiedergabe.
- Bearbeiten und Speichern erfolgt online über Supabase.
- Offline bleibt die zuletzt geladene Version zur **Anzeige** verfügbar; offline ist die App schreibgeschützt.
- Die **Taktiktafel** ist im Bearbeitungsmodus verfügbar und bleibt vorerst nicht speichernd.

## Neu in 2.9.5

- Teamaufstellungsnamen sind auf 16 Zeichen begrenzt; „Hauptaufstellung“ passt vollständig.
- Das Teamaufstellungsfeld ist in der Anzeige schmaler, die Spielsituation erhält mehr Platz.
- Die festen Spielsituationen heißen kompakt **GA**, **GA +1** bis **GA +5**.
- Längere frei vergebene Situationsnamen werden im Auswahlfeld automatisch kleiner dargestellt.

## GitHub Pages

Alle Dateien aus dem Release-ZIP in das Repository kopieren und GitHub Pages wie bisher aus `/root` veröffentlichen.
