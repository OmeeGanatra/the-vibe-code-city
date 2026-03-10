import SubmitForm from "@/components/SubmitForm";

export default function SubmitPage() {
  return (
    <main className="min-h-screen bg-[#0d0400] overflow-auto">
      <div className="mx-auto max-w-lg px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-1 font-pixel text-lg tracking-widest text-[#ff6b35]">
            THE VIBE CODE CITY
          </div>
          <h1 className="font-pixel text-sm text-[#c09878]">Add Your Project</h1>
          <p className="mt-2 font-pixel text-[9px] leading-relaxed text-[#5a3a2a]">
            Built something with Claude? Claim your building in the city. Every
            project gets its own skyscraper — the more loved it is, the taller it
            stands.
          </p>
        </div>

        {/* Form */}
        <SubmitForm />
      </div>
    </main>
  );
}
