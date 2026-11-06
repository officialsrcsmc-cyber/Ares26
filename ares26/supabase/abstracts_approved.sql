-- ARES'26: only people with an Approved (verified, fee-paid) registration may submit an abstract.
-- Run once in Supabase > SQL Editor. Safe to re-run. Needs public.is_approved() (defined in schema.sql / workshops.sql).

create or replace function public.is_approved() returns boolean
language sql security definer set search_path = public stable as $$
  select coalesce((select status = 'Approved' from public.profiles where id = auth.uid()), false)
$$;

drop policy if exists "abstracts insert own" on public.abstracts;
drop policy if exists "abstracts insert approved own" on public.abstracts;
create policy "abstracts insert approved own" on public.abstracts for insert to authenticated
  with check (user_id = auth.uid() and status = 'Submitted' and public.is_approved());
