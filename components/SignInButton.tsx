"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";

export default function SignInButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  if (loading) return null;

  if (user) {
    const login = user.user_metadata?.user_name as string | undefined;
    const avatar = user.user_metadata?.avatar_url as string | undefined;
    return (
      <div className="flex items-center gap-2">
        {login && (
          <Link href={`/user/${login}`}>
            {avatar ? (
              <img
                src={avatar}
                alt={login}
                width={28}
                height={28}
                className="border border-[#ff6b35] transition-colors hover:border-[#ffd166]"
              />
            ) : (
              <span className="font-pixel text-[10px] text-[#ff8c5a]">@{login}</span>
            )}
          </Link>
        )}
        <button
          onClick={signOut}
          className="font-pixel text-[9px] text-[#5a3a2a] transition-colors hover:text-[#ff6b35]"
        >
          SIGN OUT
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      className="btn-press border border-[#5a3a2a] bg-[#1a0a04] px-3 py-2 font-pixel text-[10px] text-[#8a5a3a] transition-colors hover:border-[#ff6b35] hover:text-[#ff6b35]"
      style={{ boxShadow: "0 2px 0 #1a0a04" }}
    >
      SIGN IN
    </button>
  );
}
