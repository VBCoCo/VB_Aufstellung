# Upgrade auf 3.0.1

1. Backup ist bereits vorhanden.
2. Im Supabase SQL Editor `admin_overview_v3_0_1.sql` vollständig ausführen.
3. Danach die Dateien aus diesem ZIP auf GitHub Pages deployen.
4. Neu anmelden bzw. die Web-App neu laden.
5. Im Kontofenster erscheinen je nach Rolle:
   - `Plattformverwaltung` für Superadmins
   - `Vereinsverwaltung` für Vereinsadmins

Die Verwaltungsbereiche sind in 3.0.1 zunächst Übersichten. Einladen, Rollen ändern und neue Vereine anlegen folgen separat über geschützte Edge Functions.
