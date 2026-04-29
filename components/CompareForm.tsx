"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CompareForm({ username }: { username: string }) {
  const [other, setOther] = useState("");
  const router = useRouter();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const slug = other.trim();
        if (slug) router.push(`/compare/${username}/${slug}`);
      }}
      className="flex items-center gap-2"
    >
      <input
        className="w-36 border border-[#2a1a0f] bg-[#1a0a04] px-2 py-1 font-pixel text-[10px] text-[#c09878] placeholder-[#3a2a1f] focus:border-[#ffd166] focus:outline-none"
        placeholder="their login"
        value={other}
        onChange={(e) => setOther(e.target.value)}
      />
      <button
        type="submit"
        className="font-pixel text-[10px] text-[#ffd166] hover:underline disabled:opacity-40"
        disabled={!other.trim()}
      >
        COMPARE →
      </button>
    </form>
  );
}
