-- Power Dance Lab 3.17.6: experimental local AI melody engine.

insert into public.vt_project_log
  (entry_key,entry_type,title,content,status,app_version,tags)
select
  'release-3.17.6-ai-melody-lab',
  'release',
  'Power Dance: lokaler KI-Melodiemodus und Motivakzente',
  'Das Super-Admin Power Dance Lab bietet neben der klassischen A–A–B–A′-Hook einen experimentellen, vollständig lokal im Browser laufenden Magenta-ImprovRNN-Modus. Das chord-konditionierte Modell erzeugt ausschließlich Notenereignisse; Tonart-, Akkord-, Tonumfang-, Sprung-, Dichte- und Timing-Regeln bereinigen die Ausgabe vor der Wiedergabe mit den vorhandenen Lead-Samples. Der jeweils nächste Acht-Takt-Block wird während der laufenden Wiedergabe vorbereitet; bei Lade-, Modell- oder Zeitproblemen verwendet das Lab automatisch die klassische Melodie. Modell und Laufzeit werden nur bei Auswahl des KI-Modus geladen und danach separat offline zwischengespeichert. Ausgewählte Melody-Loops können die Hauptmelodie entweder ersetzen oder als eigene, regelbare Motiv-/Akzentspur sparsam ergänzen. Die Akkordspur ist insgesamt deutlich leiser begrenzt. Die Änderung bleibt auf das Super-Admin-Lab beschränkt; normale Nutzer und der bestehende produktive Musikgenerator bleiben unverändert.',
  'done',
  '3.17.6',
  array['release','power-dance','lab','melody','ai','improv-rnn','offline','motif-loop']::text[]
where not exists (
  select 1 from public.vt_project_log where entry_key='release-3.17.6-ai-melody-lab'
);
