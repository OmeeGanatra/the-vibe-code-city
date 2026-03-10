import { createServiceSupabase } from "@/lib/supabase/server";

// ── SYSTEM 1: GitHub Data Pipeline ──────────────────────────
// Fetches user profiles, repos, contributions, and stars
// via the GitHub REST API with caching in Supabase.

const GITHUB_API = "https://api.github.com";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  email: string | null;
  followers: number;
  following: number;
  public_repos: number;
  created_at: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  html_url: string;
}

async function githubFetch<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "vibe-code-city",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  else if (process.env.GITHUB_TOKEN)
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const res = await fetch(`${GITHUB_API}${path}`, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText} for ${path}`);
  }
  return res.json();
}

// ── Cached fetch wrapper ────────────────────────────────────

async function cachedGithubFetch<T>(
  cacheKey: string,
  path: string,
  token?: string
): Promise<T> {
  const supabase = createServiceSupabase();

  // Check cache
  const { data: cached } = await supabase
    .from("github_cache")
    .select("data, expires_at")
    .eq("cache_key", cacheKey)
    .single();

  if (cached && new Date(cached.expires_at) > new Date()) {
    return cached.data as T;
  }

  // Fetch fresh
  const data = await githubFetch<T>(path, token);

  // Store in cache
  await supabase.from("github_cache").upsert({
    cache_key: cacheKey,
    data: data as unknown,
    expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
  });

  return data;
}

// ── Fetch & Sync User Profile ───────────────────────────────

export async function fetchGitHubUser(login: string, token?: string): Promise<GitHubUser> {
  return cachedGithubFetch<GitHubUser>(`user:${login}`, `/users/${login}`, token);
}

export async function fetchGitHubRepos(login: string, token?: string): Promise<GitHubRepo[]> {
  return cachedGithubFetch<GitHubRepo[]>(
    `repos:${login}`,
    `/users/${login}/repos?per_page=100&sort=stars&direction=desc`,
    token
  );
}

export async function fetchContributionCount(login: string): Promise<number> {
  // GitHub doesn't expose contribution count via REST API directly.
  // We approximate by summing commit events from the events API.
  try {
    const events = await cachedGithubFetch<Array<{ type: string }>>(
      `events:${login}`,
      `/users/${login}/events?per_page=100`
    );
    return events.filter((e) => e.type === "PushEvent").length * 3; // rough estimate
  } catch {
    return 0;
  }
}

// ── Full Sync: Upsert user + repos + contribution data ──────

export async function syncUser(login: string, token?: string) {
  const supabase = createServiceSupabase();

  // 1. Fetch GitHub user profile
  const ghUser = await fetchGitHubUser(login, token);

  // 2. Fetch repos
  const ghRepos = await fetchGitHubRepos(login, token);
  const totalStars = ghRepos.reduce((sum, r) => sum + r.stargazers_count, 0);

  // Determine primary language
  const langCounts: Record<string, number> = {};
  for (const repo of ghRepos) {
    if (repo.language) {
      langCounts[repo.language] = (langCounts[repo.language] || 0) + repo.stargazers_count + 1;
    }
  }
  const primaryLanguage =
    Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // 3. Fetch contribution count
  const contributions = await fetchContributionCount(login);

  // 4. Upsert user
  const { data: user, error: userError } = await supabase
    .from("users")
    .upsert(
      {
        github_id: ghUser.id,
        github_login: ghUser.login,
        name: ghUser.name,
        avatar_url: ghUser.avatar_url,
        bio: ghUser.bio,
        email: ghUser.email,
        followers: ghUser.followers,
        following: ghUser.following,
        public_repos: ghUser.public_repos,
        total_stars: totalStars,
        total_contributions: contributions,
        primary_language: primaryLanguage,
        github_created_at: ghUser.created_at,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "github_id" }
    )
    .select()
    .single();

  if (userError || !user) throw userError || new Error("Failed to upsert user");

  // 5. Upsert repositories
  for (const repo of ghRepos) {
    await supabase.from("repositories").upsert(
      {
        user_id: user.id,
        github_repo_id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        is_fork: repo.fork,
        url: repo.html_url,
      },
      { onConflict: "github_repo_id" }
    );
  }

  // 6. Store current week contributions
  const now = new Date();
  const week = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) /
      (7 * 24 * 60 * 60 * 1000)
  );
  await supabase.from("contributions").upsert(
    {
      user_id: user.id,
      year: now.getFullYear(),
      week,
      count: contributions,
    },
    { onConflict: "user_id,year,week" }
  );

  return user;
}

// ── Batch sync (for scheduled job) ──────────────────────────

export async function syncAllUsers() {
  const supabase = createServiceSupabase();
  const { data: users } = await supabase
    .from("users")
    .select("github_login")
    .order("last_synced_at", { ascending: true, nullsFirst: true })
    .limit(50); // Process 50 at a time to avoid rate limits

  if (!users) return { synced: 0 };

  let synced = 0;
  for (const user of users) {
    try {
      await syncUser(user.github_login);
      synced++;
      // Respect GitHub rate limits
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(`Failed to sync ${user.github_login}:`, err);
    }
  }

  return { synced };
}
