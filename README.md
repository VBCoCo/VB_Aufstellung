# Volleyball Trainer

Mobile Web-App für Volleyball-Aufstellungen, Spielsituationen, Animationen, Fragen und die rollenbasierte Vereinsverwaltung des TTC Geltendorf.

**Aktueller Frontend-Stand:** 3.14.0
**Veröffentlichung:** GitHub Pages
**Backend:** Supabase (PostgreSQL, Auth und Edge Function)

## Version 3.14.0 – Übungsbibliothek V1.1

Die Bearbeiteransicht erhält getrennte Arbeitsbereiche für **Athletikübungen** und **Volleyballübungen** sowie eine bereits sichtbare Kachel **Trainingsplanung** als Vorbereitung für V1.3. Beide Bibliotheken sind bewusst getrennt, bieten Suche, Fokus- und Schwierigkeitsfilter, persönliche Favoriten sowie die Darstellungsgrößen Klein, Normal und Groß.

Bearbeiter können eigene Übungen anlegen und bearbeiten. Material ist verpflichtend; `Kein Material erforderlich` ist exklusiv. Volleyballübungen unterscheiden Übungsform und Spielform und speichern Ziel, Spielerorganisation, Feldbedarf und Ablauf. Übungsfamilie und Variante sind im Datenmodell vorbereitet.

Supabase enthält zentrale Kataloge für Tags/Schwerpunkte und Material sowie 10 Athletik- und 10 Volleyball-Testübungen. Die Volleyball-Testdaten bilden bewusst zusammengehörige Übungsform-/Spielform-Paare ab. System-Testübungen bleiben unverändert; eigene Vereinsübungen werden dem aktuellen Verein und der Mannschaft zugeordnet.

Für die nächsten Ausbaustufen sind `vt_hall_profiles`, `vt_hall_resources` und `vt_team_training_profiles` bereits im Datenmodell vorhanden. Dadurch können Hallenprofile, Materialbestand und Mannschaftsdefaults später ergänzt werden, ohne das Übungs- und Trainingsmodell neu aufzubauen.

Die grafische Volleyball-Übungsdarstellung mit mehreren Schritten, mehreren Bällen und frei geführten Lauf-/Flugbahnen ist bewusst **V1.2**; die vollständige Trainingsplanung und automatische Vorschlagslogik folgen in **V1.3**.
