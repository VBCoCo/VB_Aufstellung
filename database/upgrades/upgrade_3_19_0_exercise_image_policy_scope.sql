drop policy vt_exercise_images_read on storage.objects;
drop policy vt_exercise_images_upload on storage.objects;
drop policy vt_exercise_images_delete on storage.objects;
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
