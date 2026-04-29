"use client";

import { createClient } from "@/lib/supabase/client";

export default function ClaimButton({ username }: { username: string }) {
  const handleClaim = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
    void username;
  };
  return (
    <button
      onClick={handleClaim}
      className="ml-4 shrink-0 font-pixel text-[10px] text-[#ff6b35] hover:underline"
    >
      CLAIM →
    </button>
  );
}
