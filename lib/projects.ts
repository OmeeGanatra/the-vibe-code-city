export type ProjectCategory =
  | "tool"
  | "game"
  | "app"
  | "agent"
  | "api"
  | "website"
  | "other";

export interface Project {
  id: string;
  name: string;
  description: string;
  url: string;
  builderName: string;
  builderTwitter?: string;
  githubUrl?: string;
  category: ProjectCategory;
  tags: string[];
  submittedAt: string;
  upvotes: number;
  featured?: boolean;
}

export interface CityBuilding {
  id: string;
  name: string;
  position: [number, number, number];
  width: number;
  depth: number;
  height: number;
  floors: number;
  windowsPerFloor: number;
  sideWindowsPerFloor: number;
  litPercentage: number;
  category: ProjectCategory;
  faceColor: string;
  roofColor: string;
  windowLitColors: string[];
  windowOffColor: string;
  project: Project;
}

export const CATEGORY_COLORS: Record<
  ProjectCategory,
  { face: string; roof: string; windowLit: string[]; windowOff: string }
> = {
  tool:    { face: "#1a1228", roof: "#2e1f3a", windowLit: ["#ff6b35", "#ff8c5a", "#ffa07a"], windowOff: "#0d0608" },
  game:    { face: "#0d1f0d", roof: "#1a3a1a", windowLit: ["#7fff6b", "#a0ff80", "#50e040"], windowOff: "#050e05" },
  app:     { face: "#0d1a2e", roof: "#1a2e4a", windowLit: ["#ffd166", "#ffe29a", "#ffb830"], windowOff: "#060810" },
  agent:   { face: "#1a0d28", roof: "#2e1a40", windowLit: ["#c77dff", "#b39ddb", "#a060ff"], windowOff: "#0a0614" },
  api:     { face: "#0d1a1a", roof: "#1a2e2e", windowLit: ["#06d6a0", "#00f5d4", "#20c0a0"], windowOff: "#040d0d" },
  website: { face: "#1a1505", roof: "#2e2a0a", windowLit: ["#f4d35e", "#ffe168", "#e0c030"], windowOff: "#0a0b02" },
  other:   { face: "#101428", roof: "#1e2440", windowLit: ["#8ecae6", "#a8dadc", "#70b8d8"], windowOff: "#080a14" },
};
