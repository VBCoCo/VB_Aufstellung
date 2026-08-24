# Upgrade auf 3.0.4

## 1. SQL einmal ausführen
Im Supabase SQL Editor `database/upgrades/migration_3_0_4.sql` ausführen. Es wird nur die neue Tabelle `vt_invite_templates` angelegt.

## 2. Supabase Invite-Template einmal anpassen
Authentication → Email Templates → Invite user

**Subject:**
```
{{ .Data.invite_subject }}
```

**Body:** Inhalt aus `SUPABASE_INVITE_TEMPLATE_3_0_4.html` einfügen und speichern.

Damit werden Betreff und Nachricht aus der in der App vorbereiteten Einladung übernommen.

## 3. Edge Function deployen
Vom Supabase-Projekt-Root aus:
```powershell
supabase functions deploy admin-invite --project-ref mvwwwkigsoaodllbtifj
```

## 4. GitHub Pages
Im ROOT ersetzen/hochladen:
- `index.html`
- `app.js`
- `style.css`
- `config.js`
- `version.json`
- `sw.js`
- optional `README.md`

Seit Release 3.0.4.21 werden für diese Dateien stabile Namen verwendet. Die jeweilige Release-Version wird über die in `README.md` dokumentierten Versionsangaben und `?v=`-Parameter aktualisiert.

### Unterordner
- `assets/`: unverändert, NICHT erneut hochladen.
- `supabase/functions/admin-invite/index.ts`: geändert, aber NICHT für GitHub Pages nötig; lokal in den Supabase-Projektordner kopieren und per CLI deployen.

## 5. Testreihenfolge
1. Vereinsadmin: Vorlage öffnen/speichern, neue Viewer-Einladung in Vorschau prüfen und senden.
2. Superadmin: Vereinsadmin-Einladung prüfen.
3. Superadmin: Superadmin-Einladung prüfen.
4. Bestehenden Benutzer aus Verein entfernen (Konto bleibt bestehen).
5. Testkonto endgültig löschen: E-Mail muss zur Bestätigung exakt eingegeben werden.
