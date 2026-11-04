-- WORKSHOP ENROLMENTS for ARES'26. Run once in Supabase > SQL Editor (safe to re-run).
-- Rules enforced here in the database (not just on the website):
--   * only a signed-in person whose registration is APPROVED can request a workshop seat
--   * a request starts as Pending and only an admin can approve or reject it
--   * one request per person per workshop
--   * when the workshop has a fee, the request carries the same payment proof as the
--     main registration: transaction date/time, account name, transaction ID and an
--     uploaded proof file (stored in the existing "payment-proofs" bucket)

create table if not exists public.workshop_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workshop_id text not null check (char_length(workshop_id) between 1 and 60),
  workshop_title text not null default '' check (char_length(workshop_title) <= 200),
  status text not null default 'Pending' check (status in ('Pending','Approved','Rejected')),
  tx_date timestamptz, account_name text, amount numeric, tx_id text, proof_path text,
  created_at timestamptz not null default now(),
  unique (user_id, workshop_id)
);

-- Added by a later migration for sites created before payment proof was tracked here.
alter table public.workshop_enrollments add column if not exists tx_date timestamptz;
alter table public.workshop_enrollments add column if not exists account_name text;
alter table public.workshop_enrollments add column if not exists amount numeric;
alter table public.workshop_enrollments add column if not exists tx_id text;
alter table public.workshop_enrollments add column if not exists proof_path text;

-- Keep a workshop proof in the same per-user folder used for registration proofs
alter table public.workshop_enrollments drop constraint if exists wk_proof_path_own_folder;
alter table public.workshop_enrollments add constraint wk_proof_path_own_folder
  check (proof_path is null or proof_path like user_id::text || '/%');

-- true only when the signed-in person has a profile (signed up) AND an Approved registration
create or replace function public.is_approved() returns boolean
language sql security definer set search_path = public stable as $$
  select coalesce((select status = 'Approved' from public.profiles where id = auth.uid()), false)
$$;

-- Participants can never change their own status, workshop, or who the request belongs to.
-- A rejected request whose proof is updated (re-upload after rejection) goes back to Pending.
create or replace function public.protect_workshop_enrollment() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.id := old.id; new.user_id := old.user_id; new.workshop_id := old.workshop_id;
    new.workshop_title := old.workshop_title; new.created_at := old.created_at;
    new.status := old.status;
    if old.status = 'Rejected' and new.proof_path is distinct from old.proof_path then new.status := 'Pending'; end if;
  end if;
  return new;
end $$;
drop trigger if exists protect_workshop_enrollment_trg on public.workshop_enrollments;
create trigger protect_workshop_enrollment_trg before update on public.workshop_enrollments
  for each row execute function public.protect_workshop_enrollment();

alter table public.workshop_enrollments enable row level security;

drop policy if exists "wk read own or admin" on public.workshop_enrollments;
create policy "wk read own or admin" on public.workshop_enrollments for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "wk insert approved own" on public.workshop_enrollments;
create policy "wk insert approved own" on public.workshop_enrollments for insert to authenticated
  with check (user_id = auth.uid() and status = 'Pending' and public.is_approved());

-- a person may resubmit payment details on their own Pending or Rejected request
-- (protect_workshop_enrollment_trg above still blocks them from touching status directly)
drop policy if exists "wk update own pending or rejected" on public.workshop_enrollments;
create policy "wk update own pending or rejected" on public.workshop_enrollments for update to authenticated
  using (user_id = auth.uid() and status in ('Pending','Rejected')) with check (user_id = auth.uid());

drop policy if exists "wk update admin" on public.workshop_enrollments;
create policy "wk update admin" on public.workshop_enrollments for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- a person may cancel their own request while it is still Pending; admins may delete any
drop policy if exists "wk delete own pending or admin" on public.workshop_enrollments;
create policy "wk delete own pending or admin" on public.workshop_enrollments for delete to authenticated
  using ((user_id = auth.uid() and status = 'Pending') or public.is_admin());
