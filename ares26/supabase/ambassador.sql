-- Ambassador codes for ARES'26. Run once in Supabase > SQL Editor (safe to re-run).

-- 1. Store the code a participant enters with their payment
alter table public.profiles add column if not exists ambassador_code text;
alter table public.profiles drop constraint if exists ambassador_code_len;
alter table public.profiles add constraint ambassador_code_len check (char_length(coalesce(ambassador_code,'')) <= 50);

-- 2. Codes managed by admins (participants can NOT read this table)
create table if not exists public.ambassador_codes (
  code text primary key,
  ambassador text,
  created_at timestamptz not null default now(),
  constraint code_upper check (code = upper(btrim(code)) and char_length(code) between 1 and 50)
);
alter table public.ambassador_codes enable row level security;
drop policy if exists "ambcodes admin all" on public.ambassador_codes;
create policy "ambcodes admin all" on public.ambassador_codes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 3. Lets a signed-in participant check a code without being able to list them
create or replace function public.check_ambassador_code(c text) returns boolean
language sql security definer set search_path = public stable as $$
  select auth.uid() is not null and exists (select 1 from public.ambassador_codes where code = upper(btrim(c)))
$$;
revoke all on function public.check_ambassador_code(text) from public, anon;
grant execute on function public.check_ambassador_code(text) to authenticated;
