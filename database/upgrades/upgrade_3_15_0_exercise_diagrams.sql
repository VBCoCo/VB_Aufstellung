-- Release 3.15.0 / V1.2a – persistenter grafischer Volleyball-Übungseditor
-- Produktiv über die Supabase-Migration exercise_diagrams_v1_2a anwenden.

create table if not exists public.vt_exercise_diagrams (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null unique references public.vt_exercises(id) on delete cascade,
  schema_version integer not null default 1 check (schema_version >= 1),
  revision integer not null default 1 check (revision >= 1),
  document jsonb not null default '{"schemaVersion":1,"court":{"type":"full"},"steps":[]}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vt_exercise_diagrams_document_object check (jsonb_typeof(document) = 'object')
);

create index if not exists vt_exercise_diagrams_exercise_idx
  on public.vt_exercise_diagrams(exercise_id);

alter table public.vt_exercise_diagrams enable row level security;
grant select, insert, update, delete on public.vt_exercise_diagrams to authenticated;

drop policy if exists vt_exercise_diagrams_select on public.vt_exercise_diagrams;
create policy vt_exercise_diagrams_select on public.vt_exercise_diagrams
for select to authenticated
using (
  exists (
    select 1 from public.vt_exercises exercise
    where exercise.id = exercise_id
      and (
        exercise.club_id is null
        or exists (
          select 1 from public.vt_club_memberships membership
          where membership.user_id = (select auth.uid())
            and membership.club_id = exercise.club_id
            and membership.active
        )
      )
  )
);

drop policy if exists vt_exercise_diagrams_insert on public.vt_exercise_diagrams;
create policy vt_exercise_diagrams_insert on public.vt_exercise_diagrams
for insert to authenticated
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1 from public.vt_exercises exercise
    where exercise.id = exercise_id
      and exercise.club_id is not null
      and (
        exercise.owner_id = (select auth.uid())
        or exists (
          select 1
          from public.vt_club_memberships membership
          join public.vt_club_member_roles role on role.membership_id = membership.id
          where membership.user_id = (select auth.uid())
            and membership.club_id = exercise.club_id
            and membership.active
            and role.role = 'club_admin'
        )
      )
  )
);

drop policy if exists vt_exercise_diagrams_update on public.vt_exercise_diagrams;
create policy vt_exercise_diagrams_update on public.vt_exercise_diagrams
for update to authenticated
using (
  exists (
    select 1 from public.vt_exercises exercise
    where exercise.id = exercise_id
      and exercise.club_id is not null
      and (
        exercise.owner_id = (select auth.uid())
        or exists (
          select 1
          from public.vt_club_memberships membership
          join public.vt_club_member_roles role on role.membership_id = membership.id
          where membership.user_id = (select auth.uid())
            and membership.club_id = exercise.club_id
            and membership.active
            and role.role = 'club_admin'
        )
      )
  )
)
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1 from public.vt_exercises exercise
    where exercise.id = exercise_id
      and exercise.club_id is not null
      and (
        exercise.owner_id = (select auth.uid())
        or exists (
          select 1
          from public.vt_club_memberships membership
          join public.vt_club_member_roles role on role.membership_id = membership.id
          where membership.user_id = (select auth.uid())
            and membership.club_id = exercise.club_id
            and membership.active
            and role.role = 'club_admin'
        )
      )
  )
);

drop policy if exists vt_exercise_diagrams_delete on public.vt_exercise_diagrams;
create policy vt_exercise_diagrams_delete on public.vt_exercise_diagrams
for delete to authenticated
using (
  exists (
    select 1 from public.vt_exercises exercise
    where exercise.id = exercise_id
      and exercise.club_id is not null
      and (
        exercise.owner_id = (select auth.uid())
        or exists (
          select 1
          from public.vt_club_memberships membership
          join public.vt_club_member_roles role on role.membership_id = membership.id
          where membership.user_id = (select auth.uid())
            and membership.club_id = exercise.club_id
            and membership.active
            and role.role = 'club_admin'
        )
      )
  )
);
