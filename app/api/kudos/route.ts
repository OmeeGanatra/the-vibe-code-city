import { NextRequest, NextResponse } from "next/server";
import { sendKudos, getKudosForUser, getKudosCount } from "@/lib/services/kudos";
import { getActivityFeed } from "@/lib/services/kudos";

// GET /api/kudos?user_id=xxx — Get kudos received by a user
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  const feedOnly = req.nextUrl.searchParams.get("feed");

  if (feedOnly) {
    const feed = await getActivityFeed(userId ?? undefined, 50);
    return NextResponse.json({ feed });
  }

  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const [kudos, count] = await Promise.all([
    getKudosForUser(userId),
    getKudosCount(userId),
  ]);

  return NextResponse.json({ kudos, count });
}

// POST /api/kudos — Send kudos to another user
export async function POST(req: NextRequest) {
  const { from_user_id, to_user_id, message } = await req.json();

  if (!from_user_id || !to_user_id) {
    return NextResponse.json(
      { error: "from_user_id and to_user_id required" },
      { status: 400 }
    );
  }

  try {
    const kudos = await sendKudos(from_user_id, to_user_id, message);
    return NextResponse.json({ kudos });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send kudos" },
      { status: 400 }
    );
  }
}
