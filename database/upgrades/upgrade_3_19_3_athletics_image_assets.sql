-- Extend the exact static asset allowlist; private upload checks stay unchanged.
create or replace function private.vt_validate_exercise_media()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare item jsonb; path text;
begin
  if jsonb_typeof(new.media_items) <> 'array' or jsonb_array_length(new.media_items) > 12 then
    raise exception 'Maximal 12 Bilder pro Übung.';
  end if;
  for item in select value from jsonb_array_elements(new.media_items) loop
    if jsonb_typeof(item) <> 'object' then raise exception 'Ungültige Bildangaben.'; end if;
    path := item->>'storage_path';
    if path is not null then
      if path !~ ('^' || new.id::text || '/[0-9a-f-]{36}\.(jpg|png|webp)$') then
        raise exception 'Bild gehört nicht zu dieser Übung.';
      end if;
      if item ? 'asset_path' then raise exception 'Bildquelle ist nicht eindeutig.'; end if;
    elsif coalesce(item->>'asset_path','') not in ('assets/athletics/dvids193-carioca-1.jpg','assets/athletics/dvids193-carioca-2.jpg','assets/athletics/dvids193-carioca-3.jpg','assets/athletics/dvids193-knees-1.jpg','assets/athletics/dvids193-knees-2.jpg','assets/athletics/dvids193-lskip-1.jpg','assets/athletics/dvids193-lskip-2.jpg','assets/athletics/dvids193-scissor-1.jpg','assets/athletics/dvids193-scissor-2.jpg','assets/athletics/dvids193-hop-1.jpg','assets/athletics/dvids193-hop-2.jpg','assets/athletics/dvids193-bear-1.jpg','assets/athletics/dvids193-bear-2.jpg','assets/athletics/dvids193-inchworm-1.jpg','assets/athletics/dvids193-inchworm-2.jpg','assets/athletics/dvids193-inchworm-3.jpg','assets/athletics/dvids193-tdrill-1.jpg','assets/athletics/dvids193-tdrill-2.jpg','assets/athletics/dvids193-tdrill-3.jpg','assets/athletics/dvids193-tdrill-4.jpg','assets/athletics/dvids193-jhook-1.jpg','assets/athletics/dvids193-jhook-2.jpg','assets/athletics/dvids193-tdrill-5.jpg','assets/athletics/bridge.png','assets/athletics/side-plank-start.png','assets/athletics/side-plank-hold.png','assets/athletics/bird-dog.jpg','assets/athletics/ankle-circle-relaxation.png','assets/athletics/ankle-circle-tension.png','assets/athletics/bodyweight-squat-low.jpg','assets/athletics/bodyweight-squat-start.jpg','assets/athletics/dead-bug-extend.jpg','assets/athletics/dead-bug-start.jpg','assets/athletics/dvids-arms-1.jpg','assets/athletics/dvids-arms-2.jpg','assets/athletics/dvids-lateral-1.jpg','assets/athletics/dvids-lateral-2.jpg','assets/athletics/dvids-lunge-1.jpg','assets/athletics/dvids-shuffle-1.jpg','assets/athletics/dvids-shuffle-2.jpg','assets/athletics/ever-back-flys-exercise-band-1.webp','assets/athletics/ever-back-flys-exercise-band-2.webp','assets/athletics/ever-balance-board-1.webp','assets/athletics/ever-balance-board-2.webp','assets/athletics/ever-bent-knee-hip-raise-1.webp','assets/athletics/ever-bent-knee-hip-raise-2.webp','assets/athletics/ever-body-leg-lifts-1.webp','assets/athletics/ever-body-leg-lifts-2.webp','assets/athletics/ever-body-row-1.webp','assets/athletics/ever-body-row-2.webp','assets/athletics/ever-crunches-1.webp','assets/athletics/ever-crunches-2.webp','assets/athletics/ever-crunches-with-legs-on-stability-ball-1.webp','assets/athletics/ever-crunches-with-legs-on-stability-ball-2.webp','assets/athletics/ever-dumbbell-dead-lifts-1.webp','assets/athletics/ever-dumbbell-dead-lifts-2.webp','assets/athletics/ever-dumbbell-shoulder-press-1.webp','assets/athletics/ever-dumbbell-shoulder-press-2.webp','assets/athletics/ever-lateral-dumbbell-raises-1.webp','assets/athletics/ever-lateral-dumbbell-raises-2.webp','assets/athletics/ever-pile-squat-with-dumbbell-1.webp','assets/athletics/ever-pile-squat-with-dumbbell-2.webp','assets/athletics/ever-pull-ups-1.webp','assets/athletics/ever-pull-ups-2.webp','assets/athletics/ever-push-up-feet-elevated-1.webp','assets/athletics/ever-push-up-feet-elevated-2.webp','assets/athletics/ever-push-ups-1.webp','assets/athletics/ever-push-ups-2.webp','assets/athletics/ever-rear-deltoid-row-dumbbell-1.webp','assets/athletics/ever-rear-deltoid-row-dumbbell-2.webp','assets/athletics/ever-squat-to-bench-with-dumbbells-1.webp','assets/athletics/ever-squat-to-bench-with-dumbbells-2.webp','assets/athletics/ever-step-ups-with-dumbbells-1.webp','assets/athletics/ever-step-ups-with-dumbbells-2.webp','assets/athletics/ever-step-ups-with-dumbbells-3.webp','assets/athletics/ever-supermans-1.webp','assets/athletics/ever-supermans-2.webp','assets/athletics/overhead-hold.jpg','assets/athletics/scapular-push-start.jpg','assets/athletics/single-leg-hinge.jpg','assets/athletics/vertical-jump.jpg','assets/athletics/wger-1091-334.jpg','assets/athletics/wger-458-354.png','assets/athletics/wger-622-439.jpeg') then
      raise exception 'Unbekannte Bildquelle.';
    end if;
    if char_length(coalesce(item->>'caption','')) > 500 or char_length(coalesce(item->>'credit','')) > 500 then
      raise exception 'Bildtext zu lang.';
    end if;
    if pg_column_size(item) > 6000 then raise exception 'Bildangaben zu groß.'; end if;
  end loop;
  return new;
end $$;
revoke all on function private.vt_validate_exercise_media() from public, anon;
