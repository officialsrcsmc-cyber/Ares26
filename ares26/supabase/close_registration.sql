-- Closes new sign-ups at the database level, so nobody can bypass the website.
-- Run once in the Supabase SQL Editor. Existing accounts keep working.
create or replace function public.block_new_signups() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  raise exception 'Registration for ARES''26 is closed.';
end $$;

drop trigger if exists block_new_signups on auth.users;
create trigger block_new_signups before insert on auth.users
for each row execute function public.block_new_signups();
