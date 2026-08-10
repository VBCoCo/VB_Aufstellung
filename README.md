# Volleyball Trainer

Web-App für TTC Geltendorf e.V. zur Planung, Darstellung und Erklärung von Volleyball-Aufstellungen und Spielsituationen.

## Aktuell

- Struktur: **Teamaufstellung → Spielsituation → Schritt → Aktion**.
- Anzeige in 2D oder 2,5D, inklusive Rallye-Wiedergabe.
- Bearbeiten und Speichern erfolgt online über Supabase.
- Offline bleibt die zuletzt geladene Version zur **Anzeige** verfügbar; offline ist die App schreibgeschützt.
- Die **Taktiktafel** ist im Bearbeitungsmodus verfügbar und bleibt vorerst nicht speichernd.

## Neu in 2.9.3

- Tablet- und Querformatdarstellung nutzt die verfügbare Fläche besser.
- 2D und 2,5D skalieren nach der tatsächlich verfügbaren Bildschirmhöhe.
- Auf Touch-Geräten wird die Einspaltenansicht früher verwendet, damit das Spielfeld nicht durch eine Desktop-Seitenleiste verkleinert wird.
- Kopfbereich wird bei geringer Höhe automatisch kompakter.
- Doppeltipp-Zoom auf Spielfeld und Taktiktafel wird verhindert; Drag & Drop bleibt erhalten.
- Die Web-App darf auf Tablets zwischen Hoch- und Querformat wechseln.

## GitHub Pages

Alle Dateien aus dem Release-ZIP in das Repository kopieren und GitHub Pages wie bisher aus `/root` veröffentlichen.
