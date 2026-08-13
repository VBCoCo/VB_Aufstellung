# Volleyball Trainer 3.0.4

Mobile Web-App für Volleyball-Aufstellungen, Spielsituationen, Schritte und Aktionen mit rollenbasierter Vereins-/Plattformverwaltung.

## Neu in 3.0.4
- Gespeicherte Einladungsvorlagen: Verein, neuer Vereinsadmin und neuer Superadmin.
- Name des Empfängers, Absendername, Verein und Rollen werden automatisch in die Vorlage eingesetzt.
- Vorschau vor dem Versand; Betreff und Nachricht können für die einzelne Mail noch geändert werden.
- Superadmins können weitere Superadmins einladen.
- Vereinszugang entfernen und dauerhaftes Löschen eines Auth-Benutzers bleiben bewusst getrennte Aktionen.

Für das Upgrade sind `migration_3_0_4.sql`, ein einmaliges Update des Supabase-Invite-Mailtemplates und ein Redeploy der Edge Function `admin-invite` erforderlich. Details: `UPGRADE_3_0_4.md`.
