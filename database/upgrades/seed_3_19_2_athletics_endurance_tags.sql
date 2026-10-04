BEGIN;
update public.vt_exercises set secondary_tags=array_append(coalesce(secondary_tags,'{}'::text[]),'endurance'),updated_at=now()
where exercise_type='athletics' and visibility='system' and name in ('Schnelle Linienfüße vor–zurück','Seitliches Gleiten mit Stopp','Spiegeln zu zweit ohne Gerät','Liniensprints mit Blocksprüngen' ) and not ('endurance'=any(coalesce(secondary_tags,'{}'::text[])));
COMMIT;
