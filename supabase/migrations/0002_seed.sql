-- Seed data matching src/lib/data/seed.json. Idempotent: re-running updates.
insert into invites (code, guest_names, tier, max_party_size, language_pref)
values
  ('ROSE42', array['Suzan', 'Omar'], 'full', 2, null),
  ('MOON17', array['Sara'], 'save_the_date', 1, 'ar')
on conflict (code) do update set
  guest_names = excluded.guest_names,
  tier = excluded.tier,
  max_party_size = excluded.max_party_size,
  language_pref = excluded.language_pref;

insert into settings (key, value) values (
  'wedding',
  '{
    "weddingDateIso": "2026-11-15T16:00:00+03:00",
    "venue": {
      "name": "The Rose Garden Hall",
      "address": "123 Garden Lane",
      "mapUrl": "https://maps.google.com/?q=rose+garden+hall"
    },
    "galleryMode": "couple"
  }'::jsonb
)
on conflict (key) do update set value = excluded.value;
