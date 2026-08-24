# Volleyball Trainer

Mobile Web-App für Volleyball-Aufstellungen, Spielsituationen, Animationen, Fragen und die rollenbasierte Vereinsverwaltung des TTC Geltendorf.

**Aktueller Frontend-Stand:** 3.0.4.20  
**Veröffentlichung:** GitHub Pages  
**Backend:** Supabase (PostgreSQL, Auth und Edge Function)

## Aktive Anwendung

Die aktuell veröffentlichte Web-App besteht im Kern aus:

| Datei | Aufgabe |
| --- | --- |
| `index.html` | Einstiegspunkt und vollständige HTML-Oberfläche |
| `app-3.0.4.20.js` | aktuelle Anwendungslogik |
| `style-3.0.4.20.css` | aktuelles Layout und Design |
| `config-3.0.4.js` | öffentliche Supabase-URL und Publishable/Anon-Key für den Browser |
| `version.json` | maschinenlesbare aktuelle Release-Version |
| `sw.js` | Service Worker und Offline-Cache |
| `manifest.webmanifest` | PWA-Metadaten und App-Icons |
| `assets/` | Logos und PWA-Bilder |

Historische JavaScript-, CSS- und Config-Kopien werden nicht mehr im aktiven Branch aufbewahrt. Frühere Stände bleiben über Git-Commits und Release-Tags verfügbar.

## Architektur in Kürze

- **GitHub Pages** liefert HTML, JavaScript, CSS, Manifest, Service Worker und Bilder aus.
- **Supabase Auth** verwaltet Anmeldung, Einladungen und Passwörter.
- **Supabase PostgreSQL** speichert Vereine, Mannschaften, Rollen, Volleyball-Daten, Fragen und Lesestände.
- **Row Level Security (RLS)** begrenzt den direkten Datenzugriff entsprechend Verein und Rolle.
- Die **Edge Function `admin-invite`** führt privilegierte Verwaltungsaktionen serverseitig aus. Der dafür benötigte Secret/Service-Role-Key gehört ausschließlich in die Supabase-Umgebung und niemals in Browserdateien.

## SQL- und Supabase-Dateien

Diese Dateien werden **nicht von GitHub Pages ausgeführt**. Sie dokumentieren und erzeugen den Backend-Stand in Supabase. SQL-Dateien nur im Supabase SQL Editor beziehungsweise in einem kontrollierten Migrationsablauf ausführen.

> Vor Schema- oder Migrationsarbeiten immer ein Datenbank-Backup beziehungsweise einen aktuellen Schema-Dump anlegen. Bereits produktiv ausgeführte Migrationen nicht ohne Prüfung erneut oder in geänderter Reihenfolge ausführen.

### Übersicht und empfohlene Reihenfolge

| Reihenfolge | Datei | Zweck und konkrete Wirkung | Ausführung |
| ---: | --- | --- | --- |
| 0 / historisch | `database/legacy/supabase.sql` | Altes Backend der Version 2.4.6. Erstellt `volleyball_trainer_state` und `volleyball_trainer_settings` sowie die alten RPCs `load_trainer_state`, `validate_editor_password` und `save_trainer_state`. Wird für eine Migration bestehender 2.x-Daten benötigt, ist aber nicht das aktuelle Rollenmodell. | Einmalig für 2.x beziehungsweise als Ausgangspunkt einer 2.x→3.x-Migration |
| 1 | `database/setup/migration_v3.sql` | Führt das mandantenfähige 3.0-Modell ein: Vereine, Mannschaften, Profile, Plattformadmins, Vereinsmitgliedschaften, Rollen und Team-States. Kopiert vorhandene 2.x-Volleyball-Daten in `vt_team_states`, lässt die alte Tabelle aber als Rückfallpunkt bestehen. Erstellt außerdem die Basis-RPCs für Zugriff, Laden und Speichern. | Einmalig im Supabase SQL Editor |
| 2 | `database/setup/rls_v3.sql` | Richtet Hilfsfunktionen, Indizes, Rechte und RLS-Policies ein. Viewer/Editor sehen nur freigegebene Vereinsinhalte; nur Bearbeiter dürfen Team-States schreiben. Vereins- und Plattformadminrechte werden getrennt behandelt. Das Skript ist für die darin benannten Policies wiederholbar aufgebaut, trotzdem vorher prüfen und sichern. | Nach `migration_v3.sql` |
| 3 | `database/bootstrap/bootstrap_first_admin.sql` | Ordnet einen zuvor in Supabase Auth angelegten Benutzer als ersten Plattformadmin, Vereinsadmin, Editor und Viewer zu. Die Platzhalter-E-Mail muss vorher ersetzt werden. | Genau einmal für den ersten Administrator |
| 4 | `database/upgrades/migration_3_0_4.sql` | Erstellt `vt_invite_templates` für anpassbare Einladungsbetreffe und -texte und sperrt direkten Browserzugriff auf diese Tabelle. | Einmalig beim Upgrade auf 3.0.4 |
| 5 | `database/upgrades/admin_overview_v3_0_4_3.sql` | Aktueller Stand der Lese-RPCs `get_platform_overview()` und `get_club_overview(uuid)`. Plattformadmins erhalten Verwaltungsmetadaten, aber dadurch keinen Zugriff auf fremde Volleyball-Inhalte. Ersetzt den früheren Stand `admin_overview_v3_0_1.sql`. | Einmalig beziehungsweise bei Aktualisierung der RPCs |
| 6 | `database/upgrades/upgrade_3_0_4_4.sql` | Erstellt Fragen und Antworten über `vt_questions` und `vt_question_messages`. Ergänzt RPCs zum Auflisten, Erstellen, Antworten und Statusändern. Passt `load_team_state` so an, dass Viewer nur freigegebene Situationen erhalten. | Einmalig nach dem 3.0.4-Basisstand |
| 7 | `database/upgrades/upgrade_3_0_4_7.sql` | Ergänzt `vt_delete_question(uuid)`, damit Bearbeiter Test- oder Fehlfragen samt Nachrichten kontrolliert löschen können. | Einmalig nach `upgrade_3_0_4_4.sql` |
| 8 | `database/upgrades/upgrade_3_0_4_8.sql` | Erstellt `vt_question_reads` und die RPC `vt_mark_question_read(uuid)`. Aktualisiert `vt_list_questions(uuid)` für Ungelesen-Zähler bei Fragen und Antworten. | Einmalig nach `upgrade_3_0_4_7.sql` |

### Wichtige Datenbankobjekte

| Bereich | Tabellen / Funktionen |
| --- | --- |
| Vereine und Mannschaften | `vt_clubs`, `vt_teams` |
| Benutzer und Rollen | `vt_profiles`, `vt_platform_admins`, `vt_club_memberships`, `vt_club_member_roles` |
| Volleyball-Inhalte | `vt_team_states`, `load_team_state`, `save_team_state` |
| Zugriffsprüfung | `get_my_access`, private RLS-Hilfsfunktionen |
| Verwaltungsansichten | `get_platform_overview`, `get_club_overview` |
| Einladungen | `vt_invite_templates` und die Edge Function `admin-invite` |
| Fragen und Antworten | `vt_questions`, `vt_question_messages`, `vt_question_reads` sowie die `vt_*`-Fragen-RPCs |

## Edge Function `admin-invite`

Quellpfad:

```text
supabase/functions/admin-invite/index.ts
```

Die aktuelle Funktion unterstützt:

- Einladung von Vereinsmitgliedern und Plattformadmins
- Erstellen neuer Vereine
- Laden und Speichern von Einladungsvorlagen
- Ändern von Rollen
- Aktivieren, Deaktivieren und Entfernen von Vereinsmitgliedschaften
- Anfordern einer Passwort-Zurücksetzung
- endgültiges Löschen eines Benutzerkontos unter den vorgesehenen Berechtigungsprüfungen

Deployment aus einem verknüpften Supabase-Projekt:

```powershell
supabase login
supabase link --project-ref <PROJECT_REF>
supabase functions deploy admin-invite
```

Die Funktion erwartet ihre Supabase-Schlüssel aus den serverseitigen Umgebungsvariablen. Keine Secret- oder Service-Role-Schlüssel ins Repository oder in `config-3.0.4.js` eintragen.

## Rollenmodell

| Rolle | Berechtigung |
| --- | --- |
| Viewer | freigegebene Spielsituationen lesen und abspielen |
| Editor/Bearbeiter | zusätzlich bearbeiten, speichern und Fragen verwalten |
| Vereinsadmin | Verein, Mannschaften und Mitglieder verwalten; nicht automatisch Editor |
| Plattformadmin/Superadmin | Plattform und Vereine verwalten; kein automatischer Zugriff auf Volleyball-Inhalte fremder Vereine |

## Einrichtung und Betrieb

Die ursprüngliche Schrittfolge für Version 3 steht in [SETUP_V3.md](SETUP_V3.md). Eine zusätzliche, datenbankspezifische Übersicht steht in [database/README.md](database/README.md). Da das produktive Projekt bereits mehrere Migrationen erhalten hat, ist für eine vollständige Neuinstallation zusätzlich die oben dokumentierte SQL-Reihenfolge zu beachten.

Für die Wiederherstellung eines produktiven Systems sollte vorrangig ein aktueller Supabase-Schema-Dump verwendet werden. Die einzelnen SQL-Dateien bilden die historische Entstehungs- und Upgradefolge ab und ersetzen noch keinen automatisch getesteten Gesamtdump.

## Releases und Cache

Die Version 3.0.4.20 verwendet derzeit versionshaltige JavaScript- und CSS-Dateinamen sowie einen versionierten Service-Worker-Cache. `version.json` wird beim App-Start ohne Cache abgefragt. Eine spätere Umstellung auf stabile Dateinamen mit Release-Query-String ist vorgesehen, sollte aber als eigener getesteter Release erfolgen.

Der unveränderte Stand vor der Repository-Bereinigung ist über den Git-Tag beziehungsweise Release `v3.0.4.20` wiederherstellbar.
