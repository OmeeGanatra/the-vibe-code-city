# The Vibe Code City

3D pixel-art city where every building is a project built with Claude (or other AI tools). Built by vibe coders, for vibe coders.

**Live**: https://thevibecodecity-73598.web.app

## Tech stack

- **Frontend**: Next.js 16 (App Router, Turbopack), React 19, TypeScript 5
- **3D**: Three.js + `@react-three/fiber` + `@react-three/drei` + `@react-three/postprocessing` (Bloom)
- **Styling**: Tailwind 4 + Silkscreen pixel font
- **Backend**: Supabase (Postgres + Auth + RLS)
- **Hosting**: Firebase Hosting `frameworksBackend` (Cloud Functions SSR in `us-central1`)
- **Audio**: howler

## Project structure

```
app/                  Next.js pages and API routes
components/           React + Three.js components (all client-side)
lib/                  Core game logic, services, integrations
  supabase/           Browser, server, service-role clients + types
  services/           github, achievements, kudos, shop, ads, building-generator, share-card
data/projects.json    Seed data — 80+ projects (used client-side on the homepage)
supabase/migrations/  Sequential SQL migrations (001_, 002_, ...)
public/               Static assets
firebase.json         Hosting + frameworksBackend config
```

## Key files

| File | Purpose |
|------|---------|
| [app/page.tsx](app/page.tsx) | Main 3D city — entry point, hireMap, pilotCount, filter state |
| [components/CityCanvas.tsx](components/CityCanvas.tsx) | Three.js scene: lighting, fog, sky, post-FX, PartyKit |
| [components/BuildingMesh.tsx](components/BuildingMesh.tsx) | Per-building mesh + procedural windows + hover sway + pulse |
| [components/FlyingLights.tsx](components/FlyingLights.tsx) | 30 instanced glowing particles drifting upward (visual life) |
| [components/DroneControls.tsx](components/DroneControls.tsx) | First-person flight (WASD + pointer-lock) |
| [components/SignInButton.tsx](components/SignInButton.tsx) | GitHub OAuth sign-in/sign-out in HUD |
| [components/HireEditPanel.tsx](components/HireEditPanel.tsx) | Inline hire profile editor (owner-only, client component) |
| [components/ProjectPanel.tsx](components/ProjectPanel.tsx) | Building sidebar: project info, hire CTA, builder profile link |
| [components/HoverTooltip.tsx](components/HoverTooltip.tsx) | Name + upvotes + @login + FOR HIRE badge on hover |
| [lib/cityLayout.ts](lib/cityLayout.ts) | Spiral placement, height-from-upvotes, recency lighting |
| [lib/projects.ts](lib/projects.ts) | `Project` and `CityBuilding` types + category color map |
| [lib/services/github.ts](lib/services/github.ts) | GitHub API client + Supabase sync + 24h cache |
| [lib/services/building-generator.ts](lib/services/building-generator.ts) | Procedural building params from user GitHub stats |
| [lib/supabase/server.ts](lib/supabase/server.ts) | `createServerSupabase` (cookie-based) and `createServiceSupabase` (service role) |
| [supabase/migrations/001_initial_schema.sql](supabase/migrations/001_initial_schema.sql) | Base schema: users, repos, achievements, kudos, shop, ads |
| [supabase/migrations/002_for_hire_fields.sql](supabase/migrations/002_for_hire_fields.sql) | Hire columns on users: for_hire, headline, rate, skills, etc. |
| [supabase/migrations/003_jobs_board.sql](supabase/migrations/003_jobs_board.sql) | Jobs table with RLS |
| [party/fly.ts](party/fly.ts) | PartyKit server — real-time pilot positions |
| [lib/multiplayer.ts](lib/multiplayer.ts) | `usePartyFly` hook — connects PartyKit WebSocket |

## Code conventions

- **TypeScript everywhere, no `any`.** Use `unknown` + narrowing if a type is genuinely loose.
- **Server-side DB writes**: use `createServiceSupabase()` — bypasses RLS.
- **Server-side reads in cookie-aware contexts**: use `createServerSupabase()`.
- **Browser**: use `lib/supabase/client.ts` `createClient()`.
- **Lazy service initialization**: third-party SDKs (e.g. `lib/stripe.ts getStripe()`) are lazy-instantiated so missing env vars don't break the build, only the path that needs them.
- **Procedural rendering is seeded by ID**: `lib/utils.ts` `hashStr()` + `seededRandom()`. Same input → same output, every reload.
- **Three.js components**: client-only. Always wrap in `dynamic(() => import(...), { ssr: false })`.
- **Don't add comments that restate what the code already says.** Only comment hidden constraints, gotchas, or non-obvious *why*.

## Database

- Migrations in `supabase/migrations/`, numbered sequentially (`001_`, `002_`, …).
- **Never modify existing migrations.** Create a new one.
- **Never run UPDATE/DELETE on production data without explicit user approval.**
- **Never NULL out, drop, or modify columns containing user data.**
- For schema changes, always propose SQL as code for review before executing.
- RLS is on for all user-data tables. Backend writes go through the service-role client, which bypasses RLS by design.
- The Supabase MCP is connected — use it for `apply_migration`, `execute_sql` (read), `list_tables`. Don't shell out to `supabase` CLI.

## Environment

`.env.local` (gitignored) at the repo root contains:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — required
- `NEXT_PUBLIC_URL` — used for OAuth + Stripe return URLs
- `CRON_SECRET` — auth for `/api/sync`
- `STRIPE_*` — **empty in production** (see "Payments" below)
- `GITHUB_TOKEN` — optional, for higher GitHub API rate limits
- `DISCORD_WEBHOOK_URL` — optional, for `/submit` notifications

[.env.example](/Users/omeeganatra/the-vibe-code-city/.env.example) (in the parent directory, not the worktree) lists the full set.

## Deploy

```sh
firebase deploy --only hosting
```

- Project: `thevibecodecity-73598`
- Region: `us-central1` (set in `firebase.json` → `frameworksBackend`)
- Requires `firebase experiments:enable webframeworks` (already enabled locally; new contributors must enable themselves).
- `.env.local` is auto-copied into the SSR Cloud Function during deploy.

## Payments

**Disabled in production.** The user is in India where Stripe is unavailable. UI flows for shop checkout and ad funding are removed (commit [b2867ed](https://github.com/OmeeGanatra/the-vibe-code-city/commit/b2867ed)). The backend code (`lib/stripe.ts`, `lib/services/shop.ts createCheckoutSession`, `lib/services/ads.ts fundCampaign`, `/api/webhooks/stripe`) is dormant but intact.

If reviving payments, prefer **Razorpay** (UPI / India-friendly) or **NOWPayments** (crypto, no jurisdiction issue) over Stripe.

## Git

- Default branch: `main`
- Conventional-style commit messages: `feat:`, `fix:`, `docs:`, `refactor:` (current commits don't all follow this — gradually adopt).
- Never force-push to `main`.
- Never skip git hooks (`--no-verify`).
- The user works in a worktree under `.claude/worktrees/<name>/`. The main checkout lives at `/Users/omeeganatra/the-vibe-code-city/`.

## What's wired vs not

**Working in production**:
- 3D city homepage with 80+ buildings, FOR HIRE city filter, flying lights, window pulse, hover sway
- Drone first-person mode with real-time multiplayer via PartyKit (`vibe-code-city.omeeganatra.partykit.dev`)
- Project submission via Discord webhook (no-ops if `DISCORD_WEBHOOK_URL` unset)
- GitHub user sync (lazy, 24h cache) via `/api/user`
- All Supabase-backed APIs (`/api/shop`, `/api/achievements`, `/api/kudos`, `/api/building`, `/api/share`, `/api/dailies`)
- **Jobs board**: `/jobs` (browse) + `/jobs/post` + `GET|POST /api/jobs`
- **For-hire directory**: `/hire` + `GET /api/hire` (list) + `PATCH /api/hire` (authenticated edit)
- **GitHub OAuth scaffolded**: `SignInButton` + `/api/auth/callback` (claims profile, redirects to `/user/<login>`)
- **Hire profile editing**: `HireEditPanel` on `/user/[username]` — owner-only, saves via `PATCH /api/hire`
- **Share cards**: `GET /api/share-card?username=...` — edge runtime, `next/og`, OG metadata wired on profile pages
- User profile page `/user/[username]` — stats, achievements, kudos, vibe projects, claim banner, compare form
- Compare page `/compare/[u1]/[u2]`
- `sitemap.xml` and `robots.txt` generated statically

**Needs manual setup to activate**:
- **GitHub OAuth**: user must create a GitHub OAuth app → enable GitHub provider in Supabase Auth dashboard
- `/api/sync` cron job (no scheduler — users sync lazily on profile visit)
- Discord webhook URL (optional, for `/submit` notifications)

**Dormant / not wired**:
- Payment provider (see "Payments" above)
- Shop checkout and ad funding (UI removed, backend code intact)

## Things to do, ranked by impact

1. **Instanced building rendering** — Three.js `InstancedMesh` to scale past ~1k buildings (risky: unique window textures must be baked into texture atlas)
2. **Razorpay / NOWPayments** — revive shop checkout with India-compatible provider
3. **Kudos send button** on profile pages — requires resolving `users.id` from GitHub login after sign-in
4. **`/api/sync` cron** — set up a Cloud Scheduler job hitting `/api/sync?secret=<CRON_SECRET>` daily
5. **Activity feed page** — `/api/kudos?feed=true` already returns a feed, just needs a UI
