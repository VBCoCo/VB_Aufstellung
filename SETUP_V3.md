# Volleyball Trainer 3.0.0 – Einrichtung

Die Version 3 führt Login, Rollen und eine mandantenfähige Struktur ein. Die alten 2.x-Daten werden nicht gelöscht.

1. Im Supabase SQL Editor `database/setup/migration_v3.sql` komplett ausführen.
2. Unter **Authentication > URL Configuration** die GitHub-Pages-Adresse als Site URL und Redirect URL eintragen.
3. Unter **Authentication > Users > Add user > Send invitation** deine eigene E-Mail-Adresse einladen.
4. In `database/bootstrap/bootstrap_first_admin.sql` `DEINE-EMAIL@BEISPIEL.DE` durch genau diese E-Mail ersetzen und das Script im SQL Editor ausführen.
5. Die Dateien aus diesem ZIP auf GitHub deployen.
6. Den Einladungslink aus der E-Mail öffnen. Die App fragt nach einem neuen persönlichen Passwort.
7. Danach anmelden. Dein Konto ist gleichzeitig `SA-01`, Vereinsadmin, Bearbeiter und Viewer für TTC Geltendorf.

Optional für spätere Einladungen / weitere Vereine:

```powershell
supabase login
supabase link --project-ref mvwwwkigsoaodllbtifj
supabase functions deploy admin-invite
```

Die Edge Function liegt unter `supabase/functions/admin-invite/index.ts`. Sie verwendet serverseitige Supabase Secret Keys und legt keine Geheimnisse im Browser ab.

## Rollen
- Viewer: lesen/abspielen
- Editor: zusätzlich bearbeiten/speichern
- Vereinsadmin: Vereins-/Benutzerverwaltung, nicht automatisch Editor
- Superadmin: Plattformverwaltung; kein automatischer Zugriff auf Volleyball-Inhalte fremder Vereine

## Datenerhalt
`database/setup/migration_v3.sql` kopiert den bisherigen Datensatz aus `volleyball_trainer_state` in `vt_team_states`. Die alte Tabelle bleibt bestehen und kann als zusätzlicher Rückfallpunkt genutzt werden.

## Weitere SQL-Schritte

Die vollständige Reihenfolge der Basis-, Sicherheits- und Upgrade-Skripte ist in [`database/README.md`](database/README.md) dokumentiert. Bereits produktiv ausgeführte Skripte nicht ungeprüft erneut ausführen.
