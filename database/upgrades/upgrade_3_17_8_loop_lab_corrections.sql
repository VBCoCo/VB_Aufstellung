-- Power Dance Lab 3.17.8: reliable loop previews, live family switching and balanced loop levels.

insert into public.vt_project_log
  (entry_key,entry_type,title,content,status,app_version,tags)
select
  'release-3.17.8-loop-lab-corrections',
  'release',
  'Power Dance: Loop-Vorschau, Live-Wechsel und Melodiepegel korrigiert',
  'Die iPhone-Vorschau von Melody-Loops behandelt HTTP-Range-Anfragen jetzt außerhalb des Audio-Caches, sodass gültige 206-Teilantworten nicht mehr durch einen fehlgeschlagenen Cache-Schreibversuch ersetzt werden. Alle elf Loop-Varianten werden beim Start des Labs vorbereitet. Dadurch wechseln klassischer, lokaler KI- und Loop-Modus sowie Familie und aktive Varianten tatsächlich am nächsten Acht-Takt-Block, ohne die gesamte Wiedergabe neu starten zu müssen. Die aktuell hörbare Familie und Variante werden angezeigt. Individuelle Pegelkorrekturen gleichen die unterschiedlich lauten Quelldateien an; der Regelbereich der Melodiepräsenz wurde nach oben erweitert und hohe Melodiepräsenz nimmt die Akkordspur kontrolliert zurück. Die Änderung bleibt auf das Super-Admin-Lab beschränkt.',
  'done',
  '3.17.8',
  array['release','power-dance','lab','melody','loops','ios','audio-preview','mix']::text[]
where not exists (
  select 1 from public.vt_project_log where entry_key='release-3.17.8-loop-lab-corrections'
);
