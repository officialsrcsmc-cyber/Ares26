-- ARES'26: remembers when the payment-link email was sent for each accepted abstract.
-- Run once in Supabase > SQL Editor, AFTER abstract_fee.sql. Safe to re-run.

alter table public.abstracts add column if not exists fee_email_sent_at timestamptz;

-- Same protection as before, plus: only admins (or the send-fee-emails function acting as an admin) may change fee_email_sent_at
create or replace function public.protect_abstract() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.id := old.id; new.user_id := old.user_id; new.title := old.title; new.discipline := old.discipline;
    new.category := old.category; new.body := old.body; new.file_path := old.file_path;
    new.status := old.status; new.created_at := old.created_at; new.ref_no := old.ref_no;
    new.fee_link_at := old.fee_link_at;
    new.fee_email_sent_at := old.fee_email_sent_at;
    if new.fee_proof_path is distinct from old.fee_proof_path then new.fee_status := 'Pending';
    else new.fee_status := old.fee_status; end if;
  end if;
  return new;
end $$;
drop trigger if exists protect_abstract_trg on public.abstracts;
create trigger protect_abstract_trg before update on public.abstracts for each row execute function public.protect_abstract();
