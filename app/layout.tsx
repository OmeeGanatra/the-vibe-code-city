import type { Metadata } from "next";
import "./globals.css";
import FirebaseAnalytics from "@/components/FirebaseAnalytics";

export const metadata: Metadata = {
  title: "The Vibe Code City — Where Vibe Coders Build",
  description:
    "A 3D pixel art city where every building is a project built with Claude. Explore the community, discover what people are shipping, and add your own.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_URL ?? "https://thevibecodecity-73598.web.app"
  ),
  openGraph: {
    title: "The Vibe Code City",
    description: "A 3D pixel art city of Claude-built projects. Browse the community, hire vibe coders, post jobs.",
    type: "website",
    siteName: "Vibe Code City",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Vibe Code City",
    description: "A 3D pixel art city of Claude-built projects",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <FirebaseAnalytics />
        {children}
      </body>
    </html>
  );
}
