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
| [app/page.tsx](app/page.tsx) | Main 3D city — entry point |
| [components/CityCanvas.tsx](components/CityCanvas.tsx) | Three.js scene: lighting, fog, sky, post-FX |
| [components/BuildingMesh.tsx](components/BuildingMesh.tsx) | Per-building mesh + procedural windows |
| [components/DroneControls.tsx](components/DroneControls.tsx) | First-person flight (WASD + pointer-lock) |
| [lib/cityLayout.ts](lib/cityLayout.ts) | Spiral placement, height-from-upvotes, recency lighting |
| [lib/projects.ts](lib/projects.ts) | `Project` and `CityBuilding` types + category color map |
| [lib/services/github.ts](lib/services/github.ts) | GitHub API client + Supabase sync + 24h cache |
| [lib/services/achievements.ts](lib/services/achievements.ts) | Achievement evaluation logic |
| [lib/services/building-generator.ts](lib/services/building-generator.ts) | Procedural building params from user GitHub stats |
| [lib/supabase/server.ts](lib/supabase/server.ts) | `createServerSupabase` (cookie-based) and `createServiceSupabase` (service role) |
| [supabase/migrations/001_initial_schema.sql](supabase/migrations/001_initial_schema.sql) | Full schema: 12 tables, 20 achievements, 16 cosmetic items |

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
- 3D city homepage with 80+ buildings from `data/projects.json`
- Drone first-person mode
- Project submission via Discord webhook (no-ops if `DISCORD_WEBHOOK_URL` unset)
- GitHub user sync (lazy, 24h cache) via `/api/user`
- All Supabase-backed APIs (`/api/shop`, `/api/achievements`, `/api/kudos`, `/api/building`, `/api/share`, `/api/dailies`)
- User profile page `/user/[username]`
- Compare page `/compare/[u1]/[u2]`

**Stubbed / not yet wired**:
- GitHub OAuth in Supabase Auth (needed for `auth.uid()`-based RLS writes — kudos, shop equip, etc.)
- `/api/sync` cron job (no scheduler set up; users sync lazily)
- Discord webhook URL (optional)
- Payment provider (see "Payments" above)

## Things to do, ranked by impact

1. **Real-time multiplayer drones** via PartyKit — see other people flying around in the city (inspired by srizzon/git-city)
2. **Instanced building rendering** — Three.js `InstancedMesh` so we can scale past ~1k buildings
3. **GitHub OAuth + claim-your-building flow** — let users claim a project building or submit a personal building
4. **Server-side share cards** with `@napi-rs/canvas` — generate downloadable PNGs of profile + building
5. **Razorpay or NOWPayments** integration to revive shop checkout
