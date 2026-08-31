# Volleyball Trainer

Mobile Web-App für Volleyball-Aufstellungen, Spielsituationen, Animationen, Fragen und die rollenbasierte Vereinsverwaltung des TTC Geltendorf.

**Aktueller Frontend-Stand:** 3.7.0
**Veröffentlichung:** GitHub Pages
**Backend:** Supabase (PostgreSQL, Auth und Edge Function)

## Aktive Anwendung

Die aktuell veröffentlichte Web-App besteht im Kern aus:

| Datei | Aufgabe |
| --- | --- |
| `index.html` | Einstiegspunkt und vollständige HTML-Oberfläche |
| `app.js` | aktuelle Anwendungslogik; Cache-Busting über den Release-Parameter in `index.html` |
| `training-player.js` | getrennte Musik-, Intervall- und Ansagelogik des Trainings-Players |
| `vendor/tone-15.1.22.js` | lokal ausgelieferte Tone.js-Musikbibliothek (MIT-Lizenz) |
| `style.css` | aktuelles Layout und Design; Cache-Busting über den Release-Parameter in `index.html` |
| `config.js` | öffentliche Supabase-URL und Publishable/Anon-Key für den Browser |
| `version.json` | maschinenlesbare aktuelle Release-Version |
| `sw.js` | Service Worker und Offline-Cache |
| `manifest.webmanifest` | PWA-Metadaten und App-Icons |
| `assets/` | Logos, PWA-Bilder und lokal gespeicherte Audio-Samples samt Lizenznachweis |

Historische JavaScript-, CSS- und Config-Kopien werden nicht mehr im aktiven Branch aufbewahrt. Frühere Stände bleiben über Git-Commits und Release-Tags verfügbar.

## Architektur in Kürze

- **GitHub Pages** liefert HTML, JavaScript, CSS, Manifest, Service Worker und Bilder aus.
- **Supabase Auth** verwaltet Anmeldung, Einladungen und Passwörter.
- **Supabase PostgreSQL** speichert Vereine, Mannschaften, Rollen, Volleyball-Daten, Fragen und Lesestände.
- **Row Level Security (RLS)** begrenzt den direkten Datenzugriff entsprechend Verein und Rolle.
- Die **Edge Function `admin-invite`** führt privilegierte Verwaltungsaktionen serverseitig aus. Der dafür benötigte Secret/Service-Role-Key gehört ausschließlich in die Supabase-Umgebung und niemals in Browserdateien.
- Der **Trainings-Player** trennt Intervallsteuerung, Tone.js-Musik und Sprach-/Signalausgabe. Eigene Trainingsvorlagen werden lokal und nach Benutzer sowie Mannschaft getrennt gespeichert.

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

Die Funktion erwartet ihre Supabase-Schlüssel aus den serverseitigen Umgebungsvariablen. Keine Secret- oder Service-Role-Schlüssel ins Repository oder in `config.js` eintragen.

## Rollenmodell

| Rolle | Berechtigung |
| --- | --- |
| Viewer | freigegebene Spielsituationen lesen und abspielen |
| Editor/Bearbeiter | zusätzlich bearbeiten, speichern und Fragen verwalten |
| Vereinsadmin | Verein, Mannschaften und Mitglieder verwalten; nicht automatisch Editor |
| Plattformadmin/Superadmin | Plattform und Vereine verwalten; kein automatischer Zugriff auf Volleyball-Inhalte fremder Vereine |

## Trainings-Player

Der Trainings-Player ist ausschließlich im Bearbeitungsmodus für Benutzer mit Bearbeiterrolle sichtbar. Die kompakte Leiste unter dem Spielfeld bietet Play, Pause, Stop/Reset, aktuellen Abschnitt und Restzeit. Die erweiterte Ansicht konfiguriert Musik, Countdown, Sprache, Signaltöne und beliebig viele fortlaufende oder wiederholte Trainingsphasen.

Mitgeliefert werden die Standardvorlagen `Tabata`, `Volleyball Power` und `Warm-up 105–118 BPM`. Eigene Vorlagen bleiben im aktuellen Browser gespeichert und sind durch Benutzer- und Mannschaftskennung getrennt. Sie werden noch nicht mit Supabase synchronisiert.

Mit `＋ Neue Vorlage` wird ein eigenständiger, noch nicht gespeicherter Ablauf mit einem bearbeitbaren Intervall angelegt. Erst `Speichern` übernimmt ihn dauerhaft in die Liste der eigenen Vorlagen. Das Bearbeiten und Speichern einer Standardvorlage erzeugt weiterhin automatisch eine eigene Kopie.

Die Musik wird mit der lokal mitgelieferten Bibliothek Tone.js 15.1.22 direkt im Browser erzeugt. Die gemeinsame Musik-Engine bietet `Electronic`, `Workout`, `House`, `Techno`, `Rock` und `Ambient`. Seit 3.4.0 liefern offline gespeicherte CC0-Aufnahmen Kick, Snare, Hi-Hats und Bass. Version 3.5.0 entfernt die unnatürlich hoch transponierte Bassaufnahme aus der Melodiestimme und verwendet stattdessen tiefer liegende, stilabhängige Instrumente: warme FM-Klänge, House-E-Piano, dunkle Techno-Stabs, Ambient-Flächen sowie verzerrte Powerchords und kurze Gitarrenmotive für Rock. Techno erhält einen durchgehenden tiefen Basspuls, der auch in Breaks erhalten bleibt. Tone.js bleibt für Timing und Arrangement zuständig; die bisherige Web-Audio-Engine bleibt als Rückfall erhalten.

Version 3.6.0 ergänzt eine Testbibliothek mit fünf vollständigen CC-BY-4.0-Titeln von Ronald Kah (`Danza`, `Danza II`, `Danza III`, `Danza IV`, `Night Dance`). Angezeigt werden die ermittelten Original-BPM; Tempoänderungen sind auf ±5 Prozent begrenzt. Einzelne Titel oder alle fünf können bewusst offline gespeichert werden. Die rund 22 MB Musik werden nicht ungefragt in den App-Shell geladen. Für eine zuverlässige Auslieferung setzt der Browser die technisch aufgeteilten Dateien vor der Wiedergabe verlustfrei wieder zusammen. Quellen und Namensnennung stehen in `assets/music/ronald-kah/LICENSE.md`.

Musik-, Ansagen- und Signaltonlautstärke sowie die Musikabsenkung während Ansagen werden pro Vorlage gespeichert. Feste Trainingsbegriffe und Countdown-Ziffern werden seit 3.6.0 als lokal mitgelieferte Aufnahmen einer klaren deutschen Frauenstimme im bereits freigeschalteten AudioContext wiedergegeben. Damit hängt der Countdown auf iOS nicht mehr von `speechSynthesis` oder einer installierten Systemstimme ab. Je nach BPM verwendet die App eine langsame, normale oder schnelle Aufnahme. Die Musik läuft weiter und wird nur abgesenkt. Freie, nicht im Sprachpaket vorhandene Ansagetexte verwenden weiterhin die System-Sprachausgabe als Rückfall.

Version 3.7.0 baut diese Bibliothek zu einer vereinsbezogenen Musiksammlung aus. Bearbeiter können rechtlich freigegebene Audiodateien mit Titel, Stil, Original-BPM und Lizenzhinweis hochladen, nach Stil beziehungsweise Tempo filtern und direkt vorhören. Persönliche Playlists sind standardmäßig privat und können wahlweise für die aktuelle Mannschaft oder den Verein freigegeben werden. Freigegebene Playlists bleiben nur für den Eigentümer bearbeitbar; andere Bearbeiter können sie verwenden oder als eigene Playlist kopieren. Beim Trainingsstart wird ein Titel oder eine Playlist gewählt. Original- und Ziel-BPM sowie die auf ±5 Prozent begrenzte Tempoanpassung werden sichtbar angezeigt. Die neue dynamische Stimmoption hebt Präsenz und Lautheit für intensive Trainingsansagen an; die ruhige Variante bleibt auswählbar.

Tone.js wird unter der MIT-Lizenz verwendet. Der Lizenztext liegt unter `vendor/TONE-LICENSE.md`; der Hinweis des Browser-Bundles unter `vendor/tone-15.1.22.LICENSE.txt`.

Die eingebundenen Drum- und Bass-Aufnahmen stehen unter CC0 1.0. Quellen und Zuordnung sind in `assets/audio/LICENSE.md` dokumentiert.

Die lokalen deutschen Sprachaufnahmen basieren auf dem Piper-Modell `de_DE-eva_k-x_low` unter CC BY 4.0. Quelle und Namensnennung stehen in `assets/audio/voice-de-eva/LICENSE.md`.

## Einrichtung und Betrieb

Die ursprüngliche Schrittfolge für Version 3 steht in [SETUP_V3.md](SETUP_V3.md). Eine zusätzliche, datenbankspezifische Übersicht steht in [database/README.md](database/README.md). Da das produktive Projekt bereits mehrere Migrationen erhalten hat, ist für eine vollständige Neuinstallation zusätzlich die oben dokumentierte SQL-Reihenfolge zu beachten.

Für die Wiederherstellung eines produktiven Systems sollte vorrangig ein aktueller Supabase-Schema-Dump verwendet werden. Die einzelnen SQL-Dateien bilden die historische Entstehungs- und Upgradefolge ab und ersetzen noch keinen automatisch getesteten Gesamtdump.

## Releases und Cache

Seit Version 3.0.4.21 besitzen JavaScript, CSS und Browser-Konfiguration stabile Dateinamen. Cache-Busting erfolgt über den Release-Parameter, beispielsweise `app.js?v=3.0.4.21`. Dadurch werden neue Inhalte zuverlässig unter einer neuen URL geladen, ohne für jedes Release weitere Dateikopien im Repository anzulegen.

Version 3.0.4.22 bereinigt den aktiven Frontend-Code ohne fachliche Funktionsänderung. Entfernt wurden vollständig überschriebene oder nicht mehr referenzierte CSS-Selektoren, ungenutzte CSS-Variablen, die frühere lokale Passwortprüfung für den Bearbeitungsmodus sowie die durch die Inline-Schrittbenennung ersetzte alte Bedienoberfläche. Die zuvor tatsächlich wirksame Darstellung des App-Kopfs wurde in einer eindeutigen Regel zusammengeführt.

Version 3.0.5.0 erweitert die nicht speichernde Taktiktafel. Spieler und Ball können getrennt entweder ohne Linie verschoben oder mit einem frei gezeichneten Laufweg beziehungsweise einer Flugbahn bewegt werden. Finger- und Mausbewegungen werden zu geglätteten Kurven mit Richtungspfeil aufbereitet. Ein eigener Rückgängig-Verlauf nimmt bis zu 100 abgeschlossene Bewegungen schrittweise zurück; der bisherige vollständige Reset, Schrittwechsel und das Beenden ohne Speicherung bleiben erhalten. Die Schaltflächen erhalten außerdem einen dezenten plastischen Druckeffekt.

Version 3.0.5.1 korrigiert die Ballbedienung der Taktiktafel bei einem an den Kontaktspieler gekoppelten Ball. Die Sperre gegen versehentliches Verschieben bleibt im normalen Editor erhalten, gilt aber nicht mehr in der nur temporären Taktiktafel. Im Bearbeitungsmodus und in der Taktiktafel wird die dort nicht verfügbare Umschaltung 2D/2,5D vollständig ausgeblendet. Frage- und Schritt-Info-Schaltflächen werden in der Taktiktafel ebenfalls ausgeblendet, damit sie keine Werkzeuge oder Feldinhalte überdecken. Die vier Aktionen im App-Kopf stehen nun in einer Zeile; auf schmalen Geräten wird die Überschrift passend verkleinert.

Version 3.0.5.2 macht die Viewer-Legende so kompakt, dass ihre fünf Elemente auch auf dem iPhone in einer Zeile bleiben. Der aktive 2D-/2,5D-Schalter wird eindeutig blau hervorgehoben. Das Fragezeichen am Spielfeld öffnet nur noch Fragen des aktuellen Schritts und legt neue Fragen fest für diesen Schritt an; die Sprechblase im App-Kopf bleibt als separate Gesamtübersicht über alle Fragen erhalten.

Version 3.1.0 ergänzt für Bearbeiter einen kompakten, aufklappbaren Trainings-Player. Eine eigenständige Intervall-Engine steuert fortlaufende Phasen, Action-/Pausenintervalle, Wiederholungen, Blöcke und längere Blockpausen. Davon getrennt erzeugt eine Web-Audio-Engine fortlaufende Musik in vier Stilrichtungen; Browser-Sprachausgabe, Countdown, Signaltöne und automatische Musikabsenkung sind separat angebunden. Eigene Vorlagen werden lokal pro Benutzer und Mannschaft gespeichert. Die Situationsauswahl reserviert außerdem dauerhaft den Platz des Info-Knopfs, damit beim Wechsel zu einer Situation mit Info nichts mehr springt.

Version 3.1.1 ergänzt einen eindeutigen Knopf zum Anlegen einer neuen Trainingsvorlage. Die gesprochenen Countdown-Ziffern laufen ruhiger. Auf unterstützten iPhones setzt die Web-Audio-Engine beim bewussten Start per Play den Audio-Session-Typ `playback`, damit generierte Musik nicht durch den Stummmodus unterdrückt wird.

Version 3.2.0 erweitert alle Musikstile um prozedural erzeugte Drum-Samples, längere Bass- und Rhythmusmuster, Variationen, Fills und Breaks. Der zusätzliche Stil `Techno` verwendet kräftigeren Subbass, gefilterte Riffs und einen Pump-Effekt. Ansagen- und Signaltonlautstärke sind unabhängig von der Musik einstellbar; die Musik wird bei Ansagen standardmäßig weniger stark abgesenkt. Im Viewer besitzen Teamaufstellung und Spielsituation nun dieselbe Höhe. Der Situations-Info-Knopf ist rechteckig in das bestehende Bedienraster integriert, ohne die Info-Funktion oder die stabile Platzreservierung zu entfernen.

Version 3.3.0 stellt ausschließlich die Musikkomponente des Trainings-Players auf die lokal eingebundene Tone.js-Version 15.1.22 um. Alle fünf Musikstile erhalten tonale 16-Takt-Arrangements mit Akkordfolgen, hörbarer Melodie, Antwortphrase, Bass, Breaks, Fills und intensitätsabhängigen Zusatzstimmen. Timer, Vorlagen, Ansagen, Signaltöne und übrige App-Funktionen bleiben unverändert. Tone.js wird mit dem App-Shell offline gespeichert; die bisherige Musik-Engine bleibt als technischer Rückfall erhalten.

Version 3.4.0 ergänzt kleine, lokal gespeicherte CC0-Samples für Schlagzeug, Fretless-Bass und die melodische Stimme. Tone.js bleibt Sequencer, Tempo- und Arrangement-Engine. Der Service Worker speichert alle Samples in der App-Shell, sodass der Trainings-Player weiterhin offline arbeitet. Zusätzlich schaltet die Sprachausgabe auf iOS die Audio-Session während einer Ansage kontrolliert um, leert eine veraltete Sprachwarteschlange und stellt Musik sowie Ducking anschließend mit einem Sicherheits-Timer zuverlässig wieder her.

Version 3.5.0 ergänzt den Musikstil `Rock` mit Rock-Schlagzeug, verzerrten Powerchords, E-Bass und sparsamen Gitarrenmotiven. Die übrigen Stile erhalten stärker getrennte Instrumentierung und Rhythmen; die piepsige, hoch transponierte Bass-Melodie entfällt. Techno verwendet einen durchgehenden tiefen Achtel-Bass und bei hoher Intensität zusätzliche Sechzehntelimpulse. Tone.js und Signaltöne teilen nun einen AudioContext, damit die adaptive deutsche weibliche Systemstimme auf iOS bei weiterlaufender, nur abgesenkter Musik hörbar bleibt. Zwei neue Player-Tasten springen zur nächsten vollständigen Trainingsphase beziehungsweise starten die aktuelle Phase neu; ein zweiter Rücksprung innerhalb von drei Sekunden wechselt zur vorherigen Phase.

Version 3.6.0 ersetzt die für feste Trainingsbegriffe unzuverlässige iOS-Systemsprache durch drei kompakte lokale Audiosprites mit insgesamt 69 Varianten einer klaren deutschen Frauenstimme. Fünf Titel von Ronald Kah bilden eine kleine Musikbibliothek mit angezeigten BPM, begrenzter Tempoanpassung, fortlaufender Wiedergabe und wählbarem Offline-Speicher. Im Viewer nutzt die Teamaufstellung mehr Breite und erscheint nur, wenn sie mindestens eine freigegebene Spielsituation enthält.

Version 3.7.0 ergänzt eine geschützte Vereinsbibliothek für eigene Musiktitel, Suche und BPM-Filter, Vorhören sowie persönliche Playlists mit den Freigabestufen privat, Mannschaft und Verein. Fremde freigegebene Playlists können verwendet oder als eigene bearbeitbare Kopie übernommen werden. Titel beziehungsweise Playlists werden im Trainings-Player ausgewählt; Original-BPM, Ziel-BPM und Tempoänderung sind dort sichtbar. Für Ansagen steht zusätzlich eine präsentere dynamische Trainerinnen-Stimme mit eigener Hörprobe zur Verfügung.

`version.json` wird beim Start direkt aus dem Netzwerk abgefragt und nicht vom Service Worker gespeichert. Erkennt eine bereits geladene App eine neuere Version, lädt sie die Seite mit der neuen Versionsnummer erneut. Der Service Worker verwendet pro Release einen eigenen App-Cache, lädt den vollständigen Offline-App-Shell während der Installation und entfernt beim Aktivieren ausschließlich ältere Caches mit dem Präfix `volleyball-trainer-shell-`.

Für ein neues Frontend-Release sind folgende Stellen auf dieselbe Versionsnummer zu setzen:

1. `VERSION` in `app.js`
2. `VERSION` in `training-player.js`
3. `version` und `released` in `version.json`
4. `VERSION` in `sw.js`
5. die `?v=`-Parameter, der Seitentitel und die sichtbare Versionsangabe in `index.html`
6. die Icon-Parameter in `manifest.webmanifest`

Die Dateien `app.js`, `style.css` und `config.js` werden dabei nur überschrieben und nicht umbenannt. Vor der Veröffentlichung müssen alle oben genannten Versionsangaben übereinstimmen.

Der unveränderte Stand vor der Repository-Bereinigung ist über den Git-Tag beziehungsweise Release `v3.0.4.20` wiederherstellbar.
