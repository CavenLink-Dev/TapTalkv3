-- TapTalk cloud sync tables.
-- Board/TapBoard data is intentionally not included in this migration.

create table if not exists public.app_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  legal_name text,
  nickname text,
  phone text,
  role text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calendar_plans (
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null,
  date_key date not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, plan_id)
);

create index if not exists calendar_plans_user_date_idx
  on public.calendar_plans(user_id, date_key);

create table if not exists public.first_then_sequences (
  user_id uuid not null references auth.users(id) on delete cascade,
  sequence_id text not null default 'default',
  items jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, sequence_id)
);

grant select, insert, update, delete on public.app_profiles to authenticated;
grant select, insert, update, delete on public.calendar_plans to authenticated;
grant select, insert, update, delete on public.first_then_sequences to authenticated;

grant select, insert, update, delete on public.app_profiles to service_role;
grant select, insert, update, delete on public.calendar_plans to service_role;
grant select, insert, update, delete on public.first_then_sequences to service_role;

alter table public.app_profiles enable row level security;
alter table public.calendar_plans enable row level security;
alter table public.first_then_sequences enable row level security;

create policy "users can read own profile"
  on public.app_profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "users can insert own profile"
  on public.app_profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "users can update own profile"
  on public.app_profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "users can delete own profile"
  on public.app_profiles
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "users can read own calendar plans"
  on public.calendar_plans
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "users can insert own calendar plans"
  on public.calendar_plans
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "users can update own calendar plans"
  on public.calendar_plans
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "users can delete own calendar plans"
  on public.calendar_plans
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "users can read own first then sequence"
  on public.first_then_sequences
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "users can insert own first then sequence"
  on public.first_then_sequences
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "users can update own first then sequence"
  on public.first_then_sequences
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "users can delete own first then sequence"
  on public.first_then_sequences
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
