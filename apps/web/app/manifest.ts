import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Couple Space",
    short_name: "Couple Space",
    description:
      "A private realtime space designed for two people.",

    start_url: "/",

    display: "standalone",

    orientation: "portrait",

    background_color: "#09090b",

    theme_color: "#09090b",

    categories: [
      "lifestyle",
      "social"
    ],

    lang: "en",

    dir: "ltr",

    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}