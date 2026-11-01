-- Stores the UHS Registration No. / SMC ID that SMC students enter at sign-up. Run once (safe to re-run).
alter table public.profiles add column if not exists uhs_id text;
alter table public.profiles drop constraint if exists uhs_id_len;
alter table public.profiles add constraint uhs_id_len check (char_length(coalesce(uhs_id,'')) <= 50);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, first_name, last_name, smc, uhs_id, phone, institution, programme, degree_year, agreed_at)
  values (new.id, new.email,
    new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name',
    coalesce((new.raw_user_meta_data->>'smc')::boolean, true),
    nullif(btrim(new.raw_user_meta_data->>'uhs_id'),''),
    new.raw_user_meta_data->>'phone', new.raw_user_meta_data->>'institution',
    new.raw_user_meta_data->>'programme', new.raw_user_meta_data->>'degree_year',
    nullif(new.raw_user_meta_data->>'agreed_at','')::timestamptz);
  return new;
end $$;
