import { NextRequest, NextResponse } from "next/server";
import {
  getShopItems,
  getUserInventory,
  getEquippedItems,
  equipItem,
  unequipSlot,
  createCheckoutSession,
} from "@/lib/services/shop";

// GET /api/shop — List shop items, or user's inventory
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  const view = req.nextUrl.searchParams.get("view"); // "inventory" | "equipped"

  if (userId && view === "inventory") {
    const inventory = await getUserInventory(userId);
    return NextResponse.json({ inventory });
  }

  if (userId && view === "equipped") {
    const equipped = await getEquippedItems(userId);
    return NextResponse.json({ equipped });
  }

  // Default: list all shop items
  const items = await getShopItems();
  return NextResponse.json({ items });
}

// POST /api/shop — Checkout or equip/unequip
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "checkout") {
    const { user_id, item_ids, return_url } = body;
    if (!user_id || !item_ids?.length) {
      return NextResponse.json(
        { error: "user_id and item_ids required" },
        { status: 400 }
      );
    }
    try {
      const result = await createCheckoutSession(
        user_id,
        item_ids,
        return_url || `${process.env.NEXT_PUBLIC_URL}/shop`
      );
      return NextResponse.json(result);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Checkout failed" },
        { status: 400 }
      );
    }
  }

  if (action === "equip") {
    const { user_id, item_id, slot } = body;
    if (!user_id || !item_id || !slot) {
      return NextResponse.json(
        { error: "user_id, item_id, and slot required" },
        { status: 400 }
      );
    }
    try {
      const result = await equipItem(user_id, item_id, slot);
      return NextResponse.json(result);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Equip failed" },
        { status: 400 }
      );
    }
  }

  if (action === "unequip") {
    const { user_id, slot } = body;
    if (!user_id || !slot) {
      return NextResponse.json(
        { error: "user_id and slot required" },
        { status: 400 }
      );
    }
    const result = await unequipSlot(user_id, slot);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
