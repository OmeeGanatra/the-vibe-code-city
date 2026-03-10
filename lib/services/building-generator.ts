import type { User } from "@/lib/supabase/types";
import { CATEGORY_COLORS, type ProjectCategory } from "@/lib/projects";
import { hashStr, seededRandom } from "@/lib/utils";

// ── SYSTEM 2: Building Generator ────────────────────────────
// Converts GitHub stats into 3D building parameters.
// This bridges the data pipeline (System 1) with the 3D renderer.

export interface BuildingParams {
  height: number;
  width: number;
  depth: number;
  floors: number;
  windowsPerFloor: number;
  sideWindowsPerFloor: number;
  litPercentage: number;
  faceColor: string;
  roofColor: string;
  windowLitColors: string[];
  windowOffColor: string;
  decorations: BuildingDecoration[];
}

export interface BuildingDecoration {
  type: "crown" | "aura" | "antenna" | "garden" | "helipad" | "pool" | "neon_trim" | "banner" | "face";
  variant?: string;
  color?: string;
}

const MIN_HEIGHT = 40;
const MAX_HEIGHT = 600;
const HEIGHT_RANGE = MAX_HEIGHT - MIN_HEIGHT;

// Map primary languages to building categories for coloring
const LANGUAGE_TO_CATEGORY: Record<string, ProjectCategory> = {
  TypeScript: "tool",
  JavaScript: "tool",
  Python: "agent",
  Rust: "api",
  Go: "api",
  Java: "app",
  "C#": "game",
  "C++": "game",
  Swift: "app",
  Kotlin: "app",
  Ruby: "website",
  PHP: "website",
  Dart: "app",
};

function inferCategory(language: string | null): ProjectCategory {
  if (!language) return "other";
  return LANGUAGE_TO_CATEGORY[language] ?? "other";
}

export function generateBuildingParams(
  user: User,
  maxContributions = 10000,
  maxStars = 50000,
  equippedItems: { slot: string; slug: string }[] = []
): BuildingParams {
  const seed = hashStr(user.github_login);

  // ── Height: driven by contributions (primary) + stars (secondary) ──
  const contribNorm = Math.min(user.total_contributions / maxContributions, 3);
  const starsNorm = Math.min(user.total_stars / maxStars, 3);
  const reposNorm = Math.min(user.public_repos / 200, 1);

  const contribScore = Math.pow(contribNorm, 0.55);
  const starsScore = Math.pow(starsNorm, 0.45);
  const reposScore = Math.pow(reposNorm, 0.5);

  const composite = contribScore * 0.55 + starsScore * 0.35 + reposScore * 0.1;
  const height = Math.min(MAX_HEIGHT, MIN_HEIGHT + composite * HEIGHT_RANGE);

  // ── Width: driven by repo count + language diversity ──
  const repoFactor = Math.min(1, user.public_repos / 200);
  const baseW = 14 + repoFactor * 24;
  const jitter = (seededRandom(seed) - 0.5) * 4;
  const width = Math.round(baseW + jitter);

  // ── Depth: seeded from username ──
  const depth = Math.round(12 + seededRandom(seed + 99) * 20);

  // ── Lit windows: based on recency of activity ──
  let litPercentage = 0.1 + composite * 0.8;
  if (user.last_synced_at) {
    const daysSinceSync =
      (Date.now() - new Date(user.last_synced_at).getTime()) / 86400000;
    const recency = Math.exp(-daysSinceSync / 30);
    litPercentage = Math.max(litPercentage, 0.15 + recency * 0.75);
  }

  // ── Floor calculations ──
  const floorH = 6;
  const floors = Math.max(3, Math.floor(height / floorH));
  const windowsPerFloor = Math.max(3, Math.floor(width / 5));
  const sideWindowsPerFloor = Math.max(3, Math.floor(depth / 5));

  // ── Colors from primary language ──
  const category = inferCategory(user.primary_language);
  const colors = CATEGORY_COLORS[category];

  // ── Decorations: based on achievements and equipped items ──
  const decorations: BuildingDecoration[] = [];

  // Auto-decorations from stats
  if (user.total_stars >= 1000) {
    decorations.push({ type: "antenna" });
  }
  if (user.total_stars >= 10000) {
    decorations.push({ type: "antenna" });
  }

  // Equipped cosmetics
  for (const item of equippedItems) {
    const slot = item.slot as BuildingDecoration["type"];
    decorations.push({ type: slot, variant: item.slug });
  }

  return {
    height: Math.round(height),
    width,
    depth,
    floors,
    windowsPerFloor,
    sideWindowsPerFloor,
    litPercentage: Math.min(1, litPercentage),
    faceColor: colors.face,
    roofColor: colors.roof,
    windowLitColors: colors.windowLit,
    windowOffColor: colors.windowOff,
    decorations,
  };
}

// ── JSON export for API ─────────────────────────────────────

export function buildingParamsToJSON(params: BuildingParams) {
  return {
    height: params.height,
    width: params.width,
    depth: params.depth,
    floors: params.floors,
    windows: {
      perFloor: params.windowsPerFloor,
      sidePerFloor: params.sideWindowsPerFloor,
      litPercentage: params.litPercentage,
    },
    color: {
      face: params.faceColor,
      roof: params.roofColor,
      windowLit: params.windowLitColors,
      windowOff: params.windowOffColor,
    },
    decorations: params.decorations,
  };
}
