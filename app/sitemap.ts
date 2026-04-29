import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_URL ?? "https://thevibecodecity-73598.web.app";
  return [
    { url: base,              changeFrequency: "hourly",  priority: 1.0 },
    { url: `${base}/hire`,    changeFrequency: "hourly",  priority: 0.9 },
    { url: `${base}/jobs`,    changeFrequency: "hourly",  priority: 0.9 },
    { url: `${base}/jobs/post`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/leaderboard`, changeFrequency: "daily",  priority: 0.8 },
    { url: `${base}/submit`,  changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/shop`,    changeFrequency: "weekly",  priority: 0.5 },
  ];
}
