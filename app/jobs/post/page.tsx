"use client";

import { useState } from "react";
import Link from "next/link";

export default function PostJobPage() {
  const [step, setStep] = useState<"form" | "submitted">("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    company_name: "",
    poster_email: "",
    title: "",
    description: "",
    contact_url: "",
    budget_min_usd: "",
    budget_max_usd: "",
    budget_type: "project" as "project" | "hourly" | "salary",
    remote: true,
    location: "",
    skills: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: form.company_name,
          poster_email: form.poster_email,
          title: form.title,
          description: form.description,
          contact_url: form.contact_url,
          budget_min_usd: form.budget_min_usd ? parseInt(form.budget_min_usd) : null,
          budget_max_usd: form.budget_max_usd ? parseInt(form.budget_max_usd) : null,
          budget_type: form.budget_type,
          remote: form.remote,
          location: form.location || null,
          skills: form.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Submission failed");
        setSubmitting(false);
        return;
      }

      setStep("submitted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full border border-[#2a1a0f] bg-[#1a0a04] px-3 py-2 font-pixel text-xs text-[#c09878] placeholder-[#3a2a1f] focus:border-[#ffd166] focus:outline-none";
  const labelClass = "mb-1 block font-pixel text-[9px] uppercase text-[#5a3a2a]";

  if (step === "submitted") {
    return (
      <main className="min-h-screen overflow-auto bg-[#0d0400]">
        <div className="mx-auto max-w-lg px-6 py-16 text-center">
          <div className="mb-3 font-pixel text-2xl text-[#ffd166]">JOB POSTED</div>
          <p className="mb-6 font-pixel text-xs text-[#8a5a3a]">
            Your role is now visible to every vibe coder browsing the city.
          </p>
          <Link
            href="/jobs"
            className="btn-press inline-block bg-[#ffd166] px-4 py-2 font-pixel text-xs text-[#0d0400] hover:bg-[#ffe168]"
            style={{ boxShadow: "0 4px 0 #4a3a0a" }}
          >
            VIEW JOB BOARD →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-auto bg-[#0d0400]">
      <div className="mx-auto max-w-lg px-6 py-12">
        <div className="mb-2">
          <Link
            href="/jobs"
            className="font-pixel text-[10px] text-[#5a3a2a] hover:text-[#ff6b35]"
          >
            ← BACK TO JOB BOARD
          </Link>
        </div>

        <h1 className="mb-2 font-pixel text-xl text-[#ffd166]">POST A JOB</h1>
        <p className="mb-6 font-pixel text-[10px] leading-relaxed text-[#5a3a2a]">
          Hiring a vibe coder? Post your role and reach the AI-native developer community.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Company *</label>
            <input
              className={inputClass}
              required
              maxLength={80}
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              placeholder="Acme Inc."
            />
          </div>
          <div>
            <label className={labelClass}>Your Email * (private, for our records)</label>
            <input
              className={inputClass}
              type="email"
              required
              maxLength={200}
              value={form.poster_email}
              onChange={(e) => setForm({ ...form, poster_email: e.target.value })}
              placeholder="hiring@acme.com"
            />
          </div>
          <div>
            <label className={labelClass}>Job Title *</label>
            <input
              className={inputClass}
              required
              maxLength={120}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Full-stack vibe coder for MVP"
            />
          </div>
          <div>
            <label className={labelClass}>Description * (markdown OK)</label>
            <textarea
              className={`${inputClass} resize-none`}
              required
              rows={6}
              maxLength={3000}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What you're building, what you need, who you want, anything else."
            />
          </div>
          <div>
            <label className={labelClass}>How to Apply * (URL or mailto:)</label>
            <input
              className={inputClass}
              required
              maxLength={500}
              value={form.contact_url}
              onChange={(e) => setForm({ ...form, contact_url: e.target.value })}
              placeholder="mailto:hiring@acme.com or https://acme.com/jobs/..."
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Budget Min ($)</label>
              <input
                className={inputClass}
                type="number"
                min="0"
                value={form.budget_min_usd}
                onChange={(e) => setForm({ ...form, budget_min_usd: e.target.value })}
                placeholder="5000"
              />
            </div>
            <div>
              <label className={labelClass}>Budget Max ($)</label>
              <input
                className={inputClass}
                type="number"
                min="0"
                value={form.budget_max_usd}
                onChange={(e) => setForm({ ...form, budget_max_usd: e.target.value })}
                placeholder="15000"
              />
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select
                className={`${inputClass} cursor-pointer`}
                value={form.budget_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    budget_type: e.target.value as "project" | "hourly" | "salary",
                  })
                }
              >
                <option value="project">Project</option>
                <option value="hourly">Hourly</option>
                <option value="salary">Salary</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 font-pixel text-xs text-[#c09878]">
              <input
                type="checkbox"
                checked={form.remote}
                onChange={(e) => setForm({ ...form, remote: e.target.checked })}
                className="accent-[#ffd166]"
              />
              Remote
            </label>
            {!form.remote && (
              <input
                className={inputClass}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="San Francisco, CA"
              />
            )}
          </div>
          <div>
            <label className={labelClass}>Skills (comma-separated)</label>
            <input
              className={inputClass}
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              placeholder="TypeScript, Next.js, Three.js, Supabase"
            />
          </div>

          {error && (
            <div className="border border-[#ff6b35] bg-[#1a0a04] p-3 font-pixel text-[10px] text-[#ff6b35]">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Link
              href="/jobs"
              className="font-pixel text-xs text-[#5a3a2a] hover:text-[#ff6b35]"
            >
              ← CANCEL
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn-press inline-block bg-[#ffd166] px-6 py-2 font-pixel text-xs text-[#0d0400] hover:bg-[#ffe168] disabled:opacity-50"
              style={{ boxShadow: "0 4px 0 #4a3a0a" }}
            >
              {submitting ? "POSTING..." : "POST JOB →"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
