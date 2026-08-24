-- Volleyball Trainer 3.0.4.4 - Freigaben, Infos, Fragen & Antworten
-- Im Supabase SQL Editor einmal ausfuehren. Keine CLI erforderlich.

create table if not exists public.vt_questions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.vt_teams(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  situation_index integer not null check (situation_index >= 0),
  step_index integer not null check (step_index >= 0),
  situation_name text not null default '',
  step_name text not null default '',
  status text not null default 'open' check (status in ('open','answered','resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.vt_question_messages (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.vt_questions(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
alter table public.vt_questions enable row level security;
alter table public.vt_question_messages enable row level security;
revoke all on public.vt_questions, public.vt_question_messages from anon, authenticated;

create or replace function public.vt_list_questions(p_team_id uuid)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_club uuid; v_editor boolean; v_result jsonb;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  select club_id into v_club from public.vt_teams where id=p_team_id and active;
  if v_club is null then raise exception 'Mannschaft nicht gefunden'; end if;
  v_editor:=public.vt_has_club_role(auth.uid(),v_club,'editor');
  if not (v_editor or public.vt_has_club_role(auth.uid(),v_club,'viewer')) then raise exception 'Keine Leseberechtigung'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',q.id,'status',q.status,'situation_index',q.situation_index,'step_index',q.step_index,
    'situation_name',q.situation_name,'step_name',q.step_name,'created_at',q.created_at,
    'author_name',coalesce(p.display_name,'Viewer'),
    'messages',(select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'body',m.body,'created_at',m.created_at,'author_name',coalesce(mp.display_name,'Benutzer'),'author_is_editor',public.vt_has_club_role(m.author_id,v_club,'editor')) order by m.created_at),'[]'::jsonb) from public.vt_question_messages m left join public.vt_profiles mp on mp.user_id=m.author_id where m.question_id=q.id)
  ) order by q.updated_at desc),'[]'::jsonb) into v_result
  from public.vt_questions q left join public.vt_profiles p on p.user_id=q.author_id
  where q.team_id=p_team_id and (v_editor or q.author_id=auth.uid());
  return v_result;
end;$$;

create or replace function public.vt_create_question(p_team_id uuid,p_situation_index integer,p_step_index integer,p_situation_name text,p_step_name text,p_body text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_club uuid; v_id uuid;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  select club_id into v_club from public.vt_teams where id=p_team_id and active;
  if v_club is null or not (public.vt_has_club_role(auth.uid(),v_club,'viewer') or public.vt_has_club_role(auth.uid(),v_club,'editor')) then raise exception 'Keine Berechtigung'; end if;
  if char_length(trim(coalesce(p_body,''))) not between 1 and 2000 then raise exception 'Bitte eine Frage eingeben'; end if;
  insert into public.vt_questions(team_id,author_id,situation_index,step_index,situation_name,step_name) values(p_team_id,auth.uid(),p_situation_index,p_step_index,left(coalesce(p_situation_name,''),120),left(coalesce(p_step_name,''),120)) returning id into v_id;
  insert into public.vt_question_messages(question_id,author_id,body) values(v_id,auth.uid(),trim(p_body));
  return v_id;
end;$$;

create or replace function public.vt_add_question_message(p_question_id uuid,p_body text)
returns void language plpgsql security definer set search_path=public as $$
declare v_team uuid; v_club uuid; v_owner uuid; v_editor boolean;
begin
  select q.team_id,q.author_id,t.club_id into v_team,v_owner,v_club from public.vt_questions q join public.vt_teams t on t.id=q.team_id where q.id=p_question_id;
  if v_club is null then raise exception 'Frage nicht gefunden'; end if;
  v_editor:=public.vt_has_club_role(auth.uid(),v_club,'editor');
  if not (v_editor or (v_owner=auth.uid() and public.vt_has_club_role(auth.uid(),v_club,'viewer'))) then raise exception 'Keine Berechtigung'; end if;
  insert into public.vt_question_messages(question_id,author_id,body) values(p_question_id,auth.uid(),trim(p_body));
  update public.vt_questions set status=case when v_editor then 'answered' else 'open' end,updated_at=now() where id=p_question_id;
end;$$;

create or replace function public.vt_set_question_status(p_question_id uuid,p_status text)
returns void language plpgsql security definer set search_path=public as $$
declare v_club uuid;
begin
  if p_status not in ('open','answered','resolved') then raise exception 'Ungueltiger Status'; end if;
  select t.club_id into v_club from public.vt_questions q join public.vt_teams t on t.id=q.team_id where q.id=p_question_id;
  if v_club is null or not public.vt_has_club_role(auth.uid(),v_club,'editor') then raise exception 'Keine Bearbeitungsberechtigung'; end if;
  update public.vt_questions set status=p_status,updated_at=now() where id=p_question_id;
end;$$;

-- Viewer erhalten aus dem Team-State nur freigegebene Spielsituationen. Bearbeiter erhalten den kompletten Arbeitsstand.
create or replace function public.load_team_state(p_team_id uuid)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_club uuid; v_payload jsonb; v_editor boolean; v_teams jsonb;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  select club_id into v_club from public.vt_teams where id=p_team_id and active;
  if v_club is null then raise exception 'Mannschaft nicht gefunden'; end if;
  v_editor:=public.vt_has_club_role(auth.uid(),v_club,'editor');
  if not (v_editor or public.vt_has_club_role(auth.uid(),v_club,'viewer')) then raise exception 'Keine Leseberechtigung'; end if;
  select payload into v_payload from public.vt_team_states where team_id=p_team_id;
  if v_payload is null or v_editor then return v_payload; end if;
  select jsonb_agg(jsonb_set(team,'{rotations}',coalesce((select jsonb_agg(rot) from jsonb_array_elements(coalesce(team->'rotations','[]'::jsonb)) rot where coalesce((rot->>'published')::boolean,false)),'[]'::jsonb))) into v_teams from jsonb_array_elements(coalesce(v_payload->'teams','[]'::jsonb)) team;
  return jsonb_set(v_payload,'{teams}',coalesce(v_teams,'[]'::jsonb));
end;$$;

revoke all on function public.vt_list_questions(uuid) from public;
revoke all on function public.vt_create_question(uuid,integer,integer,text,text,text) from public;
revoke all on function public.vt_add_question_message(uuid,text) from public;
revoke all on function public.vt_set_question_status(uuid,text) from public;
grant execute on function public.vt_list_questions(uuid) to authenticated;
grant execute on function public.vt_create_question(uuid,integer,integer,text,text,text) to authenticated;
grant execute on function public.vt_add_question_message(uuid,text) to authenticated;
grant execute on function public.vt_set_question_status(uuid,text) to authenticated;
