# Upgrade auf 3.0.3

1. In Supabase unter Authentication -> URL Configuration sicherstellen, dass folgende URL erlaubt ist:
   https://vbcoco.github.io/VB_Aufstellung/
2. Edge Function neu deployen:
   supabase functions deploy admin-invite --project-ref mvwwwkigsoaodllbtifj
3. Auf GitHub Pages die geänderten Root-Dateien aus dem Release ersetzen.
4. `assets/` ist unverändert und muss nicht neu hochgeladen werden.

Es ist keine neue SQL-Migration erforderlich.
