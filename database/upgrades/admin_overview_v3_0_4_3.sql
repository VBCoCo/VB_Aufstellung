-- Volleyball Trainer 3.0.4.3
-- Lese-RPCs fuer Plattform- und Vereinsverwaltung.
-- Keine Volleyball-Inhalte werden an Superadmins freigegeben.

begin;

create or replace function public.get_platform_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;
  if not exists (
    select 1 from public.vt_platform_admins a
    where a.user_id = auth.uid() and a.active = true
  ) then
    raise exception 'Keine Superadmin-Berechtigung';
  end if;

  select jsonb_build_object(
    'platform_admins', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', a.user_id,
        'admin_code', a.admin_code,
        'active', a.active,
        'email', u.email,
        'display_name', p.display_name
      ) order by a.admin_code)
      from public.vt_platform_admins a
      join auth.users u on u.id = a.user_id
      left join public.vt_profiles p on p.user_id = a.user_id
    ), '[]'::jsonb),
    'clubs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'slug', c.slug,
        'active', c.active,
        'created_at', c.created_at,
        'primary_color', c.primary_color,
        'accent_color', c.accent_color,
        'team_count', (select count(*) from public.vt_teams t where t.club_id=c.id and t.active),
        'member_count', (select count(*) from public.vt_club_memberships m_count where m_count.club_id=c.id),
        'members', coalesce((
          select jsonb_agg(jsonb_build_object(
            'membership_id', m.id,
            'user_id', m.user_id,
            'email', u.email,
            'display_name', p.display_name,
            'active', m.active,
            'roles', coalesce((
              select jsonb_agg(r.role order by r.role)
              from public.vt_club_member_roles r
              where r.membership_id=m.id
            ), '[]'::jsonb)
          ) order by coalesce(p.display_name,u.email),u.email)
          from public.vt_club_memberships m
          join auth.users u on u.id=m.user_id
          left join public.vt_profiles p on p.user_id=m.user_id
          where m.club_id=c.id
            and exists (
              select 1 from public.vt_club_member_roles r_admin
              where r_admin.membership_id=m.id and r_admin.role='club_admin'
            )
        ), '[]'::jsonb)
      ) order by c.name)
      from public.vt_clubs c
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.get_club_overview(p_club_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;
  if not exists (
    select 1
    from public.vt_club_memberships m
    join public.vt_club_member_roles r on r.membership_id=m.id
    where m.user_id=auth.uid()
      and m.club_id=p_club_id
      and m.active=true
      and r.role='club_admin'
  ) then
    raise exception 'Keine Vereinsadmin-Berechtigung';
  end if;

  select jsonb_build_object(
    'club', jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'slug', c.slug,
      'active', c.active,
      'created_at', c.created_at,
      'primary_color', c.primary_color,
      'accent_color', c.accent_color
    ),
    'teams', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id,
        'name', t.name,
        'active', t.active,
        'created_at', t.created_at
      ) order by t.name)
      from public.vt_teams t
      where t.club_id=c.id
    ), '[]'::jsonb),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'membership_id', m.id,
        'user_id', m.user_id,
        'email', u.email,
        'display_name', p.display_name,
        'active', m.active,
        'created_at', m.created_at,
        'roles', coalesce((
          select jsonb_agg(r.role order by r.role)
          from public.vt_club_member_roles r
          where r.membership_id=m.id
        ), '[]'::jsonb)
      ) order by coalesce(p.display_name,u.email),u.email)
      from public.vt_club_memberships m
      join auth.users u on u.id=m.user_id
      left join public.vt_profiles p on p.user_id=m.user_id
      where m.club_id=c.id
    ), '[]'::jsonb)
  ) into v_result
  from public.vt_clubs c
  where c.id=p_club_id;

  if v_result is null then raise exception 'Verein nicht gefunden'; end if;
  return v_result;
end;
$$;

revoke all on function public.get_platform_overview() from public;
revoke all on function public.get_club_overview(uuid) from public;
grant execute on function public.get_platform_overview() to authenticated;
grant execute on function public.get_club_overview(uuid) to authenticated;

commit;

-- Kontrolle
select proname, prosecdef
from pg_proc
where proname in ('get_platform_overview','get_club_overview')
order by proname;
