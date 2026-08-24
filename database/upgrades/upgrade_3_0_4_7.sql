-- Volleyball Trainer 3.0.4.7
-- Bearbeiter dürfen Test-/Fehlfragen samt Nachrichten vollständig löschen.
-- Ausführung: einmal im Supabase SQL Editor. Keine CLI erforderlich.

create or replace function public.vt_delete_question(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_club uuid;
begin
  select t.club_id
    into v_club
  from public.vt_questions q
  join public.vt_teams t on t.id = q.team_id
  where q.id = p_question_id;

  if v_club is null then
    raise exception 'Frage nicht gefunden';
  end if;

  if not public.vt_has_club_role(auth.uid(), v_club, 'editor') then
    raise exception 'Nur Bearbeiter dürfen Fragen löschen';
  end if;

  delete from public.vt_questions where id = p_question_id;
end;
$$;

revoke all on function public.vt_delete_question(uuid) from public;
grant execute on function public.vt_delete_question(uuid) to authenticated;
