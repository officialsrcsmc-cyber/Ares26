-- Reopens sign-ups (undoes close_registration.sql).
drop trigger if exists block_new_signups on auth.users;
