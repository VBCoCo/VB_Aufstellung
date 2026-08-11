-- Volleyball Trainer 3.0.0
-- RLS-Policies fuer das Mandanten-/Rollenmodell
-- Stand: 11.08.2026
--
-- Ziel:
-- - anon: keinerlei Zugriff auf vt_*-Tabellen
-- - Viewer/Editor: nur Inhalte des eigenen Vereins
-- - Editor: Team-State schreiben
-- - Club-Admin: Vereins-Metadaten und Mannschaften verwalten,
--               aber NICHT automatisch Volleyball-Inhalte lesen
-- - Superadmin: nur Plattform-/Vereins-Metadaten, KEIN Zugriff auf
--               Mannschaften oder Volleyball-Inhalte fremder Vereine
--
-- Das Script ist wiederholbar: bestehende Policies mit den hier verwendeten
-- Namen werden vorher entfernt und neu angelegt.

begin;

-- ---------------------------------------------------------------------------
-- 1) Hilfsfunktionen in einem NICHT exponierten Schema
-- ---------------------------------------------------------------------------

create schema if not exists private;

revoke all on schema private from public;

create or replace function private.vt_is_platform_admin(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.vt_platform_admins a
    where a.user_id = p_user
      and a.active = true
  );
$$;

create or replace function private.vt_is_club_member(p_user uuid, p_club uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.vt_club_memberships m
    where m.user_id = p_user
      and m.club_id = p_club
      and m.active = true
  );
$$;

create or replace function private.vt_has_club_role(
  p_user uuid,
  p_club uuid,
  p_role text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.vt_club_memberships m
    join public.vt_club_member_roles r
      on r.membership_id = m.id
    where m.user_id = p_user
      and m.club_id = p_club
      and m.active = true
      and r.role = p_role
  );
$$;

create or replace function private.vt_membership_belongs_to_club(
  p_membership uuid,
  p_club uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.vt_club_memberships m
    where m.id = p_membership
      and m.club_id = p_club
      and m.active = true
  );
$$;

create or replace function private.vt_can_read_team(
  p_user uuid,
  p_team uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.vt_teams t
    where t.id = p_team
      and t.active = true
      and (
        private.vt_has_club_role(p_user, t.club_id, 'viewer')
        or private.vt_has_club_role(p_user, t.club_id, 'editor')
      )
  );
$$;

create or replace function private.vt_can_edit_team(
  p_user uuid,
  p_team uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.vt_teams t
    where t.id = p_team
      and t.active = true
      and private.vt_has_club_role(p_user, t.club_id, 'editor')
  );
$$;

-- Nicht direkt aus der Data API aufrufbar machen.
revoke all on function private.vt_is_platform_admin(uuid) from public;
revoke all on function private.vt_is_club_member(uuid,uuid) from public;
revoke all on function private.vt_has_club_role(uuid,uuid,text) from public;
revoke all on function private.vt_membership_belongs_to_club(uuid,uuid) from public;
revoke all on function private.vt_can_read_team(uuid,uuid) from public;
revoke all on function private.vt_can_edit_team(uuid,uuid) from public;

grant usage on schema private to authenticated;
grant execute on function private.vt_is_platform_admin(uuid) to authenticated;
grant execute on function private.vt_is_club_member(uuid,uuid) to authenticated;
grant execute on function private.vt_has_club_role(uuid,uuid,text) to authenticated;
grant execute on function private.vt_membership_belongs_to_club(uuid,uuid) to authenticated;
grant execute on function private.vt_can_read_team(uuid,uuid) to authenticated;
grant execute on function private.vt_can_edit_team(uuid,uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2) Indizes fuer die in Policies verwendeten Spalten
-- ---------------------------------------------------------------------------

create index if not exists vt_club_memberships_user_idx
  on public.vt_club_memberships(user_id);

create index if not exists vt_club_memberships_club_idx
  on public.vt_club_memberships(club_id);

create index if not exists vt_teams_club_idx
  on public.vt_teams(club_id);

create index if not exists vt_roles_membership_idx
  on public.vt_club_member_roles(membership_id);

-- ---------------------------------------------------------------------------
-- 3) Grundrechte: anon bleibt komplett ausgesperrt
-- ---------------------------------------------------------------------------

revoke all on
  public.vt_clubs,
  public.vt_teams,
  public.vt_profiles,
  public.vt_platform_admins,
  public.vt_club_memberships,
  public.vt_club_member_roles,
  public.vt_team_states
from anon;

-- Authentifizierte Benutzer bekommen nur die SQL-Rechte, die durch RLS
-- nochmals zeilenweise eingeschraenkt werden.
grant select on
  public.vt_clubs,
  public.vt_teams,
  public.vt_profiles,
  public.vt_platform_admins,
  public.vt_club_memberships,
  public.vt_club_member_roles,
  public.vt_team_states
to authenticated;

grant update on public.vt_profiles to authenticated;
grant update on public.vt_clubs to authenticated;
grant insert, update, delete on public.vt_teams to authenticated;
grant insert, update on public.vt_team_states to authenticated;

-- Mitgliedschaften/Rollen und Plattformadmins werden NICHT direkt
-- aus dem Browser geschrieben. Das erfolgt spaeter ueber Edge Functions.
revoke insert, update, delete on public.vt_platform_admins from authenticated;
revoke insert, update, delete on public.vt_club_memberships from authenticated;
revoke insert, update, delete on public.vt_club_member_roles from authenticated;

-- ---------------------------------------------------------------------------
-- 4) Alte Policies dieser Datei entfernen
-- ---------------------------------------------------------------------------

drop policy if exists "vt_clubs_select_member_or_platform_admin" on public.vt_clubs;
drop policy if exists "vt_clubs_update_club_admin" on public.vt_clubs;

drop policy if exists "vt_teams_select_club_member" on public.vt_teams;
drop policy if exists "vt_teams_insert_club_admin" on public.vt_teams;
drop policy if exists "vt_teams_update_club_admin" on public.vt_teams;
drop policy if exists "vt_teams_delete_club_admin" on public.vt_teams;

drop policy if exists "vt_profiles_select_own" on public.vt_profiles;
drop policy if exists "vt_profiles_update_own" on public.vt_profiles;

drop policy if exists "vt_platform_admins_select_platform_admin" on public.vt_platform_admins;

drop policy if exists "vt_memberships_select_own_or_club_admin" on public.vt_club_memberships;

drop policy if exists "vt_roles_select_own_or_club_admin" on public.vt_club_member_roles;

drop policy if exists "vt_team_states_select_viewer_editor" on public.vt_team_states;
drop policy if exists "vt_team_states_insert_editor" on public.vt_team_states;
drop policy if exists "vt_team_states_update_editor" on public.vt_team_states;

-- ---------------------------------------------------------------------------
-- 5) CLUBS
-- ---------------------------------------------------------------------------

-- Vereinsmitglieder sehen nur ihren Verein.
-- Superadmins sehen Vereins-METADATEN aller Vereine, aber dadurch noch
-- keine Mannschaften oder Volleyball-Inhalte.
create policy "vt_clubs_select_member_or_platform_admin"
on public.vt_clubs
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    (select private.vt_is_club_member((select auth.uid()), id))
    or
    (select private.vt_is_platform_admin((select auth.uid())))
  )
);

-- Nur Club-Admins des betreffenden Vereins duerfen Branding/Name etc. aendern.
create policy "vt_clubs_update_club_admin"
on public.vt_clubs
for update
to authenticated
using (
  (select private.vt_has_club_role((select auth.uid()), id, 'club_admin'))
)
with check (
  (select private.vt_has_club_role((select auth.uid()), id, 'club_admin'))
);

-- ---------------------------------------------------------------------------
-- 6) TEAMS
-- ---------------------------------------------------------------------------

-- Keine Plattform-Sonderregel: Ein Superadmin sieht Mannschaften nur,
-- wenn er selbst Mitglied des Vereins ist.
create policy "vt_teams_select_club_member"
on public.vt_teams
for select
to authenticated
using (
  (select private.vt_is_club_member((select auth.uid()), club_id))
);

create policy "vt_teams_insert_club_admin"
on public.vt_teams
for insert
to authenticated
with check (
  (select private.vt_has_club_role((select auth.uid()), club_id, 'club_admin'))
);

create policy "vt_teams_update_club_admin"
on public.vt_teams
for update
to authenticated
using (
  (select private.vt_has_club_role((select auth.uid()), club_id, 'club_admin'))
)
with check (
  (select private.vt_has_club_role((select auth.uid()), club_id, 'club_admin'))
);

create policy "vt_teams_delete_club_admin"
on public.vt_teams
for delete
to authenticated
using (
  (select private.vt_has_club_role((select auth.uid()), club_id, 'club_admin'))
);

-- ---------------------------------------------------------------------------
-- 7) PROFILES
-- ---------------------------------------------------------------------------

-- Vorerst nur eigenes Profil direkt les-/aenderbar.
-- Benutzerlisten fuer Club-Admins kommen spaeter kontrolliert ueber RPC/Edge.
create policy "vt_profiles_select_own"
on public.vt_profiles
for select
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
);

create policy "vt_profiles_update_own"
on public.vt_profiles
for update
to authenticated
using (
  user_id = (select auth.uid())
)
with check (
  user_id = (select auth.uid())
);

-- ---------------------------------------------------------------------------
-- 8) PLATFORM ADMINS
-- ---------------------------------------------------------------------------

-- Superadmins duerfen die Plattformadmin-Liste sehen.
-- Club-Mitgliedschaft entsteht dadurch nicht.
create policy "vt_platform_admins_select_platform_admin"
on public.vt_platform_admins
for select
to authenticated
using (
  (select private.vt_is_platform_admin((select auth.uid())))
);

-- ---------------------------------------------------------------------------
-- 9) CLUB MEMBERSHIPS
-- ---------------------------------------------------------------------------

-- Benutzer sehen ihre eigene Mitgliedschaft.
-- Club-Admins sehen die Mitgliedschaften ihres eigenen Vereins.
create policy "vt_memberships_select_own_or_club_admin"
on public.vt_club_memberships
for select
to authenticated
using (
  user_id = (select auth.uid())
  or
  (select private.vt_has_club_role((select auth.uid()), club_id, 'club_admin'))
);

-- ---------------------------------------------------------------------------
-- 10) CLUB MEMBER ROLES
-- ---------------------------------------------------------------------------

-- Eigene Rollen duerfen gelesen werden.
-- Club-Admins sehen Rollen innerhalb ihres Vereins.
create policy "vt_roles_select_own_or_club_admin"
on public.vt_club_member_roles
for select
to authenticated
using (
  exists (
    select 1
    from public.vt_club_memberships m
    where m.id = membership_id
      and (
        m.user_id = (select auth.uid())
        or (select private.vt_has_club_role((select auth.uid()), m.club_id, 'club_admin'))
      )
  )
);

-- ---------------------------------------------------------------------------
-- 11) TEAM STATES / VOLLEYBALL-INHALTE
-- ---------------------------------------------------------------------------

-- WICHTIG:
-- Superadmin allein reicht NICHT.
-- Club-Admin allein reicht ebenfalls NICHT.
-- Lesen darf nur, wer im betreffenden Verein Viewer oder Editor ist.
create policy "vt_team_states_select_viewer_editor"
on public.vt_team_states
for select
to authenticated
using (
  (select private.vt_can_read_team((select auth.uid()), team_id))
);

-- Schreiben darf nur Editor.
create policy "vt_team_states_insert_editor"
on public.vt_team_states
for insert
to authenticated
with check (
  (select private.vt_can_edit_team((select auth.uid()), team_id))
  and updated_by = (select auth.uid())
);

create policy "vt_team_states_update_editor"
on public.vt_team_states
for update
to authenticated
using (
  (select private.vt_can_edit_team((select auth.uid()), team_id))
)
with check (
  (select private.vt_can_edit_team((select auth.uid()), team_id))
  and updated_by = (select auth.uid())
);

commit;

-- ---------------------------------------------------------------------------
-- 12) Kontrolle
-- ---------------------------------------------------------------------------

select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename like 'vt_%'
order by tablename, policyname;
