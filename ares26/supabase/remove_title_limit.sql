-- Removes the 300-character cap on abstract titles (title must still be non-empty).
alter table public.abstracts drop constraint if exists abstract_limits;
alter table public.abstracts add constraint abstract_limits check (
  char_length(title) >= 1 and pg_column_size(body) <= 30000 and
  body ? 'Introduction' and body ? 'Methodology' and body ? 'Results' and body ? 'Conclusion');
