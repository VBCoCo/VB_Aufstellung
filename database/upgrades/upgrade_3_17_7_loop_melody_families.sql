-- Power Dance Lab 3.17.7: locally played, key-safe CC0 melody-loop families.

insert into public.vt_project_log
  (entry_key,entry_type,title,content,status,app_version,tags)
select
  'release-3.17.7-loop-melody-families',
  'release',
  'Power Dance: tonartsichere Loop-Melodiefamilien',
  'Das Super-Admin Power Dance Lab bietet neben dem klassischen und dem lokalen KI-Modus einen neuen Modus für Loop-Melodiefamilien. Drei CC0-Familien (Fupi Melodic EDM, Orbit 2 Pluck und Shibuya) stehen mit einzeln vorhörbaren sowie aktivierbaren Varianten zur Verfügung. Familie, Phrasenform und Oktavlage sind direkt im Lab wählbar; Melodiepräsenz, -dichte, -variation und Klangfarbenwechsel steuern die Einbindung. Tone.js GrainPlayer passt das Tempo an den konstanten Track-BPM-Wert an, ohne die Tonhöhe zu verschieben. Bass und dezente Akkorde folgen automatisch der dokumentierten Tonart und Akkordfolge der gewählten Familie. Nicht tonartmarkierte ältere Lead- und Harmony-Loops werden im Familienmodus bewusst nicht gleichzeitig zugemischt. Alle Audiodateien liegen lokal in der Web-App; es entstehen weder Server-KI- noch laufende Generierungskosten. Die Änderung bleibt auf das Super-Admin-Lab beschränkt und verändert den Musikgenerator für normale Nutzer nicht.',
  'done',
  '3.17.7',
  array['release','power-dance','lab','melody','loops','cc0','offline','key-safe']::text[]
where not exists (
  select 1 from public.vt_project_log where entry_key='release-3.17.7-loop-melody-families'
);
