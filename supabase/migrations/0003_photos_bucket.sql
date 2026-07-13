-- Private bucket for gallery photos; all access via service-role key.
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;
