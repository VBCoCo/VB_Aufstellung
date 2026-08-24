-- NACHDEM du deinen Benutzer unter Authentication > Users eingeladen hast.
-- E-Mail unten ersetzen und einmal im SQL Editor ausfuehren.
do $$
declare
  v_email text := 'DEINE-EMAIL@BEISPIEL.DE';
  v_user uuid;
  v_club uuid;
  v_membership uuid;
begin
  select id into v_user from auth.users where lower(email)=lower(v_email) order by created_at limit 1;
  if v_user is null then raise exception 'Kein Auth-Benutzer fuer % gefunden',v_email; end if;
  select id into v_club from public.vt_clubs where slug='ttc-geltendorf';
  insert into public.vt_profiles(user_id,display_name) values(v_user,'Robert') on conflict(user_id) do nothing;
  insert into public.vt_platform_admins(user_id,admin_code) values(v_user,'SA-01') on conflict(user_id) do update set active=true;
  insert into public.vt_club_memberships(user_id,club_id) values(v_user,v_club)
    on conflict(user_id,club_id) do update set active=true returning id into v_membership;
  insert into public.vt_club_member_roles(membership_id,role) values
    (v_membership,'viewer'),(v_membership,'editor'),(v_membership,'club_admin')
    on conflict do nothing;
end $$;
