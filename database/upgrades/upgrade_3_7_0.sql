-- Volleyball Trainer 3.7.0 - Musikbibliothek und persönliche Playlists
-- Vor produktiver Ausführung Datenbank-Backup erstellen.
begin;

create table if not exists public.vt_music_tracks (
  id uuid primary key default gen_random_uuid(), club_id uuid not null references public.vt_clubs(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade, title text not null check (char_length(title) between 1 and 160),
  artist text not null default '' check (char_length(artist) <= 160), genre text not null default 'Sonstiges' check (char_length(genre) between 1 and 80),
  bpm_original integer not null check (bpm_original between 50 and 220), duration_seconds integer not null check (duration_seconds between 1 and 14400),
  storage_path text not null unique, mime_type text not null check (mime_type in ('audio/mpeg','audio/mp3','audio/mp4','audio/m4a','audio/x-m4a','audio/aac','audio/ogg','audio/wav','audio/x-wav')),
  file_size bigint not null check (file_size between 1 and 31457280), license_note text not null default '' check (char_length(license_note) <= 500),
  active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.vt_music_playlists (
  id uuid primary key default gen_random_uuid(), club_id uuid not null references public.vt_clubs(id) on delete cascade,
  team_id uuid references public.vt_teams(id) on delete cascade, owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120), visibility text not null default 'private' check (visibility in ('private','team','club')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (visibility <> 'team' or team_id is not null)
);
create table if not exists public.vt_music_playlist_items (
  id uuid primary key default gen_random_uuid(), playlist_id uuid not null references public.vt_music_playlists(id) on delete cascade,
  track_id uuid references public.vt_music_tracks(id) on delete cascade, local_track_key text, sort_order integer not null check (sort_order between 0 and 999),
  created_at timestamptz not null default now(), check ((track_id is not null) <> (local_track_key is not null)),
  check (local_track_key is null or local_track_key in ('danza','danza-ii','danza-iii','danza-iv','night-dance')), unique (playlist_id, sort_order)
);

create index if not exists vt_music_tracks_club_active_idx on public.vt_music_tracks(club_id, active);
create index if not exists vt_music_tracks_owner_idx on public.vt_music_tracks(owner_id);
create index if not exists vt_music_tracks_genre_bpm_idx on public.vt_music_tracks(club_id, genre, bpm_original);
create index if not exists vt_music_playlists_club_visibility_idx on public.vt_music_playlists(club_id, visibility);
create index if not exists vt_music_playlists_team_idx on public.vt_music_playlists(team_id) where team_id is not null;
create index if not exists vt_music_playlists_owner_idx on public.vt_music_playlists(owner_id);
create index if not exists vt_music_playlist_items_playlist_idx on public.vt_music_playlist_items(playlist_id, sort_order);
create index if not exists vt_music_playlist_items_track_idx on public.vt_music_playlist_items(track_id) where track_id is not null;

alter table public.vt_music_tracks enable row level security; alter table public.vt_music_playlists enable row level security; alter table public.vt_music_playlist_items enable row level security;
grant select,insert,update,delete on public.vt_music_tracks,public.vt_music_playlists,public.vt_music_playlist_items to authenticated;
revoke all on public.vt_music_tracks,public.vt_music_playlists,public.vt_music_playlist_items from anon;

drop policy if exists "vt_music_tracks_read_club_editors" on public.vt_music_tracks;
create policy "vt_music_tracks_read_club_editors" on public.vt_music_tracks for select to authenticated using (active and (select private.vt_has_club_role((select auth.uid()),club_id,'editor')));
drop policy if exists "vt_music_tracks_insert_owner" on public.vt_music_tracks;
create policy "vt_music_tracks_insert_owner" on public.vt_music_tracks for insert to authenticated with check (owner_id=(select auth.uid()) and split_part(storage_path,'/',1)=club_id::text and split_part(storage_path,'/',2)=owner_id::text and (select private.vt_has_club_role((select auth.uid()),club_id,'editor')));
drop policy if exists "vt_music_tracks_update_owner" on public.vt_music_tracks;
create policy "vt_music_tracks_update_owner" on public.vt_music_tracks for update to authenticated using (owner_id=(select auth.uid()) and (select private.vt_has_club_role((select auth.uid()),club_id,'editor'))) with check (owner_id=(select auth.uid()) and split_part(storage_path,'/',1)=club_id::text and split_part(storage_path,'/',2)=owner_id::text and (select private.vt_has_club_role((select auth.uid()),club_id,'editor')));
drop policy if exists "vt_music_tracks_delete_owner" on public.vt_music_tracks;
create policy "vt_music_tracks_delete_owner" on public.vt_music_tracks for delete to authenticated using (owner_id=(select auth.uid()) and (select private.vt_has_club_role((select auth.uid()),club_id,'editor')));

drop policy if exists "vt_music_playlists_read_visible" on public.vt_music_playlists;
create policy "vt_music_playlists_read_visible" on public.vt_music_playlists for select to authenticated using (owner_id=(select auth.uid()) or ((select private.vt_has_club_role((select auth.uid()),club_id,'editor')) and (visibility='club' or (visibility='team' and (select private.vt_can_edit_team((select auth.uid()),team_id))))));
drop policy if exists "vt_music_playlists_insert_owner" on public.vt_music_playlists;
create policy "vt_music_playlists_insert_owner" on public.vt_music_playlists for insert to authenticated with check (owner_id=(select auth.uid()) and (select private.vt_has_club_role((select auth.uid()),club_id,'editor')) and (team_id is null or (select private.vt_can_edit_team((select auth.uid()),team_id))) and (team_id is null or exists(select 1 from public.vt_teams t where t.id=team_id and t.club_id=club_id and t.active)));
drop policy if exists "vt_music_playlists_update_owner" on public.vt_music_playlists;
create policy "vt_music_playlists_update_owner" on public.vt_music_playlists for update to authenticated using (owner_id=(select auth.uid()) and (select private.vt_has_club_role((select auth.uid()),club_id,'editor'))) with check (owner_id=(select auth.uid()) and (select private.vt_has_club_role((select auth.uid()),club_id,'editor')) and (team_id is null or (select private.vt_can_edit_team((select auth.uid()),team_id))) and (team_id is null or exists(select 1 from public.vt_teams t where t.id=team_id and t.club_id=club_id and t.active)));
drop policy if exists "vt_music_playlists_delete_owner" on public.vt_music_playlists;
create policy "vt_music_playlists_delete_owner" on public.vt_music_playlists for delete to authenticated using (owner_id=(select auth.uid()) and (select private.vt_has_club_role((select auth.uid()),club_id,'editor')));

drop policy if exists "vt_music_playlist_items_read_visible" on public.vt_music_playlist_items;
create policy "vt_music_playlist_items_read_visible" on public.vt_music_playlist_items for select to authenticated using (exists(select 1 from public.vt_music_playlists p where p.id=playlist_id and (p.owner_id=(select auth.uid()) or ((select private.vt_has_club_role((select auth.uid()),p.club_id,'editor')) and (p.visibility='club' or (p.visibility='team' and (select private.vt_can_edit_team((select auth.uid()),p.team_id))))))));
drop policy if exists "vt_music_playlist_items_insert_owner" on public.vt_music_playlist_items;
create policy "vt_music_playlist_items_insert_owner" on public.vt_music_playlist_items for insert to authenticated with check (exists(select 1 from public.vt_music_playlists p where p.id=playlist_id and p.owner_id=(select auth.uid()) and (select private.vt_has_club_role((select auth.uid()),p.club_id,'editor')) and (track_id is null or exists(select 1 from public.vt_music_tracks t where t.id=track_id and t.club_id=p.club_id and t.active))));
drop policy if exists "vt_music_playlist_items_update_owner" on public.vt_music_playlist_items;
create policy "vt_music_playlist_items_update_owner" on public.vt_music_playlist_items for update to authenticated using (exists(select 1 from public.vt_music_playlists p where p.id=playlist_id and p.owner_id=(select auth.uid()) and (select private.vt_has_club_role((select auth.uid()),p.club_id,'editor')))) with check (exists(select 1 from public.vt_music_playlists p where p.id=playlist_id and p.owner_id=(select auth.uid()) and (select private.vt_has_club_role((select auth.uid()),p.club_id,'editor')) and (track_id is null or exists(select 1 from public.vt_music_tracks t where t.id=track_id and t.club_id=p.club_id and t.active))));
drop policy if exists "vt_music_playlist_items_delete_owner" on public.vt_music_playlist_items;
create policy "vt_music_playlist_items_delete_owner" on public.vt_music_playlist_items for delete to authenticated using (exists(select 1 from public.vt_music_playlists p where p.id=playlist_id and p.owner_id=(select auth.uid()) and (select private.vt_has_club_role((select auth.uid()),p.club_id,'editor'))));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('vt-training-music','vt-training-music',false,31457280,array['audio/mpeg','audio/mp3','audio/mp4','audio/m4a','audio/x-m4a','audio/aac','audio/ogg','audio/wav','audio/x-wav']) on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "vt_training_music_read_club_editors" on storage.objects;
create policy "vt_training_music_read_club_editors" on storage.objects for select to authenticated using (bucket_id='vt-training-music' and case when (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$' then (select private.vt_has_club_role((select auth.uid()),((storage.foldername(name))[1])::uuid,'editor')) else false end);
drop policy if exists "vt_training_music_insert_owner" on storage.objects;
create policy "vt_training_music_insert_owner" on storage.objects for insert to authenticated with check (bucket_id='vt-training-music' and (storage.foldername(name))[2]=(select auth.uid())::text and case when (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$' then (select private.vt_has_club_role((select auth.uid()),((storage.foldername(name))[1])::uuid,'editor')) else false end);
drop policy if exists "vt_training_music_delete_owner" on storage.objects;
create policy "vt_training_music_delete_owner" on storage.objects for delete to authenticated using (bucket_id='vt-training-music' and (storage.foldername(name))[2]=(select auth.uid())::text and case when (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$' then (select private.vt_has_club_role((select auth.uid()),((storage.foldername(name))[1])::uuid,'editor')) else false end);
commit;
