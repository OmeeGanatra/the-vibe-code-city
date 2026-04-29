import { createServiceSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jobs — Vibe Code City",
  description:
    "Companies hiring vibe coders. Browse open roles for AI-native developers, MVPs, and production builds.",
  openGraph: {
    title: "Jobs in Vibe Code City",
    description: "Companies hiring AI-native vibe coders.",
    type: "website",
  },
};

export const revalidate = 30;

function formatBudget(min: number | null, max: number | null, type: string): string {
  if (min == null && max == null) return "";
  const suffix = type === "hourly" ? "/hr" : type === "salary" ? "/yr" : "";
  if (min != null && max != null) return `$${min.toLocaleString()}–$${max.toLocaleString()}${suffix}`;
  if (min != null) return `$${min.toLocaleString()}+${suffix}`;
  if (max != null) return `up to $${max.toLocaleString()}${suffix}`;
  return "";
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < hour) return `${Math.max(1, Math.floor(diff / min))}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 30 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default async function JobsPage() {
  const supabase = createServiceSupabase();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  const list = jobs ?? [];

  return (
    <main className="min-h-screen overflow-auto bg-[#0d0400]">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-2">
          <Link
            href="/"
            className="font-pixel text-[10px] text-[#5a3a2a] hover:text-[#ff6b35]"
          >
            ← BACK TO CITY
          </Link>
        </div>

        <div className="mb-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="font-pixel text-2xl text-[#ffd166]">JOBS</h1>
            <span className="border border-[#ffd166] px-2 py-0.5 font-pixel text-[9px] text-[#ffd166]">
              {list.length} OPEN
            </span>
          </div>
          <Link
            href="/jobs/post"
            className="btn-press inline-block bg-[#ffd166] px-4 py-2 font-pixel text-xs text-[#0d0400] hover:bg-[#ffe168]"
            style={{ boxShadow: "0 4px 0 #4a3a0a" }}
          >
            + POST A JOB
          </Link>
        </div>
        <p className="mb-6 max-w-2xl font-pixel text-[10px] leading-relaxed text-[#8a5a3a]">
          Companies hiring AI-native vibe coders. Post a role, find a builder.
        </p>

        {list.length === 0 ? (
          <div className="border border-[#2a1a0f] bg-[#1a0a04] p-8 text-center">
            <p className="font-pixel text-xs text-[#8a5a3a]">
              No open jobs yet. Be the first to post.
            </p>
            <Link
              href="/jobs/post"
              className="mt-4 inline-block font-pixel text-[10px] text-[#ffd166] hover:underline"
            >
              → Post the first job
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {list.map((job) => (
              <div
                key={job.id}
                className="group border border-[#2a1a0f] bg-[#1a0a04] p-5 transition-all hover:border-[#ffd166]"
              >
                {/* Top row */}
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-pixel text-sm text-[#ffd166]">{job.title}</div>
                    <div className="mt-1 flex items-center gap-2 font-pixel text-[10px] text-[#8a5a3a]">
                      <span className="text-[#ff8c5a]">{job.company_name}</span>
                      <span>·</span>
                      <span>{job.remote ? "Remote" : job.location ?? "On-site"}</span>
                      <span>·</span>
                      <span>{relativeTime(job.created_at)}</span>
                    </div>
                  </div>
                  {(job.budget_min_usd != null || job.budget_max_usd != null) && (
                    <div className="text-right shrink-0">
                      <div className="font-pixel text-xs text-[#ffd166]">
                        {formatBudget(job.budget_min_usd, job.budget_max_usd, job.budget_type)}
                      </div>
                      <div className="font-pixel text-[9px] text-[#5a3a2a]">
                        {job.budget_type}
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="mb-3 font-pixel text-[10px] leading-relaxed text-[#c09878] line-clamp-3">
                  {job.description}
                </p>

                {/* Skills */}
                {job.skills && job.skills.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {job.skills.slice(0, 8).map((skill: string) => (
                      <span
                        key={skill}
                        className="border border-[#2a1a0f] bg-[#0d0400] px-2 py-0.5 font-pixel text-[9px] text-[#8a5a3a]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Apply */}
                <div className="flex items-center justify-end border-t border-[#2a1a0f] pt-3">
                  <a
                    href={job.contact_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-press inline-block bg-[#ffd166] px-4 py-1.5 font-pixel text-xs text-[#0d0400] hover:bg-[#ffe168]"
                    style={{ boxShadow: "0 3px 0 #4a3a0a" }}
                  >
                    APPLY →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-1 border-t border-[#2a1a0f] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-pixel text-[10px] text-[#5a3a2a]">
            Looking for vibe coders directly?{" "}
            <Link href="/hire" className="text-[#7fff6b] hover:underline">Browse the hire directory →</Link>
          </p>
          <Link href="/leaderboard" className="font-pixel text-[10px] text-[#5a3a2a] hover:text-[#ffd166]">
            Leaderboard →
          </Link>
        </div>
      </div>
    </main>
  );
}
