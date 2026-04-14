import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Family Quest",
    short_name: "FamilyQuest",
    description: "Family accountability app — goals, challenges, and real stakes.",
    start_url: "/feed",
    display: "standalone",
    background_color: "#FFFBF0",
    theme_color: "#6c31e3",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
