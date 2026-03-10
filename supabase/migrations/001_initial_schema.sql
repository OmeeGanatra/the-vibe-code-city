-- ════════════════════════════════════════════════════════════
-- VIBE CODE CITY — Full Database Schema
-- ════════════════════════════════════════════════════════════

-- ── SYSTEM 1: Users & GitHub Data Pipeline ─────────────────

create table users (
  id            uuid primary key default gen_random_uuid(),
  github_id     bigint unique not null,
  github_login  text unique not null,
  name          text,
  avatar_url    text,
  bio           text,
  email         text,
  followers     int default 0,
  following     int default 0,
  public_repos  int default 0,
  total_stars   int default 0,
  total_contributions int default 0,
  primary_language text,
  github_created_at timestamptz,
  claimed       boolean default false,
  claimed_at    timestamptz,
  stripe_customer_id text,
  referral_code text unique,
  referred_by   uuid references users(id),
  last_synced_at timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_users_github_login on users(github_login);
create index idx_users_github_id on users(github_id);
create index idx_users_referral_code on users(referral_code);

create table repositories (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  github_repo_id bigint unique not null,
  name          text not null,
  full_name     text not null,
  description   text,
  language      text,
  stars         int default 0,
  forks         int default 0,
  is_fork       boolean default false,
  url           text not null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_repositories_user_id on repositories(user_id);

create table contributions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  year          int not null,
  week          int not null,
  count         int default 0,
  created_at    timestamptz default now(),
  unique(user_id, year, week)
);

create index idx_contributions_user_id on contributions(user_id);

create table stars (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  repo_id       uuid not null references repositories(id) on delete cascade,
  starred_at    timestamptz default now(),
  unique(user_id, repo_id)
);

-- ── SYSTEM 4: Achievement System ───────────────────────────

create table achievements (
  id            text primary key,
  name          text not null,
  description   text not null,
  icon          text not null,
  category      text not null default 'milestone',
  threshold     int default 0,
  rarity        text not null default 'common'
    check (rarity in ('common', 'rare', 'epic', 'legendary')),
  created_at    timestamptz default now()
);

create table user_achievements (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  achievement_id text not null references achievements(id),
  earned_at     timestamptz default now(),
  unique(user_id, achievement_id)
);

create index idx_user_achievements_user_id on user_achievements(user_id);

-- Seed achievement definitions
insert into achievements (id, name, description, icon, category, threshold, rarity) values
  ('first_commit',     'First Brick',         'Made your first contribution',         '🧱', 'commits',  1,    'common'),
  ('100_commits',      'Builder',             'Reached 100 contributions',            '🏗️', 'commits',  100,  'common'),
  ('500_commits',      'Architect',           'Reached 500 contributions',            '🏛️', 'commits',  500,  'rare'),
  ('1000_commits',     'City Planner',        'Reached 1,000 contributions',          '🌆', 'commits',  1000, 'epic'),
  ('5000_commits',     'Metropolis',          'Reached 5,000 contributions',          '🏙️', 'commits',  5000, 'legendary'),
  ('1_repository',     'Foundation',          'Created your first repository',        '📐', 'repos',    1,    'common'),
  ('10_repositories',  'Block Party',         'Created 10 repositories',              '🏘️', 'repos',    10,   'common'),
  ('50_repositories',  'District',            'Created 50 repositories',              '🏢', 'repos',    50,   'rare'),
  ('100_repositories', 'Skyline',             'Created 100 repositories',             '🌇', 'repos',    100,  'epic'),
  ('1_star',           'First Light',         'Received your first star',             '⭐', 'stars',    1,    'common'),
  ('10_stars',         'Stargazer',           'Received 10 stars',                    '🌟', 'stars',    10,   'common'),
  ('100_stars',        'Constellation',       'Received 100 stars',                   '✨', 'stars',    100,  'rare'),
  ('1000_stars',       'Supernova',           'Received 1,000 stars',                 '💫', 'stars',    1000, 'epic'),
  ('10000_stars',      'Galaxy',              'Received 10,000 stars',                '🌌', 'stars',    10000,'legendary'),
  ('claimed_building', 'Homeowner',           'Claimed your building',                '🔑', 'social',   0,    'common'),
  ('first_kudos_sent', 'Friendly Neighbor',   'Sent your first kudos',                '👋', 'social',   0,    'common'),
  ('10_kudos_received','Popular',             'Received 10 kudos',                    '🏆', 'social',   10,   'rare'),
  ('first_purchase',   'Shopper',             'Made your first shop purchase',        '🛒', 'shop',     0,    'common'),
  ('first_referral',   'Recruiter',           'Referred your first friend',           '📨', 'social',   0,    'rare'),
  ('customized_building','Interior Designer', 'Customized your building',             '🎨', 'customize',0,    'common');

-- ── SYSTEM 5: Social Layer ─────────────────────────────────

create table kudos (
  id            uuid primary key default gen_random_uuid(),
  from_user_id  uuid not null references users(id) on delete cascade,
  to_user_id    uuid not null references users(id) on delete cascade,
  message       text,
  created_at    timestamptz default now(),
  check (from_user_id != to_user_id)
);

create index idx_kudos_to_user on kudos(to_user_id);
create index idx_kudos_from_user on kudos(from_user_id);

create table activity_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  event_type    text not null,
  payload       jsonb default '{}',
  created_at    timestamptz default now()
);

create index idx_activity_events_user_id on activity_events(user_id);
create index idx_activity_events_created on activity_events(created_at desc);

create table referrals (
  id            uuid primary key default gen_random_uuid(),
  referrer_id   uuid not null references users(id) on delete cascade,
  referred_id   uuid not null references users(id) on delete cascade,
  created_at    timestamptz default now(),
  unique(referrer_id, referred_id)
);

-- ── SYSTEM 7: Building Customization ───────────────────────

create table items (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  description   text,
  item_type     text not null
    check (item_type in ('crown', 'aura', 'roof', 'face', 'neon_trim', 'banner')),
  rarity        text not null default 'common'
    check (rarity in ('common', 'rare', 'epic', 'legendary')),
  price_cents   int not null default 0,
  preview_data  jsonb default '{}',
  active        boolean default true,
  created_at    timestamptz default now()
);

create table inventories (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  item_id       uuid not null references items(id),
  acquired_at   timestamptz default now(),
  acquired_via  text not null default 'purchase'
    check (acquired_via in ('purchase', 'achievement', 'referral', 'gift')),
  unique(user_id, item_id)
);

create index idx_inventories_user_id on inventories(user_id);

create table equipped_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  item_id       uuid not null references items(id),
  slot          text not null
    check (slot in ('crown', 'aura', 'roof', 'face', 'neon_trim', 'banner')),
  equipped_at   timestamptz default now(),
  unique(user_id, slot)
);

create index idx_equipped_items_user_id on equipped_items(user_id);

-- Seed cosmetic items
insert into items (slug, name, description, item_type, rarity, price_cents) values
  ('crown-gold',       'Golden Crown',       'A majestic golden crown for your rooftop',   'crown',    'legendary', 999),
  ('crown-pixel',      'Pixel Crown',        '8-bit crown for the true vibe coder',        'crown',    'rare',      499),
  ('crown-flame',      'Flame Crown',        'A crown of eternal pixel fire',              'crown',    'epic',      799),
  ('aura-neon-pink',   'Neon Pink Aura',     'Surround your building in neon pink light',  'aura',     'rare',      399),
  ('aura-electric',    'Electric Aura',      'Lightning crackles around your building',    'aura',     'epic',      699),
  ('aura-rainbow',     'Rainbow Aura',       'Full spectrum radiance',                     'aura',     'legendary', 999),
  ('roof-garden',      'Rooftop Garden',     'Lush green garden on your roof',             'roof',     'common',    199),
  ('roof-helipad',     'Helipad',            'Executive landing pad',                      'roof',     'rare',      499),
  ('roof-pool',        'Rooftop Pool',       'Crystal blue pool with a diving board',      'roof',     'epic',      699),
  ('roof-antenna',     'Antenna Array',      'Broadcast your signal to the city',          'roof',     'common',    149),
  ('face-happy',       'Happy Face',         'A cheerful pixel face on your building',     'face',     'common',    99),
  ('face-cool',        'Cool Shades',        'Sunglasses-wearing building face',           'face',     'rare',      299),
  ('neon-coral',       'Coral Neon Trim',    'Claude-orange neon trim around edges',       'neon_trim','common',    199),
  ('neon-purple',      'Purple Neon Trim',   'Vibrant purple neon edge lighting',          'neon_trim','rare',      349),
  ('banner-hire-me',   'Hire Me Banner',     'LED banner reading HIRE ME',                 'banner',   'common',    99),
  ('banner-vibe',      'Vibe Coder Banner',  'LED banner reading VIBE CODER',              'banner',   'common',    99);

-- ── SYSTEM 8: Shop / Stripe Orders ────────────────────────

create table orders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  stripe_session_id text unique,
  stripe_payment_intent text,
  status          text not null default 'pending'
    check (status in ('pending', 'completed', 'failed', 'refunded')),
  total_cents     int not null,
  created_at      timestamptz default now(),
  completed_at    timestamptz
);

create table order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  item_id       uuid not null references items(id),
  price_cents   int not null
);

-- ── SYSTEM 10: Advertising Platform ───────────────────────

create table ad_campaigns (
  id              uuid primary key default gen_random_uuid(),
  advertiser_id   uuid not null references users(id) on delete cascade,
  name            text not null,
  headline        text not null,
  body            text,
  cta_text        text default 'Learn More',
  cta_url         text not null,
  image_url       text,
  target_category text,
  budget_cents    int not null default 0,
  spent_cents     int not null default 0,
  cpc_cents       int not null default 10,
  status          text not null default 'draft'
    check (status in ('draft', 'pending', 'active', 'paused', 'completed')),
  stripe_payment_intent text,
  starts_at       timestamptz,
  ends_at         timestamptz,
  created_at      timestamptz default now()
);

create table ad_clicks (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references ad_campaigns(id) on delete cascade,
  user_id       uuid references users(id),
  building_id   text,
  clicked_at    timestamptz default now()
);

create index idx_ad_clicks_campaign on ad_clicks(campaign_id);

create table ad_impressions (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references ad_campaigns(id) on delete cascade,
  user_id       uuid references users(id),
  building_id   text,
  viewed_at     timestamptz default now()
);

-- ── Caching table for GitHub API responses ─────────────────

create table github_cache (
  cache_key     text primary key,
  data          jsonb not null,
  etag          text,
  expires_at    timestamptz not null,
  created_at    timestamptz default now()
);

create index idx_github_cache_expires on github_cache(expires_at);

-- ── Row-Level Security ─────────────────────────────────────

alter table users enable row level security;
alter table repositories enable row level security;
alter table contributions enable row level security;
alter table kudos enable row level security;
alter table inventories enable row level security;
alter table equipped_items enable row level security;
alter table orders enable row level security;
alter table ad_campaigns enable row level security;

-- Public read for profiles
create policy "Public profiles readable" on users
  for select using (true);

create policy "Users can update own profile" on users
  for update using (auth.uid() = id);

create policy "Public repos readable" on repositories
  for select using (true);

create policy "Public contributions readable" on contributions
  for select using (true);

create policy "Anyone can read kudos" on kudos
  for select using (true);

create policy "Authenticated users can send kudos" on kudos
  for insert with check (auth.uid() = from_user_id);

create policy "Users can read own inventory" on inventories
  for select using (auth.uid() = user_id);

create policy "Users can read own equipped" on equipped_items
  for select using (auth.uid() = user_id);

create policy "Users can manage own equipped" on equipped_items
  for all using (auth.uid() = user_id);

create policy "Users can read own orders" on orders
  for select using (auth.uid() = user_id);

create policy "Users can manage own campaigns" on ad_campaigns
  for all using (auth.uid() = advertiser_id);

-- ── Updated-at trigger ─────────────────────────────────────

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on users
  for each row execute function update_updated_at();

create trigger repositories_updated_at
  before update on repositories
  for each row execute function update_updated_at();
