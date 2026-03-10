import type { Project, CityBuilding } from "./projects";
import { CATEGORY_COLORS } from "./projects";
import { hashStr, seededRandom } from "./utils";

const SLOT_W = 45;
const SLOT_D = 38;
const ROAD_W = 12;
const MIN_HEIGHT = 40;
const MAX_HEIGHT = 350;

function spiralCoord(index: number): [number, number] {
  if (index === 0) return [0, 0];
  let x = 0, y = 0, dx = 1, dy = 0;
  let segLen = 1, segPassed = 0, turns = 0;
  for (let i = 0; i < index; i++) {
    x += dx; y += dy; segPassed++;
    if (segPassed === segLen) {
      segPassed = 0;
      const tmp = dx; dx = -dy; dy = tmp;
      turns++;
      if (turns % 2 === 0) segLen++;
    }
  }
  return [x, y];
}

export function generateCityLayout(projects: Project[]): CityBuilding[] {
  const sorted = [...projects].sort((a, b) => {
    if (b.upvotes !== a.upvotes) return b.upvotes - a.upvotes;
    return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
  });

  const maxUpvotes = Math.max(...sorted.map(p => p.upvotes), 1);

  return sorted.map((project, index) => {
    const [gx, gz] = spiralCoord(index);
    const posX = gx * (SLOT_W + ROAD_W);
    const posZ = gz * (SLOT_D + ROAD_W);

    // Height from upvotes (power curve to give even lowest projects dignity)
    const normalized = Math.min(project.upvotes / maxUpvotes, 1);
    const height = MIN_HEIGHT + Math.pow(normalized, 0.55) * (MAX_HEIGHT - MIN_HEIGHT);

    // Width/depth seeded from project id
    const seed = hashStr(project.id);
    const width = 18 + seededRandom(seed) * 14;
    const depth = 14 + seededRandom(seed + 99) * 12;

    // Lit percentage from recency (exponential decay, half-life ~30 days)
    const daysSince = (Date.now() - new Date(project.submittedAt).getTime()) / 86400000;
    const recencyScore = Math.exp(-daysSince / 30);
    const litPercentage = 0.15 + recencyScore * 0.75;

    const floorHeight = 7;
    const floors = Math.max(3, Math.floor(height / floorHeight));
    const windowsPerFloor = Math.max(2, Math.floor(width / 5));
    const sideWindowsPerFloor = Math.max(1, Math.floor(depth / 5));

    const colors = CATEGORY_COLORS[project.category];

    return {
      id: project.id,
      name: project.name,
      position: [posX, 0, posZ],
      width: Math.round(width),
      depth: Math.round(depth),
      height: Math.round(height),
      floors,
      windowsPerFloor,
      sideWindowsPerFloor,
      litPercentage,
      category: project.category,
      faceColor: colors.face,
      roofColor: colors.roof,
      windowLitColors: colors.windowLit,
      windowOffColor: colors.windowOff,
      project,
    };
  });
}
