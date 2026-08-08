-- Volleyball Trainer 2.4.5
-- Einmal im Supabase SQL Editor ausführen.
-- Kein Benutzer-Login nötig. Lesen ist öffentlich; Schreiben erfolgt nur über RPC mit Editor-Passwort.

create extension if not exists pgcrypto;

create table if not exists public.volleyball_trainer_state (
  id text primary key,
  payload jsonb,
  updated_at timestamptz not null default now()
);

insert into public.volleyball_trainer_state(id,payload)
values('main',null)
on conflict (id) do nothing;

create table if not exists public.volleyball_trainer_settings (
  id text primary key,
  editor_password_hash text not null
);

insert into public.volleyball_trainer_settings(id,editor_password_hash)
values('main', extensions.crypt('', extensions.gen_salt('bf')))
on conflict (id) do update set editor_password_hash=excluded.editor_password_hash;

alter table public.volleyball_trainer_state enable row level security;
alter table public.volleyball_trainer_settings enable row level security;

-- Keine direkten Tabellenzugriffe für anon. Zugriff nur über SECURITY DEFINER Funktionen.
revoke all on public.volleyball_trainer_state from anon, authenticated;
revoke all on public.volleyball_trainer_settings from anon, authenticated;

create or replace function public.load_trainer_state()
returns jsonb
language sql
stable
security definer
set search_path=public
as $$
  select payload from public.volleyball_trainer_state where id='main';
$$;

create or replace function public.validate_editor_password(p_password text)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select coalesce(
    extensions.crypt(p_password, editor_password_hash)=editor_password_hash,
    false
  )
  from public.volleyball_trainer_settings
  where id='main';
$$;

create or replace function public.save_trainer_state(p_password text,p_payload jsonb)
returns void
language plpgsql
security definer
set search_path=public
as $$
begin
  if not public.validate_editor_password(p_password) then
    raise exception 'Ungültiges Bearbeitungspasswort';
  end if;
  update public.volleyball_trainer_state
  set payload=p_payload, updated_at=now()
  where id='main';
end;
$$;

revoke all on function public.load_trainer_state() from public;
revoke all on function public.validate_editor_password(text) from public;
revoke all on function public.save_trainer_state(text,jsonb) from public;
grant execute on function public.load_trainer_state() to anon, authenticated;
grant execute on function public.validate_editor_password(text) to anon, authenticated;
grant execute on function public.save_trainer_state(text,jsonb) to anon, authenticated;
