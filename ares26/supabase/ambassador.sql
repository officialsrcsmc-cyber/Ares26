-- Ambassador codes are hard-coded in the website (src/shared.js).
-- The database only needs a place to store the code a participant types in. Run once (safe to re-run).
alter table public.profiles add column if not exists ambassador_code text;
alter table public.profiles drop constraint if exists ambassador_code_len;
alter table public.profiles add constraint ambassador_code_len check (char_length(coalesce(ambassador_code,'')) <= 50);
