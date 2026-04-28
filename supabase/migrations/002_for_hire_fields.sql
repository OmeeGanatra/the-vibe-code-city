-- Add for-hire profile fields to users so vibe coders can mark themselves
-- available, set rate + availability + contact, and appear in /hire directory.

alter table users
  add column for_hire boolean default false,
  add column hire_headline text,
  add column hire_rate_usd_hourly int,
  add column hire_availability text,
  add column hire_contact_url text,
  add column hire_skills text[] default '{}',
  add column hire_bio text;

create index idx_users_for_hire on users(for_hire) where for_hire = true;
