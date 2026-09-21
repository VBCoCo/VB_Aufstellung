-- Power Dance Lab 3.17.4: five traceable CC0 single-note instruments.
-- These are sampler banks for generated melodies, not finished melody loops.

insert into public.vt_music_sample_packs
  (slug,name,instrument_role,manifest,license_name,license_source,bundled,lab_enabled,production_enabled)
values
  ('cc0-tonal-supersaw-c3', 'CC0 · Roland Classic Supersaw', 'lead', '{"baseUrl":"assets/audio/packs/cc0-tonal-leads/","group":"tonal-instrument","rootNote":"C3","playableRange":{"min":"F4","max":"G5"},"attack":0.015,"release":0.42,"volumeDb":-9,"sourceId":573043,"sourcePage":"https://freesound.org/s/573043/","originalPreview":"https://cdn.freesound.org/previews/573/573043_12517458-hq.mp3","urls":{"C3":"573043-C3.mp3"}}'::jsonb, 'CC0 1.0', 'https://freesound.org/s/573043/', true, true, false),
  ('cc0-tonal-entropy-lead-c3', 'CC0 · Entropy Unison Lead', 'lead', '{"baseUrl":"assets/audio/packs/cc0-tonal-leads/","group":"tonal-instrument","rootNote":"C3","playableRange":{"min":"F4","max":"G5"},"attack":0.012,"release":0.38,"volumeDb":-10,"sourceId":348975,"sourcePage":"https://freesound.org/s/348975/","originalPreview":"https://cdn.freesound.org/previews/348/348975_69312-hq.mp3","urls":{"C3":"348975-C3.mp3"}}'::jsonb, 'CC0 1.0', 'https://freesound.org/s/348975/', true, true, false),
  ('cc0-tonal-upright-piano-c4', 'CC0 · Upright Piano C4', 'lead', '{"baseUrl":"assets/audio/packs/cc0-tonal-leads/","group":"tonal-instrument","rootNote":"C4","playableRange":{"min":"F4","max":"G5"},"attack":0.01,"release":0.55,"volumeDb":-7,"sourceId":794435,"sourcePage":"https://freesound.org/s/794435/","originalPreview":"https://cdn.freesound.org/previews/794/794435_5287430-hq.mp3","urls":{"C4":"794435-C4.mp3"}}'::jsonb, 'CC0 1.0', 'https://freesound.org/s/794435/', true, true, false),
  ('cc0-tonal-crystal-bell-c4', 'CC0 · Crystal Bell C4', 'lead', '{"baseUrl":"assets/audio/packs/cc0-tonal-leads/","group":"tonal-instrument","rootNote":"C4","playableRange":{"min":"F4","max":"G5"},"attack":0.01,"release":0.9,"volumeDb":-12,"sourceId":858087,"sourcePage":"https://freesound.org/s/858087/","originalPreview":"https://cdn.freesound.org/previews/858/858087_15636277-hq.mp3","urls":{"C4":"858087-C4.mp3"}}'::jsonb, 'CC0 1.0', 'https://freesound.org/s/858087/', true, true, false),
  ('cc0-tonal-flute-c4', 'CC0 · Flute C4', 'lead', '{"baseUrl":"assets/audio/packs/cc0-tonal-leads/","group":"tonal-instrument","rootNote":"C4","playableRange":{"min":"F4","max":"G5"},"attack":0.025,"release":0.5,"volumeDb":-8,"sourceId":257363,"sourcePage":"https://freesound.org/s/257363/","originalPreview":"https://cdn.freesound.org/previews/257/257363_4755274-hq.mp3","urls":{"C4":"257363-C4.mp3"}}'::jsonb, 'CC0 1.0', 'https://freesound.org/s/257363/', true, true, false)
on conflict (slug) do update set
  name=excluded.name,
  instrument_role=excluded.instrument_role,
  manifest=excluded.manifest,
  license_name=excluded.license_name,
  license_source=excluded.license_source,
  bundled=excluded.bundled,
  updated_at=now();

insert into public.vt_project_log
  (entry_key,entry_type,title,content,status,app_version,tags)
select
  'release-3.17.4-cc0-tonal-leads',
  'release',
  'Power Dance: fünf CC0-Instrumentklänge für generierte Melodien',
  'Fünf einzeln nachvollziehbare C4-Instrumentaufnahmen (Supersaw, Unison Lead, Upright Piano, Crystal Bell und Flöte) sind als tonale Lead-Pakete im Super-Admin-Lab verfügbar. Tone.Sampler transponiert die Einzelnoten für die generierte Melodiespur. Jedes Paket ist separat anhörbar und aktivierbar; Ausgangsnote, Zieltonumfang, Pegel, Quelle und CC0-Lizenz sind dokumentiert. production_enabled bleibt false, daher gibt es keine Änderung für normale Nutzer oder den produktiven Musikgenerator.',
  'completed',
  '3.17.4',
  array['release','power-dance','lab','samples','melody','cc0']::text[]
where not exists (
  select 1 from public.vt_project_log where entry_key='release-3.17.4-cc0-tonal-leads'
);
