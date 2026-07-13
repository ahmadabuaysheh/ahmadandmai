-- "A Love Letter" wedding site schema (from PLAN.md)
create type invite_tier as enum ('full', 'save_the_date');

create table invites (
  code text primary key,
  guest_names text[] not null default '{}',
  tier invite_tier not null default 'save_the_date',
  max_party_size int not null default 1,
  language_pref text check (language_pref in ('en', 'ar')),
  created_at timestamptz not null default now()
);

create table rsvps (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null references invites(code),
  guest_name text not null,
  attending boolean not null,
  meal text,
  song_request text,
  message text,
  created_at timestamptz not null default now()
);

create table guestbook (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null references invites(code),
  name text not null,
  note text not null,
  approved boolean not null default true,
  created_at timestamptz not null default now()
);

create table quiz_scores (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null references invites(code),
  name text not null,
  score int not null,
  created_at timestamptz not null default now()
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  uploader_name text,
  storage_path text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table settings (
  key text primary key,
  value jsonb not null
);

-- All access goes through the service-role key on the server; lock everything
-- down for anon/authenticated so nothing leaks if the anon key ever ships.
alter table invites enable row level security;
alter table rsvps enable row level security;
alter table guestbook enable row level security;
alter table quiz_scores enable row level security;
alter table photos enable row level security;
alter table settings enable row level security;

insert into settings (key, value) values
  ('wedding', '{"weddingDateIso": null, "venue": null, "galleryMode": "couple"}');
