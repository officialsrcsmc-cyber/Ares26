-- Closes new abstract submissions at the database level. Run once in the Supabase SQL Editor.
-- Existing abstracts, reviews and fee payments are unaffected.
drop policy if exists "abstracts insert approved own" on public.abstracts;
drop policy if exists "abstracts insert own" on public.abstracts;
-- With no INSERT policy, row-level security rejects every new abstract from the website.
