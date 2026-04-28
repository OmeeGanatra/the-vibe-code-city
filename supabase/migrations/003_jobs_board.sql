-- Job board: companies post job openings; vibe coders apply via the listed contact URL.

create table jobs (
  id              uuid primary key default gen_random_uuid(),
  company_name    text not null,
  poster_email    text not null,
  title           text not null,
  description     text not null,
  contact_url     text not null,
  budget_min_usd  int,
  budget_max_usd  int,
  budget_type     text not null default 'project'
    check (budget_type in ('project', 'hourly', 'salary')),
  remote          boolean default true,
  location        text,
  skills          text[] default '{}',
  status          text not null default 'active'
    check (status in ('active', 'filled', 'closed')),
  created_at      timestamptz default now(),
  expires_at      timestamptz default (now() + interval '30 days')
);

create index idx_jobs_status_created on jobs(status, created_at desc);
create index idx_jobs_active on jobs(created_at desc) where status = 'active';

alter table jobs enable row level security;

create policy "Public read of active jobs" on jobs
  for select using (status = 'active');

create policy "Anyone can post a job" on jobs
  for insert with check (true);
