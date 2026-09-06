-- Release 3.14.51 – zentrales Projektgedächtnis
-- Entscheidungen, Releases, Roadmap und bekannte Punkte werden revisionssicher dokumentiert.

create table if not exists public.vt_project_log (
  id uuid primary key default gen_random_uuid(),
  entry_key text not null,
  entry_type text not null check (entry_type in ('decision','release','roadmap','known_issue')),
  title text not null check (char_length(title) between 1 and 180),
  content text not null check (char_length(content) between 1 and 12000),
  status text not null default 'active' check (status in ('active','planned','done','accepted','superseded')),
  app_version text,
  commit_sha text,
  tags text[] not null default '{}',
  supersedes_id uuid references public.vt_project_log(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (app_version is null or char_length(app_version) <= 40),
  check (commit_sha is null or char_length(commit_sha) <= 80),
  check (char_length(entry_key) between 1 and 180)
);

create index if not exists vt_project_log_current_idx
  on public.vt_project_log (entry_type, status, created_at desc);
create index if not exists vt_project_log_entry_key_idx
  on public.vt_project_log (entry_key, created_at desc);
create index if not exists vt_project_log_tags_idx
  on public.vt_project_log using gin (tags);

alter table public.vt_project_log enable row level security;
revoke all on table public.vt_project_log from anon, authenticated;
grant select, insert, update on table public.vt_project_log to authenticated;

drop policy if exists "vt_project_log_select_platform_admin" on public.vt_project_log;
drop policy if exists "vt_project_log_insert_platform_admin" on public.vt_project_log;
drop policy if exists "vt_project_log_update_platform_admin" on public.vt_project_log;

create policy "vt_project_log_select_platform_admin"
on public.vt_project_log for select
to authenticated
using ((select private.vt_is_platform_admin((select auth.uid()))));

create policy "vt_project_log_insert_platform_admin"
on public.vt_project_log for insert
to authenticated
with check (
  (select private.vt_is_platform_admin((select auth.uid())))
  and created_by = (select auth.uid())
);

create policy "vt_project_log_update_platform_admin"
on public.vt_project_log for update
to authenticated
using ((select private.vt_is_platform_admin((select auth.uid()))))
with check ((select private.vt_is_platform_admin((select auth.uid()))));

create or replace function public.get_project_context()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'project', 'Volleyball Trainer',
    'generated_at', now(),
    'current_version', coalesce((
      select l.app_version
      from public.vt_project_log l
      where l.entry_type = 'release' and l.status = 'done' and l.app_version is not null
      order by l.created_at desc
      limit 1
    ), ''),
    'entries', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.type_order, x.created_at desc)
      from (
        select
          l.id,
          l.entry_key,
          l.entry_type,
          l.title,
          l.content,
          l.status,
          l.app_version,
          l.commit_sha,
          l.tags,
          l.supersedes_id,
          l.created_at,
          case l.entry_type
            when 'decision' then 1
            when 'roadmap' then 2
            when 'known_issue' then 3
            else 4
          end as type_order
        from public.vt_project_log l
        where l.status <> 'superseded'
      ) x
    ), '[]'::jsonb)
  );
$$;

create or replace function public.save_project_log_entry(
  p_entry_type text,
  p_title text,
  p_content text,
  p_status text,
  p_app_version text,
  p_commit_sha text,
  p_tags text[],
  p_replaces_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_entry_key text;
begin
  if p_replaces_id is not null then
    select entry_key into v_entry_key
    from public.vt_project_log
    where id = p_replaces_id
    for update;

    if v_entry_key is null then
      raise exception 'Der zu ersetzende Eintrag wurde nicht gefunden.';
    end if;

    update public.vt_project_log
    set status = 'superseded', updated_at = now()
    where id = p_replaces_id;
  else
    v_entry_key := p_entry_type || '-' || left(gen_random_uuid()::text, 8);
  end if;

  insert into public.vt_project_log (
    entry_key, entry_type, title, content, status, app_version,
    commit_sha, tags, supersedes_id, created_by
  ) values (
    v_entry_key,
    p_entry_type,
    trim(p_title),
    trim(p_content),
    p_status,
    nullif(trim(coalesce(p_app_version, '')), ''),
    nullif(trim(coalesce(p_commit_sha, '')), ''),
    coalesce(p_tags, '{}'),
    p_replaces_id,
    auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.get_project_context() from public, anon;
revoke all on function public.save_project_log_entry(text,text,text,text,text,text,text[],uuid) from public, anon;
grant execute on function public.get_project_context() to authenticated;
grant execute on function public.save_project_log_entry(text,text,text,text,text,text,text[],uuid) to authenticated;

insert into public.vt_project_log
  (entry_key, entry_type, title, content, status, app_version, commit_sha, tags, created_by)
values
  ('release-3-14-50', 'release', 'Version 3.14.50',
   'Ansagen und Signaltöne wurden gegenüber der Musik deutlich angehoben. Der Audiotest wurde anschließend erfolgreich bestätigt.',
   'done', '3.14.50', 'a85aec8d762c9ce9f54802f037c5076dbbf4b81d', array['audio','player'], null),
  ('decision-fixed-track-tempo', 'decision', 'Musiktempo innerhalb eines Titels bleibt konstant',
   'Eine zulässige BPM-Anpassung wird beim Start des Titels festgelegt. Ansagen, Ducking und Signaltöne dürfen die Wiedergabegeschwindigkeit während des Titels nicht verändern.',
   'active', '3.14.49', null, array['audio','tempo','player'], null),
  ('decision-audio-diagnostics-access', 'decision', 'Audio-Diagnose nur für Superadmins im Trainingsplayer',
   'Die Schaltfläche Audio-Diagnose ist ausschließlich für Superadmins und nur innerhalb des Trainingsplayers sichtbar. Beim Verlassen des Players wird ein geöffnetes Diagnosefenster geschlossen.',
   'planned', null, null, array['audio','diagnostics','permissions'], null),
  ('decision-ios-viewer-safe-area', 'known_issue', 'Helle iOS-Kopfzeile im Viewer wird vorerst akzeptiert',
   'Im Login und Editor übernimmt die obere iOS-Safe-Area die Vereinsfarbe. Im Viewer bleibt sie auf einzelnen iOS-Konstellationen hell. Nach mehreren Korrekturversuchen wird dieser rein optische Punkt vorerst nicht weiterverfolgt.',
   'accepted', '3.14.48', null, array['ios','viewer','safe-area'], null),
  ('decision-exercise-game-pairs', 'decision', 'Übungsform und Spielform werden als Paar geplant',
   'Im Übungsteil soll möglichst zuerst eine Übungsform und unmittelbar danach eine fachlich passende Spielform folgen. Die Übungsform dauert kürzer als die zugehörige Spielform.',
   'active', null, null, array['exercise-library','training-planner'], null),
  ('decision-hall-profile', 'decision', 'Hallenprofil wird im Datenmodell vorgesehen',
   'Hallen, Felder und verfügbare Ressourcen werden als Hallenprofil modelliert, damit die spätere Trainingsplanung räumliche und materielle Einschränkungen berücksichtigen kann.',
   'active', null, null, array['hall-profile','training-planner'], null),
  ('roadmap-exercise-library-beta', 'roadmap', 'Übungsbibliothek als Beta abnehmen',
   'Vorhandene Athletik- und Volleyballübungen sowie Suchen, Filtern, Favoriten, Kopieren, Anlegen und Bearbeiten auf Mobilgeräten vollständig testen und gefundene Punkte korrigieren.',
   'planned', null, null, array['exercise-library','beta'], null),
  ('roadmap-training-planner', 'roadmap', 'Trainingsplaner aufbauen',
   'Nach der Abnahme der Übungsbibliothek folgt ein manueller Trainingsplaner auf Basis von Übungen, Mannschaftsprofil und Hallenprofil.',
   'planned', null, null, array['training-planner'], null),
  ('roadmap-automatic-planning', 'roadmap', 'Automatische Trainingsplanung ergänzen',
   'Die automatische Planung berücksichtigt Schwerpunkte, Dauer, Spielerzahl, Material, Halle sowie die Abfolge Übungsform zu passender längerer Spielform.',
   'planned', null, null, array['training-planner','automation'], null);

