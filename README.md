# Volleyball Trainer

Web-App für TTC Geltendorf e.V. zur Planung, Darstellung und Erklärung von Volleyball-Aufstellungen und Spielsituationen.

## Aktuell

- Struktur: **Teamaufstellung → Spielsituation → Schritt → Aktion**.
- Anzeige in 2D oder 2,5D, inklusive Rallye-Wiedergabe.
- Bearbeiten und Speichern erfolgt online über Supabase.
- Offline bleibt die zuletzt geladene Version zur **Anzeige** verfügbar; offline ist die App schreibgeschützt.
- Die **Taktiktafel** ist im Bearbeitungsmodus verfügbar und bleibt vorerst nicht speichernd.

## Neu in 2.9.4

- Aufstellungsprüfung beim Aufschlag berücksichtigt jetzt die Standbreite der Spieler.
- Gleiche Höhe bzw. überlappende Standbereiche gelten weiterhin als rotationsgerecht.
- Rot wird erst angezeigt, wenn zwei relevante Spieler eindeutig in der falschen Reihenfolge stehen.
- Rote Hilfslinien werden nur noch für die tatsächlich verletzte Spielerbeziehung gezeichnet.

## GitHub Pages

Alle Dateien aus dem Release-ZIP in das Repository kopieren und GitHub Pages wie bisher aus `/root` veröffentlichen.
