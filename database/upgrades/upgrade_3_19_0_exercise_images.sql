-- Athletikbilder: geordnete Galerie und privater, übungsbezogener Bildspeicher.
alter table public.vt_exercises add column if not exists media_items jsonb not null default '[]'::jsonb;
alter table public.vt_exercises add constraint vt_exercise_media_array check (jsonb_typeof(media_items) = 'array' and jsonb_array_length(media_items) <= 12);

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
    elsif coalesce(item->>'asset_path','') not in ('assets/athletics/bridge.png','assets/athletics/side-plank-start.png','assets/athletics/side-plank-hold.png','assets/athletics/bird-dog.jpg') then
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
create trigger vt_exercise_media_validate before insert or update of media_items on public.vt_exercises
for each row execute function private.vt_validate_exercise_media();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('vt-exercise-images','vt-exercise-images',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;

create policy vt_exercise_images_read on storage.objects for select to authenticated
using (bucket_id='vt-exercise-images' and exists (
 select 1 from public.vt_exercises e where e.id::text = split_part(objects.name,'/',1)
));
create policy vt_exercise_images_upload on storage.objects for insert to authenticated
with check (bucket_id='vt-exercise-images' and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$' and exists (
 select 1 from public.vt_exercises e where e.id::text = split_part(objects.name,'/',1) and e.club_id is not null
 and (e.owner_id=(select auth.uid()) or exists (
  select 1 from public.vt_club_memberships m join public.vt_club_member_roles r on r.membership_id=m.id
  where m.user_id=(select auth.uid()) and m.club_id=e.club_id and m.active and r.role='club_admin'
 ))
));
create policy vt_exercise_images_delete on storage.objects for delete to authenticated
using (bucket_id='vt-exercise-images' and exists (
 select 1 from public.vt_exercises e where e.id::text = split_part(objects.name,'/',1) and e.club_id is not null
 and (e.owner_id=(select auth.uid()) or exists (
  select 1 from public.vt_club_memberships m join public.vt_club_member_roles r on r.membership_id=m.id
  where m.user_id=(select auth.uid()) and m.club_id=e.club_id and m.active and r.role='club_admin'
 ))
));
