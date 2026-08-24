-- Volleyball Trainer 3.0.4 - Einladungsvorlagen
-- Vorher normalen Datenbank-Backup-Stand beibehalten.

begin;

create table if not exists public.vt_invite_templates (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null check (scope_type in ('club','platform')),
  club_id uuid references public.vt_clubs(id) on delete cascade,
  club_key uuid generated always as (coalesce(club_id, '00000000-0000-0000-0000-000000000000'::uuid)) stored,
  template_key text not null check (template_key in ('club_member','club_admin','platform_admin')),
  subject_template text not null,
  body_template text not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint vt_invite_templates_scope_check check (
    (scope_type='club' and club_id is not null and template_key='club_member')
    or (scope_type='platform' and club_id is null and template_key in ('club_admin','platform_admin'))
  ),
  unique(scope_type,club_key,template_key)
);

alter table public.vt_invite_templates enable row level security;
revoke all on public.vt_invite_templates from anon, authenticated;

commit;

select table_name from information_schema.tables where table_schema='public' and table_name='vt_invite_templates';
