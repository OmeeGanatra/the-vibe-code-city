"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

const CATEGORIES = [
  { value: "tool", label: "Tool" },
  { value: "game", label: "Game" },
  { value: "app", label: "App" },
  { value: "agent", label: "Agent" },
  { value: "api", label: "API" },
  { value: "website", label: "Website" },
  { value: "other", label: "Other" },
];

export default function SubmitForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      description: (form.elements.namedItem("description") as HTMLTextAreaElement).value,
      url: (form.elements.namedItem("url") as HTMLInputElement).value,
      builderName: (form.elements.namedItem("builderName") as HTMLInputElement).value,
      builderTwitter: (form.elements.namedItem("builderTwitter") as HTMLInputElement).value,
      githubUrl: (form.elements.namedItem("githubUrl") as HTMLInputElement).value,
      category: (form.elements.namedItem("category") as HTMLSelectElement).value,
      tags: (form.elements.namedItem("tags") as HTMLInputElement).value,
    };

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Submission failed");
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  const inputClass =
    "w-full border border-[#2a1a0f] bg-[#1a0a04] px-3 py-2 font-pixel text-xs text-[#c09878] placeholder-[#3a2a1f] focus:border-[#ff6b35] focus:outline-none";

  const labelClass = "mb-1 block font-pixel text-[9px] uppercase text-[#5a3a2a]";

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
        {/* Pixel city icon */}
        <div className="flex items-end gap-1">
          {[16, 28, 12, 40, 20].map((h, i) => (
            <div key={i} className="bg-[#ff6b35]" style={{ width: 8, height: h }} />
          ))}
        </div>
        <div className="font-pixel text-lg text-[#ff6b35]">SUBMISSION RECEIVED!</div>
        <p className="max-w-xs font-pixel text-xs leading-relaxed text-[#8a5a3a]">
          Your project is in the queue. We&apos;ll review it and add it to The Vibe Code City
          within 24 hours.
        </p>
        <Link
          href="/"
          className="border border-[#ff6b35] px-6 py-2 font-pixel text-xs text-[#ff6b35] transition-colors hover:bg-[#ff6b35] hover:text-[#0d0400]"
        >
          ← BACK TO CITY
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="name" className={labelClass}>
          Project Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={60}
          placeholder="My Claude App"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description * (max 280 chars)
        </label>
        <textarea
          id="description"
          name="description"
          required
          maxLength={280}
          rows={3}
          placeholder="What does it do? What makes it interesting?"
          className={`${inputClass} resize-none`}
        />
      </div>

      <div>
        <label htmlFor="url" className={labelClass}>
          Live URL *
        </label>
        <input
          id="url"
          name="url"
          type="url"
          required
          placeholder="https://myapp.com"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="builderName" className={labelClass}>
            Your Name *
          </label>
          <input
            id="builderName"
            name="builderName"
            type="text"
            required
            placeholder="Jane Smith"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="builderTwitter" className={labelClass}>
            Twitter/X Handle
          </label>
          <input
            id="builderTwitter"
            name="builderTwitter"
            type="text"
            placeholder="@jane"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="githubUrl" className={labelClass}>
          GitHub Repo URL
        </label>
        <input
          id="githubUrl"
          name="githubUrl"
          type="url"
          placeholder="https://github.com/..."
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className={labelClass}>
            Category *
          </label>
          <select
            id="category"
            name="category"
            required
            className={`${inputClass} cursor-pointer`}
          >
            <option value="">Select...</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tags" className={labelClass}>
            Tags (comma separated)
          </label>
          <input
            id="tags"
            name="tags"
            type="text"
            placeholder="ai, productivity, cli"
            className={inputClass}
          />
        </div>
      </div>

      {status === "error" && (
        <p className="font-pixel text-xs text-red-400">{errorMsg}</p>
      )}

      <div className="flex items-center justify-between pt-2">
        <Link
          href="/"
          className="font-pixel text-xs text-[#5a3a2a] transition-colors hover:text-[#ff6b35]"
        >
          ← BACK TO CITY
        </Link>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="btn-press pixel-shadow-coral bg-[#ff6b35] px-6 py-2 font-pixel text-xs text-[#0d0400] disabled:opacity-50"
        >
          {status === "submitting" ? "SUBMITTING..." : "SUBMIT PROJECT →"}
        </button>
      </div>
    </form>
  );
}
