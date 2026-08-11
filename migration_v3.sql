-- Volleyball Trainer 3.0.0 - Mandanten-/Rollenmodell
-- Vorher Backup erstellen. Dieses Script loescht KEINE alten Volleyball-Daten.

create extension if not exists pgcrypto;

create table if not exists public.vt_clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_path text,
  primary_color text not null default '#0b4fc6',
  accent_color text not null default '#0b4fc6',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.vt_teams (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.vt_clubs(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(club_id,name)
);

create table if not exists public.vt_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.vt_platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  admin_code text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.vt_club_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  club_id uuid not null references public.vt_clubs(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(user_id,club_id)
);

create table if not exists public.vt_club_member_roles (
  membership_id uuid not null references public.vt_club_memberships(id) on delete cascade,
  role text not null check(role in ('viewer','editor','club_admin')),
  primary key(membership_id,role)
);

create table if not exists public.vt_team_states (
  team_id uuid primary key references public.vt_teams(id) on delete cascade,
  payload jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- Ersten Mandanten / erste Mannschaft anlegen.
insert into public.vt_clubs(name,slug)
values ('TTC Geltendorf e.V.','ttc-geltendorf')
on conflict (slug) do nothing;

insert into public.vt_teams(club_id,name)
select c.id,'Volleyball'
from public.vt_clubs c
where c.slug='ttc-geltendorf'
on conflict (club_id,name) do nothing;

-- Bestehenden 2.x-Datenstand kopieren. Alte Tabelle bleibt unveraendert bestehen.
insert into public.vt_team_states(team_id,payload,updated_at)
select t.id,s.payload,coalesce(s.updated_at,now())
from public.vt_teams t
join public.vt_clubs c on c.id=t.club_id and c.slug='ttc-geltendorf'
left join public.volleyball_trainer_state s on s.id='main'
where t.name='Volleyball'
on conflict (team_id) do nothing;

alter table public.vt_clubs enable row level security;
alter table public.vt_teams enable row level security;
alter table public.vt_profiles enable row level security;
alter table public.vt_platform_admins enable row level security;
alter table public.vt_club_memberships enable row level security;
alter table public.vt_club_member_roles enable row level security;
alter table public.vt_team_states enable row level security;

revoke all on public.vt_clubs,public.vt_teams,public.vt_profiles,public.vt_platform_admins,public.vt_club_memberships,public.vt_club_member_roles,public.vt_team_states from anon,authenticated;

create or replace function public.vt_has_club_role(p_user uuid,p_club uuid,p_role text)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.vt_club_memberships m
    join public.vt_club_member_roles r on r.membership_id=m.id
    where m.user_id=p_user and m.club_id=p_club and m.active and r.role=p_role
  );
$$;

create or replace function public.get_my_access()
returns jsonb language sql stable security definer set search_path=public as $$
with me as (
  select auth.uid() uid
), memberships as (
  select m.id membership_id,m.club_id,c.name club_name,c.slug,c.logo_path,c.primary_color,c.accent_color
  from me join public.vt_club_memberships m on m.user_id=me.uid and m.active
  join public.vt_clubs c on c.id=m.club_id and c.active
), club_data as (
  select ms.club_id,ms.club_name,ms.slug,ms.logo_path,ms.primary_color,ms.accent_color,
    coalesce((select jsonb_agg(r.role order by r.role) from public.vt_club_member_roles r where r.membership_id=ms.membership_id),'[]'::jsonb) roles,
    coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'name',t.name) order by t.name) from public.vt_teams t where t.club_id=ms.club_id and t.active),'[]'::jsonb) teams
  from memberships ms
)
select jsonb_build_object(
  'user_id',auth.uid(),
  'display_name',(select p.display_name from public.vt_profiles p where p.user_id=auth.uid()),
  'platform_admin',exists(select 1 from public.vt_platform_admins a where a.user_id=auth.uid() and a.active),
  'platform_admin_code',(select a.admin_code from public.vt_platform_admins a where a.user_id=auth.uid() and a.active),
  'clubs',coalesce((select jsonb_agg(jsonb_build_object('id',club_id,'name',club_name,'slug',slug,'logo_path',logo_path,'primary_color',primary_color,'accent_color',accent_color,'roles',roles,'teams',teams) order by club_name) from club_data),'[]'::jsonb)
);
$$;

create or replace function public.load_team_state(p_team_id uuid)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_club uuid; v_payload jsonb;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  select club_id into v_club from public.vt_teams where id=p_team_id and active;
  if v_club is null then raise exception 'Mannschaft nicht gefunden'; end if;
  if not (public.vt_has_club_role(auth.uid(),v_club,'viewer') or public.vt_has_club_role(auth.uid(),v_club,'editor')) then
    raise exception 'Keine Leseberechtigung';
  end if;
  select payload into v_payload from public.vt_team_states where team_id=p_team_id;
  return v_payload;
end;
$$;

create or replace function public.save_team_state(p_team_id uuid,p_payload jsonb)
returns void language plpgsql security definer set search_path=public as $$
declare v_club uuid;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  select club_id into v_club from public.vt_teams where id=p_team_id and active;
  if v_club is null then raise exception 'Mannschaft nicht gefunden'; end if;
  if not public.vt_has_club_role(auth.uid(),v_club,'editor') then raise exception 'Keine Bearbeitungsberechtigung'; end if;
  insert into public.vt_team_states(team_id,payload,updated_at,updated_by)
  values(p_team_id,p_payload,now(),auth.uid())
  on conflict(team_id) do update set payload=excluded.payload,updated_at=excluded.updated_at,updated_by=excluded.updated_by;
end;
$$;

revoke all on function public.vt_has_club_role(uuid,uuid,text) from public;
revoke all on function public.get_my_access() from public;
revoke all on function public.load_team_state(uuid) from public;
revoke all on function public.save_team_state(uuid,jsonb) from public;
grant execute on function public.get_my_access() to authenticated;
grant execute on function public.load_team_state(uuid) to authenticated;
grant execute on function public.save_team_state(uuid,jsonb) to authenticated;

-- Alte oeffentliche 2.x-RPCs sperren. Die Tabellen selbst werden NICHT geloescht.
revoke execute on function public.load_trainer_state() from anon;
revoke execute on function public.validate_editor_password(text) from anon;
revoke execute on function public.save_trainer_state(text,jsonb) from anon;
