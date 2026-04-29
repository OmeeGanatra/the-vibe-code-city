import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0d0400] text-center">
      <div className="mb-4 font-pixel text-6xl text-[#ff6b35]">404</div>
      <p className="mb-2 font-pixel text-sm text-[#8a5a3a]">
        This building doesn&apos;t exist in the city.
      </p>
      <p className="mb-8 font-pixel text-[10px] text-[#5a3a2a]">
        Maybe it was demolished. Maybe it never shipped.
      </p>
      <div className="flex flex-col gap-2">
        <Link
          href="/"
          className="btn-press inline-block bg-[#ff6b35] px-6 py-2 font-pixel text-xs text-[#0d0400] hover:bg-[#ff8c5a]"
          style={{ boxShadow: "0 4px 0 #3a1a0a" }}
        >
          ← BACK TO CITY
        </Link>
        <Link
          href="/submit"
          className="font-pixel text-[10px] text-[#5a3a2a] hover:text-[#ff6b35]"
        >
          Submit your project →
        </Link>
      </div>
    </main>
  );
}
