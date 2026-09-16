-- Power Dance Lab V1
-- Datengetriebener Samplekatalog und persönliche Superadmin-Testpresets.

create table if not exists public.vt_music_sample_packs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  name text not null check (char_length(name) between 2 and 120),
  instrument_role text not null check (instrument_role in ('bass','lead','harmony','choir','drums','effects')),
  manifest jsonb not null default '{}'::jsonb check (jsonb_typeof(manifest) = 'object'),
  license_name text not null check (char_length(license_name) between 2 and 120),
  license_source text not null check (char_length(license_source) between 3 and 500),
  storage_prefix text,
  bundled boolean not null default false,
  lab_enabled boolean not null default true,
  production_enabled boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vt_power_dance_presets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  settings jsonb not null check (jsonb_typeof(settings) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vt_music_sample_packs_created_by_idx
  on public.vt_music_sample_packs(created_by);
create unique index if not exists vt_power_dance_presets_owner_name
  on public.vt_power_dance_presets(owner_id, lower(name));

alter table public.vt_music_sample_packs enable row level security;
alter table public.vt_power_dance_presets enable row level security;

revoke all on public.vt_music_sample_packs from anon;
revoke all on public.vt_power_dance_presets from anon;
grant select, insert, update, delete on public.vt_music_sample_packs to authenticated;
grant select, insert, update, delete on public.vt_power_dance_presets to authenticated;

drop policy if exists "vt_music_sample_packs_select" on public.vt_music_sample_packs;
create policy "vt_music_sample_packs_select"
on public.vt_music_sample_packs for select to authenticated
using (
  production_enabled
  or (select private.vt_is_platform_admin((select auth.uid())))
);

drop policy if exists "vt_music_sample_packs_platform_insert" on public.vt_music_sample_packs;
create policy "vt_music_sample_packs_platform_insert"
on public.vt_music_sample_packs for insert to authenticated
with check (
  (select private.vt_is_platform_admin((select auth.uid())))
  and created_by = (select auth.uid())
);

drop policy if exists "vt_music_sample_packs_platform_update" on public.vt_music_sample_packs;
create policy "vt_music_sample_packs_platform_update"
on public.vt_music_sample_packs for update to authenticated
using ((select private.vt_is_platform_admin((select auth.uid()))))
with check ((select private.vt_is_platform_admin((select auth.uid()))));

drop policy if exists "vt_music_sample_packs_platform_delete" on public.vt_music_sample_packs;
create policy "vt_music_sample_packs_platform_delete"
on public.vt_music_sample_packs for delete to authenticated
using ((select private.vt_is_platform_admin((select auth.uid()))));

drop policy if exists "vt_power_dance_presets_own_select" on public.vt_power_dance_presets;
create policy "vt_power_dance_presets_own_select"
on public.vt_power_dance_presets for select to authenticated
using (
  owner_id = (select auth.uid())
  and (select private.vt_is_platform_admin((select auth.uid())))
);

drop policy if exists "vt_power_dance_presets_own_insert" on public.vt_power_dance_presets;
create policy "vt_power_dance_presets_own_insert"
on public.vt_power_dance_presets for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and (select private.vt_is_platform_admin((select auth.uid())))
);

drop policy if exists "vt_power_dance_presets_own_update" on public.vt_power_dance_presets;
create policy "vt_power_dance_presets_own_update"
on public.vt_power_dance_presets for update to authenticated
using (
  owner_id = (select auth.uid())
  and (select private.vt_is_platform_admin((select auth.uid())))
)
with check (
  owner_id = (select auth.uid())
  and (select private.vt_is_platform_admin((select auth.uid())))
);

drop policy if exists "vt_power_dance_presets_own_delete" on public.vt_power_dance_presets;
create policy "vt_power_dance_presets_own_delete"
on public.vt_power_dance_presets for delete to authenticated
using (
  owner_id = (select auth.uid())
  and (select private.vt_is_platform_admin((select auth.uid())))
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vt-music-samples',
  'vt-music-samples',
  true,
  10485760,
  array['audio/mpeg','audio/mp3','audio/ogg','audio/wav','audio/x-wav']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "vt_music_samples_platform_insert" on storage.objects;
create policy "vt_music_samples_platform_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'vt-music-samples'
  and (select private.vt_is_platform_admin((select auth.uid())))
);

drop policy if exists "vt_music_samples_platform_update" on storage.objects;
create policy "vt_music_samples_platform_update"
on storage.objects for update to authenticated
using (
  bucket_id = 'vt-music-samples'
  and (select private.vt_is_platform_admin((select auth.uid())))
)
with check (
  bucket_id = 'vt-music-samples'
  and (select private.vt_is_platform_admin((select auth.uid())))
);

drop policy if exists "vt_music_samples_platform_delete" on storage.objects;
create policy "vt_music_samples_platform_delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'vt-music-samples'
  and (select private.vt_is_platform_admin((select auth.uid())))
);

insert into public.vt_music_sample_packs
  (slug, name, instrument_role, manifest, license_name, license_source, bundled, lab_enabled, production_enabled)
values
  ('power-dance-lately-bass', 'Power Dance · Lately Bass', 'bass',
   '{"baseUrl":"assets/audio/packs/power-dance-bass/","attack":0.006,"release":0.12,"urls":{"C1":"C1.mp3","F#1":"Fs1.mp3","C2":"C2.mp3","F#2":"Fs2.mp3","C3":"C3.mp3"}}',
   'CC0 1.0', 'https://freepats.zenvoid.org/', true, true, false),
  ('power-dance-bright-lead', 'Power Dance · Bright Lead', 'lead',
   '{"baseUrl":"assets/audio/packs/power-dance-lead/","attack":0.006,"release":0.16,"urls":{"C3":"C3.mp3","E3":"E3.mp3","G#3":"Gs3.mp3","C4":"C4.mp3","E4":"E4.mp3","G#4":"Gs4.mp3","C5":"C5.mp3","E5":"E5.mp3","G#5":"Gs5.mp3"}}',
   'CC0 1.0', 'https://freepats.zenvoid.org/', true, true, false),
  ('power-dance-fm-piano', 'Power Dance · FM Piano', 'harmony',
   '{"baseUrl":"assets/audio/packs/power-dance-piano/","attack":0.006,"release":0.18,"urls":{"C3":"C3.mp3","F#3":"Fs3.mp3","C4":"C4.mp3","F#4":"Fs4.mp3","C5":"C5.mp3","F#5":"Fs5.mp3"}}',
   'CC0 1.0', 'https://freepats.zenvoid.org/', true, true, false),
  ('power-dance-accordion-accent', 'Power Dance · Akkordeon-Akzent', 'lead',
   '{"baseUrl":"assets/audio/packs/accordion/","attack":0.008,"release":0.22,"urls":{"A4":"A4.mp3","C5":"C5.mp3","E5":"E5.mp3","G5":"G5.mp3","C6":"C6.mp3"}}',
   'CC0 1.0', 'https://freepats.zenvoid.org/', true, true, false),
  ('power-dance-choir', 'Power Dance · Chorfläche', 'choir',
   '{"baseUrl":"assets/audio/packs/choir/","attack":0.10,"release":1.2,"urls":{"C3":"C3.mp3","F#3":"Fs3.mp3","C4":"C4.mp3","F#4":"Fs4.mp3","C5":"C5.mp3"}}',
   'CC0 1.0', 'https://freepats.zenvoid.org/', true, true, false)
on conflict (slug) do update set
  name = excluded.name,
  instrument_role = excluded.instrument_role,
  manifest = excluded.manifest,
  license_name = excluded.license_name,
  license_source = excluded.license_source,
  bundled = excluded.bundled,
  lab_enabled = excluded.lab_enabled,
  updated_at = now();

insert into public.vt_project_log
  (entry_key, entry_type, title, content, status, app_version, tags)
select
  'release-power-dance-lab-v1', 'release', 'Power Dance Lab V1',
   'Super-Admin-Testlabor mit live veränderbaren Klang- und Arrangementparametern, datengetriebenem Samplekatalog, Sample-Upload und persönlichen Testpresets. Der produktive Trainingsgenerator bleibt unverändert.',
   'done', '3.17.0', array['music','power-dance','superadmin','samples']
where not exists (
  select 1 from public.vt_project_log
  where entry_key = 'release-power-dance-lab-v1' and status <> 'superseded'
);
