"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  profileLogin: string;
  initial: {
    for_hire: boolean;
    hire_headline: string | null;
    hire_bio: string | null;
    hire_rate_usd_hourly: number | null;
    hire_availability: string | null;
    hire_contact_url: string | null;
    hire_skills: string[];
  };
}

export default function HireEditPanel({ profileLogin, initial }: Props) {
  const [isOwner, setIsOwner] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    for_hire: initial.for_hire,
    hire_headline: initial.hire_headline ?? "",
    hire_bio: initial.hire_bio ?? "",
    hire_rate_usd_hourly: initial.hire_rate_usd_hourly?.toString() ?? "",
    hire_availability: initial.hire_availability ?? "",
    hire_contact_url: initial.hire_contact_url ?? "",
    hire_skills: initial.hire_skills.join(", "),
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const login = data.user?.user_metadata?.user_name as string | undefined;
      setIsOwner(login?.toLowerCase() === profileLogin.toLowerCase());
    });
  }, [profileLogin]);

  if (!isOwner) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/hire", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          for_hire: form.for_hire,
          hire_headline: form.hire_headline || null,
          hire_bio: form.hire_bio || null,
          hire_rate_usd_hourly: form.hire_rate_usd_hourly ? parseInt(form.hire_rate_usd_hourly) : null,
          hire_availability: form.hire_availability || null,
          hire_contact_url: form.hire_contact_url || null,
          hire_skills: form.hire_skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Save failed"); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const input = "w-full border border-[#2a1a0f] bg-[#1a0a04] px-3 py-2 font-pixel text-xs text-[#c09878] placeholder-[#3a2a1f] focus:border-[#7fff6b] focus:outline-none";
  const label = "mb-1 block font-pixel text-[9px] uppercase text-[#5a3a2a]";

  return (
    <div className="mt-4">
      {saved && (
        <div className="mb-2 border border-[#7fff6b] bg-[#0d1f0d] px-3 py-2 font-pixel text-[10px] text-[#7fff6b]">
          ✓ Hire profile saved
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="font-pixel text-[9px] text-[#5a3a2a] transition-colors hover:text-[#7fff6b]"
      >
        {open ? "▲ CLOSE EDIT" : "✎ EDIT HIRE PROFILE"}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 border border-[#2a1a0f] bg-[#120a04] p-4">
          <label className="flex items-center gap-2 font-pixel text-xs text-[#c09878]">
            <input
              type="checkbox"
              checked={form.for_hire}
              onChange={(e) => setForm({ ...form, for_hire: e.target.checked })}
              className="accent-[#7fff6b]"
            />
            Available for hire
          </label>

          <div>
            <div className={label}>Headline</div>
            <input className={input} maxLength={120} placeholder="Ships in days, not months" value={form.hire_headline} onChange={(e) => setForm({ ...form, hire_headline: e.target.value })} />
          </div>
          <div>
            <div className={label}>Short bio</div>
            <textarea className={`${input} resize-none`} rows={3} maxLength={500} placeholder="What you build and how you work" value={form.hire_bio} onChange={(e) => setForm({ ...form, hire_bio: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className={label}>Rate ($/hr)</div>
              <input className={input} type="number" min="0" placeholder="150" value={form.hire_rate_usd_hourly} onChange={(e) => setForm({ ...form, hire_rate_usd_hourly: e.target.value })} />
            </div>
            <div>
              <div className={label}>Availability</div>
              <input className={input} maxLength={60} placeholder="Available now" value={form.hire_availability} onChange={(e) => setForm({ ...form, hire_availability: e.target.value })} />
            </div>
          </div>
          <div>
            <div className={label}>Contact URL (mailto: or https://)</div>
            <input className={input} maxLength={500} placeholder="mailto:you@example.com" value={form.hire_contact_url} onChange={(e) => setForm({ ...form, hire_contact_url: e.target.value })} />
          </div>
          <div>
            <div className={label}>Skills (comma-separated)</div>
            <input className={input} maxLength={300} placeholder="TypeScript, Next.js, React" value={form.hire_skills} onChange={(e) => setForm({ ...form, hire_skills: e.target.value })} />
          </div>

          {error && (
            <div className="border border-[#ff6b35] px-3 py-2 font-pixel text-[10px] text-[#ff6b35]">{error}</div>
          )}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)} className="font-pixel text-[10px] text-[#5a3a2a] hover:text-[#ff6b35]">CANCEL</button>
            <button
              type="submit"
              disabled={saving}
              className="btn-press bg-[#7fff6b] px-4 py-1.5 font-pixel text-xs text-[#0d0400] hover:bg-[#a0ff80] disabled:opacity-50"
              style={{ boxShadow: "0 3px 0 #2a4a2a" }}
            >
              {saving ? "SAVING..." : "SAVE →"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
