-- Power Dance Lab 3.17.5: rhythm-first melodic phrasing.

insert into public.vt_project_log
  (entry_key,entry_type,title,content,status,app_version,tags)
select
  'release-3.17.5-melody-phrasing',
  'release',
  'Power Dance: rhythmisch gebundene Hook-Phrasen',
  'Der Lab-Melodiegenerator verwendet ein festes rhythmisches Zwei-Takt-Motiv in einer achttaktigen A–A–B–A′-Form. Die Melodietöne werden mit fortlaufender Stimmführung in den aktuellen Akkord eingepasst, große zufällige Registersprünge entfallen und der letzte Ton löst gezielt zum Akkordgrundton auf. Ein eigener Regler für Melodiedichte trennt Einsatzhäufigkeit von Lautstärke; Builds und Breaks bleiben melodisch reduziert. Variationen verändern nur einzelne Details, während Rhythmus und Motiv erkennbar bleiben. Die Klangfarbe bleibt mindestens über einen vollständigen Acht-Takt-Block stabil. Die Änderung betrifft ausschließlich das Super-Admin-Lab.',
  'done',
  '3.17.5',
  array['release','power-dance','lab','melody','phrasing','voice-leading']::text[]
where not exists (
  select 1 from public.vt_project_log where entry_key='release-3.17.5-melody-phrasing'
);
