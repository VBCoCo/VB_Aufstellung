# Volleyball Trainer

Web-App für TTC Geltendorf e.V. zur Planung und Darstellung von Volleyball-Aufstellungen und Spielsituationen.

## Aktuelle Funktionen

- Struktur: **Teamaufstellung → Spielsituation → Schritt → Aktion**.
- Teamaufstellungen speichern Rollen, Libero-Einstellung und eigene Spielsituationen.
- Schritte speichern Spielerpositionen, Ballposition und optionale Aktionen wie Aufschlag, Annahme, Zuspiel, Angriff, Block, Abwehr oder Punkt/Fehler.
- 2D-Ansicht zum Bearbeiten, 2,5D-Ansicht und Animation zur Präsentation.
- Zentrale Speicherung über Supabase.
- Die zuletzt erfolgreich geladene App und die letzten Supabase-Daten bleiben nach einem Online-Start für die **Offline-Anzeige** auf dem Gerät verfügbar.
- **Offline ist die App schreibgeschützt.** Bearbeiten und Speichern erfordern eine Internetverbindung zu Supabase.

## Neu in 2.8.1

- Offline-Bearbeitung wird vor der Passwortabfrage klar abgefangen und erklärt.
- Bei Verbindungsverlust während der Bearbeitung wird der Bearbeitungsmodus beendet; nicht gespeicherte Änderungen werden verworfen.
- Namen von Teamaufstellungen können über **⚙ Konfigurieren** geändert werden.
- Namen frei angelegter Spielsituationen können über **⚙ Konfigurieren** geändert werden.
- Die sechs festen Rotationssituationen behalten ihren Grundnamen **Grundaufstellung** bis **Grundaufstellung +5**. Dafür kann ein optionaler Zusatz ergänzt werden, z. B. `Grundaufstellung +1 – Läufer`.
- README auf den aktuellen Funktionsstand reduziert.

## GitHub Pages

Alle Dateien aus dem Release-ZIP in das Repository kopieren und GitHub Pages wie bisher aus `/root` veröffentlichen.
