-- ARES'26 database schema. Run this whole file once in Supabase: SQL Editor > New query > paste > Run.

-- ============ TABLES ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text, last_name text,
  smc boolean not null default true,
  phone text, institution text, programme text, degree_year text,
  agreed_at timestamptz,
  tx_date timestamptz, account_name text, amount numeric, tx_id text, proof_path text,
  status text not null default 'Pending' check (status in ('Pending','Approved','Rejected')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.abstracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, discipline text not null, category text not null,
  body jsonb not null, file_path text,
  status text not null default 'Submitted' check (status in ('Submitted','Under Review','Accepted','Rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.site_content (
  id int primary key default 1 check (id = 1),
  data jsonb not null
);

-- ============ HELPERS ============
create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- Create a profile row automatically when someone signs up (data comes from the signup form)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, first_name, last_name, smc, phone, institution, programme, degree_year, agreed_at)
  values (new.id, new.email,
    new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name',
    coalesce((new.raw_user_meta_data->>'smc')::boolean, true),
    new.raw_user_meta_data->>'phone', new.raw_user_meta_data->>'institution',
    new.raw_user_meta_data->>'programme', new.raw_user_meta_data->>'degree_year',
    nullif(new.raw_user_meta_data->>'agreed_at','')::timestamptz);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Participants can never change their own status, admin flag or email
create or replace function public.protect_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.id := old.id; new.email := old.email; new.is_admin := old.is_admin; new.agreed_at := old.agreed_at; new.created_at := old.created_at;
    new.status := old.status;
    -- a rejected participant who uploads a new proof goes back to Pending
    if old.status = 'Rejected' and new.proof_path is distinct from old.proof_path then new.status := 'Pending'; end if;
  end if;
  return new;
end $$;
drop trigger if exists protect_profile_trg on public.profiles;
create trigger protect_profile_trg before update on public.profiles for each row execute function public.protect_profile();

-- ============ ROW LEVEL SECURITY ============
alter table public.profiles enable row level security;
alter table public.abstracts enable row level security;
alter table public.site_content enable row level security;

drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid() and status in ('Pending','Rejected')) with check (id = auth.uid());
drop policy if exists "profiles update admin" on public.profiles;
create policy "profiles update admin" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "abstracts read own or admin" on public.abstracts;
create policy "abstracts read own or admin" on public.abstracts for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "abstracts insert own" on public.abstracts;
create policy "abstracts insert own" on public.abstracts for insert to authenticated with check (user_id = auth.uid() and status = 'Submitted');
drop policy if exists "abstracts update admin" on public.abstracts;
create policy "abstracts update admin" on public.abstracts for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "content read all" on public.site_content;
create policy "content read all" on public.site_content for select to anon, authenticated using (true);
drop policy if exists "content insert admin" on public.site_content;
create policy "content insert admin" on public.site_content for insert to authenticated with check (public.is_admin());
drop policy if exists "content update admin" on public.site_content;
create policy "content update admin" on public.site_content for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============ FILE STORAGE (private buckets, 5 MB limit) ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
 ('payment-proofs','payment-proofs',false,5242880,array['image/jpeg','image/png','image/webp','image/heic','application/pdf']),
 ('abstract-files','abstract-files',false,5242880,array['image/jpeg','image/png','image/webp','image/heic','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

drop policy if exists "upload to own folder" on storage.objects;
create policy "upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id in ('payment-proofs','abstract-files') and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "read own files or admin" on storage.objects;
create policy "read own files or admin" on storage.objects for select to authenticated
  using (bucket_id in ('payment-proofs','abstract-files') and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ============ STARTING CONTENT ============
insert into public.site_content (id, data) values (1, '{"dates": [["Nov 10", "Registration opens", "2026-11-10"], ["Nov 14", "Early bird deadline", "2026-11-14"], ["Nov 16", "Abstract submission closes (TBC)", "2026-11-16"], ["Nov 20", "Workshops (TBC)", "2026-11-20"], ["Nov 21", "ARES’26 main event", "2026-11-21"]], "team": [["Team Member 1", "Role / Title"], ["Team Member 2", "Role / Title"], ["Team Member 3", "Role / Title"], ["Team Member 4", "Role / Title"], ["Team Member 5", "Role / Title"], ["Team Member 6", "Role / Title"], ["Team Member 7", "Role / Title"], ["Team Member 8", "Role / Title"], ["Team Member 9", "Role / Title"], ["Team Member 10", "Role / Title"]], "faqs": [["Who can attend?", "Medical and allied health students, faculty and researchers. SMC students and external participants may register."], ["Is it in person?", "Yes. ARES’26 takes place on campus at Sargodha Medical College."], ["How do I pay?", "Pay by bank transfer, then upload your proof from your dashboard after confirming your email. Your status shows as Pending until the team verifies it."], ["What can I submit?", "Original research, case reports and reviews, as an oral or poster abstract. Use the structured format on the Abstracts page."], ["Will there be workshops?", "Yes. Details and enrolment will be posted on the Workshop page."]]}'::jsonb) on conflict (id) do nothing;

-- ============ AFTER YOU REGISTER YOUR OWN ACCOUNT, MAKE IT AN ADMIN ============
-- update public.profiles set is_admin = true where email = 'you@example.com';
