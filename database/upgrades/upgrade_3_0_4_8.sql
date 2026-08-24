-- Volleyball Trainer 3.0.4.8
-- Ungelesen-Zähler für Fragen und Antworten.
-- Einmal im Supabase SQL Editor ausführen. Keine CLI erforderlich.

create table if not exists public.vt_question_reads (
  question_id uuid not null references public.vt_questions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (question_id, user_id)
);

alter table public.vt_question_reads enable row level security;
revoke all on public.vt_question_reads from anon, authenticated;

create or replace function public.vt_mark_question_read(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_club uuid;
  v_owner uuid;
  v_editor boolean;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;

  select t.club_id, q.author_id
    into v_club, v_owner
  from public.vt_questions q
  join public.vt_teams t on t.id = q.team_id
  where q.id = p_question_id;

  if v_club is null then raise exception 'Frage nicht gefunden'; end if;

  v_editor := public.vt_has_club_role(auth.uid(), v_club, 'editor');
  if not (v_editor or (v_owner = auth.uid() and public.vt_has_club_role(auth.uid(), v_club, 'viewer'))) then
    raise exception 'Keine Leseberechtigung';
  end if;

  insert into public.vt_question_reads(question_id, user_id, last_read_at)
  values (p_question_id, auth.uid(), now())
  on conflict (question_id, user_id)
  do update set last_read_at = excluded.last_read_at;
end;
$$;

create or replace function public.vt_list_questions(p_team_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_club uuid;
  v_editor boolean;
  v_result jsonb;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;

  select club_id into v_club
  from public.vt_teams
  where id = p_team_id and active;

  if v_club is null then raise exception 'Mannschaft nicht gefunden'; end if;

  v_editor := public.vt_has_club_role(auth.uid(), v_club, 'editor');
  if not (v_editor or public.vt_has_club_role(auth.uid(), v_club, 'viewer')) then
    raise exception 'Keine Leseberechtigung';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', q.id,
    'status', q.status,
    'situation_index', q.situation_index,
    'step_index', q.step_index,
    'situation_name', q.situation_name,
    'step_name', q.step_name,
    'created_at', q.created_at,
    'author_name', coalesce(p.display_name, 'Viewer'),
    'unread_messages', (
      select count(*)::integer
      from public.vt_question_messages um
      where um.question_id = q.id
        and um.author_id <> auth.uid()
        and um.created_at > coalesce(
          (select qr.last_read_at
             from public.vt_question_reads qr
            where qr.question_id = q.id and qr.user_id = auth.uid()),
          '-infinity'::timestamptz
        )
    ),
    'messages', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', m.id,
        'body', m.body,
        'created_at', m.created_at,
        'author_name', coalesce(mp.display_name, 'Benutzer'),
        'author_is_editor', public.vt_has_club_role(m.author_id, v_club, 'editor')
      ) order by m.created_at), '[]'::jsonb)
      from public.vt_question_messages m
      left join public.vt_profiles mp on mp.user_id = m.author_id
      where m.question_id = q.id
    )
  ) order by q.updated_at desc), '[]'::jsonb)
  into v_result
  from public.vt_questions q
  left join public.vt_profiles p on p.user_id = q.author_id
  where q.team_id = p_team_id
    and (v_editor or q.author_id = auth.uid());

  return v_result;
end;
$$;

revoke all on function public.vt_mark_question_read(uuid) from public;
grant execute on function public.vt_mark_question_read(uuid) to authenticated;
revoke all on function public.vt_list_questions(uuid) from public;
grant execute on function public.vt_list_questions(uuid) to authenticated;
