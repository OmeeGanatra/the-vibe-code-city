"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ── SYSTEM 8: Shop Page ─────────────────────────────────────

interface ShopItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  item_type: string;
  rarity: string;
  price_cents: number;
  active: boolean;
}

const RARITY_COLORS: Record<string, string> = {
  common: "#8a5a3a",
  rare: "#6b8cff",
  epic: "#c77dff",
  legendary: "#ffd166",
};

const TYPE_LABELS: Record<string, string> = {
  crown: "Crowns",
  aura: "Auras",
  roof: "Rooftops",
  face: "Faces",
  neon_trim: "Neon Trim",
  banner: "Banners",
};

export default function ShopPage() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shop")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items ?? []);
        setLoading(false);
      });
  }, []);

  const filteredItems = filter
    ? items.filter((i) => i.item_type === filter)
    : items;

  const types = [...new Set(items.map((i) => i.item_type))];

  return (
    <main className="min-h-screen overflow-auto bg-[#0d0400]">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-2">
          <Link
            href="/"
            className="font-pixel text-[10px] text-[#5a3a2a] hover:text-[#ff6b35]"
          >
            ← BACK TO CITY
          </Link>
        </div>

        <h1 className="mb-2 font-pixel text-xl text-[#ff6b35]">SHOP</h1>
        <p className="mb-2 font-pixel text-[10px] text-[#5a3a2a]">
          Customize your building with cosmetic items
        </p>
        <p className="mb-6 font-pixel text-[9px] text-[#8a5a3a]">
          PREVIEW · purchases coming soon
        </p>

        {/* Filter tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter(null)}
            className={`font-pixel text-[10px] px-3 py-1 border ${
              !filter
                ? "border-[#ff6b35] text-[#ff6b35]"
                : "border-[#2a1a0f] text-[#5a3a2a] hover:text-[#ff6b35]"
            }`}
          >
            ALL
          </button>
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`font-pixel text-[10px] px-3 py-1 border ${
                filter === type
                  ? "border-[#ff6b35] text-[#ff6b35]"
                  : "border-[#2a1a0f] text-[#5a3a2a] hover:text-[#ff6b35]"
              }`}
            >
              {TYPE_LABELS[type] ?? type}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="font-pixel text-xs text-[#5a3a2a]">Loading items...</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-[#2a1a0f] bg-[#1a0a04] p-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="font-pixel text-xs"
                      style={{ color: RARITY_COLORS[item.rarity] }}
                    >
                      {item.name}
                    </span>
                    <span className="font-pixel text-[10px] text-[#ff6b35]">
                      ${(item.price_cents / 100).toFixed(2)}
                    </span>
                  </div>
                  {item.description && (
                    <p className="mt-1 font-pixel text-[9px] text-[#8a5a3a]">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className="font-pixel text-[8px] uppercase"
                      style={{ color: RARITY_COLORS[item.rarity] }}
                    >
                      {item.rarity}
                    </span>
                    <span className="font-pixel text-[8px] text-[#5a3a2a]">
                      {TYPE_LABELS[item.item_type] ?? item.item_type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
