# Upgrade auf 3.0.2

## Supabase

Keine neue SQL-Migration nötig.

Die Edge Function `admin-invite` muss aus diesem Release neu deployed werden:

```powershell
supabase login
supabase functions deploy admin-invite --project-ref mvwwwkigsoaodllbtifj
```

Der Befehl wird im entpackten Release-Ordner ausgeführt, in dem der Ordner `supabase/functions/admin-invite` liegt.

## GitHub Pages

Nur die geänderten Root-Dateien hochladen/ersetzen:

- `index.html`
- `app-3.0.2.js`
- `style-3.0.2.css`
- `config-3.0.2.js`
- `version.json`
- `sw.js`
- optional `README.md`

`assets/` und `manifest.webmanifest` sind unverändert und müssen nicht neu hochgeladen werden.

## Test

1. Als Vereinsadmin einen Viewer einladen.
2. Einladung öffnen und Passwort setzen.
3. Prüfen, dass Viewer nicht bearbeiten darf.
4. Viewer zu Bearbeiter ändern und erneut anmelden/neu laden.
5. Vereinszugang deaktivieren; danach darf das Konto keine Vereinsinhalte mehr sehen.
