"use client";

import { useState } from "react";
import Link from "next/link";

// ── SYSTEM 10: Advertise Page ───────────────────────────────

export default function AdvertisePage() {
  const [step, setStep] = useState<"form" | "preview" | "submitted">("form");
  const [form, setForm] = useState({
    name: "",
    headline: "",
    body: "",
    cta_text: "Learn More",
    cta_url: "",
    target_category: "",
    budget: "50",
    cpc: "0.10",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        advertiser_id: "demo-user-id", // In production: use auth user ID
        name: form.name,
        headline: form.headline,
        body: form.body,
        cta_text: form.cta_text,
        cta_url: form.cta_url,
        target_category: form.target_category || undefined,
        budget_cents: Math.round(parseFloat(form.budget) * 100),
        cpc_cents: Math.round(parseFloat(form.cpc) * 100),
      }),
    });

    if (res.ok) {
      setStep("submitted");
    }
  };

  const inputClass =
    "w-full border border-[#2a1a0f] bg-[#1a0a04] px-3 py-2 font-pixel text-xs text-[#c09878] placeholder-[#3a2a1f] focus:border-[#ff6b35] focus:outline-none";
  const labelClass = "mb-1 block font-pixel text-[9px] uppercase text-[#5a3a2a]";

  return (
    <main className="min-h-screen overflow-auto bg-[#0d0400]">
      <div className="mx-auto max-w-lg px-6 py-12">
        <div className="mb-2">
          <Link
            href="/"
            className="font-pixel text-[10px] text-[#5a3a2a] hover:text-[#ff6b35]"
          >
            ← BACK TO CITY
          </Link>
        </div>

        <h1 className="mb-2 font-pixel text-xl text-[#ff6b35]">ADVERTISE</h1>
        <p className="mb-6 font-pixel text-[10px] leading-relaxed text-[#5a3a2a]">
          Promote your developer tools and services to the Vibe Code City community.
          Your ad appears on buildings matching your target category. Pay per click.
        </p>

        {step === "submitted" ? (
          <div className="text-center">
            <div className="mb-4 font-pixel text-lg text-[#ff6b35]">CAMPAIGN CREATED</div>
            <p className="font-pixel text-xs text-[#8a5a3a]">
              Your campaign is being reviewed and will go live shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Campaign Name *</label>
              <input
                className={inputClass}
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="My Campaign"
              />
            </div>
            <div>
              <label className={labelClass}>Headline *</label>
              <input
                className={inputClass}
                required
                maxLength={80}
                value={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
                placeholder="Build faster with..."
              />
            </div>
            <div>
              <label className={labelClass}>Body Text</label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={2}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>CTA Text</label>
                <input
                  className={inputClass}
                  value={form.cta_text}
                  onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>CTA URL *</label>
                <input
                  className={inputClass}
                  type="url"
                  required
                  value={form.cta_url}
                  onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Target Category</label>
              <select
                className={`${inputClass} cursor-pointer`}
                value={form.target_category}
                onChange={(e) =>
                  setForm({ ...form, target_category: e.target.value })
                }
              >
                <option value="">All categories</option>
                <option value="tool">Tools</option>
                <option value="game">Games</option>
                <option value="app">Apps</option>
                <option value="agent">Agents</option>
                <option value="api">APIs</option>
                <option value="website">Websites</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Budget (USD) *</label>
                <input
                  className={inputClass}
                  type="number"
                  min="5"
                  step="1"
                  required
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Cost per Click (USD)</label>
                <input
                  className={inputClass}
                  type="number"
                  min="0.05"
                  step="0.01"
                  value={form.cpc}
                  onChange={(e) => setForm({ ...form, cpc: e.target.value })}
                />
              </div>
            </div>

            {/* Preview */}
            {form.headline && (
              <div className="border border-[#2a1a0f] bg-[#1a0a04] p-4">
                <div className="mb-1 font-pixel text-[8px] uppercase text-[#3a2a1f]">
                  AD PREVIEW
                </div>
                <div className="font-pixel text-xs text-[#ff8c5a]">
                  {form.headline}
                </div>
                {form.body && (
                  <p className="mt-1 font-pixel text-[9px] text-[#8a5a3a]">
                    {form.body}
                  </p>
                )}
                <div className="mt-2 inline-block border border-[#ff6b35] px-2 py-0.5 font-pixel text-[9px] text-[#ff6b35]">
                  {form.cta_text} →
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Link
                href="/"
                className="font-pixel text-xs text-[#5a3a2a] hover:text-[#ff6b35]"
              >
                ← CANCEL
              </Link>
              <button
                type="submit"
                className="btn-press pixel-shadow-coral bg-[#ff6b35] px-6 py-2 font-pixel text-xs text-[#0d0400]"
              >
                SUBMIT FOR REVIEW →
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
