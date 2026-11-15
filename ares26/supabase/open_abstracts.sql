-- Reopens abstract submissions (undoes close_abstracts.sql). Same rule as abstracts_approved.sql.
drop policy if exists "abstracts insert approved own" on public.abstracts;
create policy "abstracts insert approved own" on public.abstracts for insert to authenticated
  with check (user_id = auth.uid() and status = 'Submitted' and public.is_approved());
