-- ARES'26: remembers when a "please pay your conference registration" reminder was emailed to each person.
-- Run once in Supabase > SQL Editor. Safe to re-run.
alter table public.profiles add column if not exists dues_email_sent_at timestamptz;
alter table public.profiles add column if not exists dues_email_count integer not null default 0;

-- Same protection as before; participants can never edit the reminder fields
create or replace function public.protect_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.id := old.id; new.email := old.email; new.is_admin := old.is_admin; new.agreed_at := old.agreed_at; new.created_at := old.created_at;
    new.status := old.status;
    new.dues_email_sent_at := old.dues_email_sent_at; new.dues_email_count := old.dues_email_count;
    if old.status = 'Rejected' and new.proof_path is distinct from old.proof_path then new.status := 'Pending'; end if;
  end if;
  return new;
end $$;
drop trigger if exists protect_profile_trg on public.profiles;
create trigger protect_profile_trg before update on public.profiles for each row execute function public.protect_profile();
