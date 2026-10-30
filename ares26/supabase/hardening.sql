-- OPTIONAL server-side hardening for ARES'26. NOT applied automatically: review, then run once in
-- Supabase > SQL Editor. Safe to re-run. These are backend checks, so they hold even if someone
-- bypasses the website and calls the API directly. Existing security rules in schema.sql are unchanged.

-- 1. Stop people pointing their payment proof at anyone else's file path
alter table public.profiles drop constraint if exists proof_path_own_folder;
alter table public.profiles add constraint proof_path_own_folder
  check (proof_path is null or proof_path like id::text || '/%');

-- 2. Same for abstract attachments
alter table public.abstracts drop constraint if exists file_path_own_folder;
alter table public.abstracts add constraint file_path_own_folder
  check (file_path is null or file_path like user_id::text || '/%');

-- 3. Sensible size / sanity limits so the tables cannot be stuffed with junk
alter table public.profiles drop constraint if exists profile_field_limits;
alter table public.profiles add constraint profile_field_limits check (
  char_length(coalesce(first_name,'')) <= 100 and char_length(coalesce(last_name,'')) <= 100 and
  char_length(coalesce(phone,'')) <= 30 and char_length(coalesce(institution,'')) <= 200 and
  char_length(coalesce(programme,'')) <= 100 and char_length(coalesce(degree_year,'')) <= 50 and
  char_length(coalesce(account_name,'')) <= 200 and char_length(coalesce(tx_id,'')) <= 100 and
  (amount is null or (amount > 0 and amount < 10000000)));

alter table public.abstracts drop constraint if exists abstract_limits;
alter table public.abstracts add constraint abstract_limits check (
  char_length(title) between 1 and 300 and pg_column_size(body) <= 30000 and
  body ? 'Introduction' and body ? 'Methodology' and body ? 'Results' and body ? 'Conclusion');
