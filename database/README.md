# Datenbank- und Supabase-Skripte

Dieser Ordner enthält die SQL-Dateien zur historischen Einrichtung, Absicherung und Weiterentwicklung des Volleyball-Trainer-Backends.

Die Dateien werden **nicht von GitHub Pages ausgeführt**. Das bloße Hochladen oder Verschieben im Repository ändert die produktive Supabase-Datenbank nicht.

## Ordnerstruktur

```text
database/
├── legacy/
│   └── supabase.sql
├── setup/
│   ├── migration_v3.sql
│   └── rls_v3.sql
├── bootstrap/
│   └── bootstrap_first_admin.sql
└── upgrades/
    ├── migration_3_0_4.sql
    ├── admin_overview_v3_0_4_3.sql
    ├── upgrade_3_0_4_4.sql
    ├── upgrade_3_0_4_7.sql
    ├── upgrade_3_0_4_8.sql
    └── upgrade_3_7_0.sql
```

## Bedeutung der Bereiche

| Ordner | Bedeutung |
| --- | --- |
| `legacy/` | Altes 2.x-Datenmodell. Nur für historische Nachvollziehbarkeit, Migration bestehender 2.x-Daten oder einen gezielten Rückfall verwenden. |
| `setup/` | Basisschema der mandantenfähigen Version 3 sowie die zugehörigen Rechte und RLS-Policies. |
| `bootstrap/` | Einmalige Initialisierung des ersten Administrators. Enthält benutzerspezifische Platzhalter und ist keine allgemeine wiederkehrende Migration. |
| `upgrades/` | In zeitlicher Reihenfolge nach dem Version-3-Basisschema hinzugekommene Datenbankänderungen und RPC-Aktualisierungen. |

## Historische Ausführungsreihenfolge

1. `legacy/supabase.sql` – nur wenn der alte 2.x-Ausgangsstand neu hergestellt werden muss.
2. `setup/migration_v3.sql` – Version-3-Schema und Übernahme bestehender 2.x-Daten.
3. `setup/rls_v3.sql` – Rechte, Indizes und Row Level Security.
4. `bootstrap/bootstrap_first_admin.sql` – ersten zuvor in Supabase Auth angelegten Benutzer zuordnen.
5. `upgrades/migration_3_0_4.sql` – Einladungsvorlagen.
6. `upgrades/admin_overview_v3_0_4_3.sql` – aktuelle Verwaltungsübersichten.
7. `upgrades/upgrade_3_0_4_4.sql` – Fragen, Antworten und Freigaben.
8. `upgrades/upgrade_3_0_4_7.sql` – Fragen löschen.
9. `upgrades/upgrade_3_0_4_8.sql` – Lesestände und Ungelesen-Zähler.
10. `upgrades/upgrade_3_7_0.sql` – geschützte Musikbibliothek, persönliche/freigegebene Playlists und privater Storage-Bucket.

Eine detaillierte Beschreibung der erzeugten Tabellen, RPCs und Rollen steht in der [Haupt-README](../README.md).

## Wichtiger Hinweis zur Supabase CLI

Diese Dateien wurden historisch teilweise manuell im Supabase SQL Editor ausgeführt. Sie liegen deshalb bewusst **nicht** unter `supabase/migrations/`.

Die Supabase CLI behandelt `supabase/migrations/` als verwaltete, zeitgestempelte Migrationshistorie. Ein bloßes Verschieben der alten manuellen Skripte dorthin könnte den lokalen Dateistand und die von Supabase gespeicherte Remote-Migrationshistorie auseinanderbringen.

Vor einer späteren Umstellung auf echte CLI-Migrationen:

1. produktive Datenbank sichern,
2. aktuellen Schema-Dump erzeugen,
3. mit `supabase migration list` den erfassten Status prüfen,
4. Remote-Schema kontrolliert mit `supabase db pull` erfassen,
5. Migrationen lokal testen,
6. erst danach `supabase db push` einsetzen.

## Sicherheitsregeln

- Vor jeder Änderung Backup beziehungsweise Schema-Dump erstellen.
- Produktive Migrationen nicht allein aufgrund ihres Dateinamens erneut ausführen.
- `bootstrap_first_admin.sql` nur mit bewusst gesetzter E-Mail-Adresse verwenden.
- Service-Role- und Secret-Keys niemals in SQL-Dateien, Browserkonfiguration oder Git committen.
- Die Edge Function bleibt getrennt unter `supabase/functions/admin-invite/index.ts`.
