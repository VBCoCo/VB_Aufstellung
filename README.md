# Volleyball Trainer 2.4.0

## Neu in 2.4.0

- Mobile Breite korrigiert: Header, Spielfeld und Bedienkarten bleiben auf derselben Gerätebreite.
- TTC-Geltendorf-Branding auf Basis des vorhandenen Vereinswappens: Blau, Weiß und Schwarz.
- Im Bearbeitungsmodus gibt es **Aufstellungsänderung** als aufklappbaren Bereich.
- Für jeden der sechs eigenen Stammspieler kann die Rolle gewählt werden: Außen (AA), Mitte (MB), Zuspiel (Z), Diagonal (D).
- Option **Mit Libero spielen**. Befindet sich ein als MB eingestellter Spieler in einer Hinterfeldposition (1, 5 oder 6), wird er automatisch als Libero (L) dargestellt.
- Bearbeitungsmodus ist passwortgeschützt.
- Testpasswort ohne Supabase: `TTC 2026`.
- Supabase-Synchronisierung für die komplette Trainer-Aufstellung vorbereitet.

## GitHub Pages

Alle Dateien dieses Ordners in das Repository kopieren und GitHub Pages wie bisher aus `/root` veröffentlichen.

## Supabase einrichten

1. In Supabase ein neues Projekt anlegen oder ein bestehendes verwenden.
2. Im **SQL Editor** den kompletten Inhalt von `supabase.sql` einmal ausführen.
3. Unter **Project Settings / API** die Project URL und den anon/public key kopieren.
4. In `config.js` eintragen:

```js
window.APP_CONFIG = {
  SUPABASE_URL: "https://DEIN-PROJEKT.supabase.co",
  SUPABASE_ANON_KEY: "DEIN-ANON-KEY"
};
```

Danach lädt die App beim Start den gemeinsamen Zustand aus Supabase. Beim Speichern im Bearbeitungsmodus wird der komplette Zustand wieder nach Supabase geschrieben.

### Passwort

Das Testpasswort wird in Supabase **nicht im Klartext** gespeichert. `supabase.sql` erzeugt einen bcrypt-Hash für `TTC 2026`. Die App schickt das eingegebene Passwort zur Prüfung an eine RPC-Funktion. Ohne konfigurierte Supabase-Verbindung gibt es für den Testbetrieb einen lokalen Fallback mit demselben Passwort.

### Sicherheitshinweis

Diese Lösung ist bewusst eine Zwischenstufe ohne Benutzerkonten. Sie schützt den Bearbeitungsmodus mit einem gemeinsamen Passwort, ersetzt aber kein echtes Benutzer-/Rollenmodell. Wenn später mehrere Trainer unterschiedliche Rechte brauchen, sollte Supabase Auth ergänzt werden.
