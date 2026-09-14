-- Release 3.16.3 – Zeichenlimits für ausführliche Volleyball-Übungstexte

alter table public.vt_exercises
  drop constraint if exists vt_exercises_goal_length_check,
  drop constraint if exists vt_exercises_organization_length_check;

alter table public.vt_exercises
  add constraint vt_exercises_goal_length_check
    check (goal is null or char_length(goal) <= 1000),
  add constraint vt_exercises_organization_length_check
    check (organization is null or char_length(organization) <= 1000);
