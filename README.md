# Volleyball Trainer 3.0.3

Web-App für Volleyball-Aufstellungen, Spielsituationen, Schritte und Aktionen mit Supabase-Login und Rollenmodell.

## Aktueller Stand
- Rollen: Viewer, Bearbeiter, Vereinsadmin und Superadmin.
- Viewer sehen freigegebene Vereins-/Mannschaftsinhalte.
- Bearbeiter können Volleyball-Inhalte bearbeiten und speichern.
- Vereinsadmins verwalten Mitglieder und Rollen ihres Vereins.
- Superadmins verwalten die Plattform, ohne dadurch automatisch Zugriff auf fremde Volleyball-Inhalte zu erhalten.
- Offline ist die zuletzt geladene Ansicht verfügbar; Bearbeiten bleibt online-only.

## Neu in 3.0.3
- Passwort-Mail für Mitglieder direkt aus der Benutzerverwaltung.
- Recovery-Link öffnet den Volleyball Trainer und ermöglicht das Setzen eines neuen Passworts.
- Superadmins können Benutzerkonten endgültig löschen; vor dem Löschen muss die E-Mail zur Sicherheit erneut eingegeben werden.
- Einladungs- und Recovery-Redirect fest auf die GitHub-Pages-App gesetzt.

## Deployment
Für 3.0.3 muss die Edge Function `admin-invite` neu deployed werden. Neue SQL-Migrationen sind nicht erforderlich.
