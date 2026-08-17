import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { ApplicationProvider } from "@/providers/app/application-provider";

import "./globals.css";
import { JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});

export const metadata: Metadata = {
  title: {
    default: "Couple Space",
    template: "%s · Couple Space"
  },

  description:
    "A private realtime space designed for two people.",

  applicationName: "Couple Space",

  generator: "Next.js",

  referrer:
    "strict-origin-when-cross-origin",

  robots: {
    index: false,
    follow: false
  },

  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
  themeColor: "#09090b"
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({
  children
}: RootLayoutProps) {
  return (
    <html
      lang="en"
      suppressHydrationWarning className={cn("font-mono", jetbrainsMono.variable)}
    >
      <body>
        <ApplicationProvider>
          {children}
        </ApplicationProvider>
      </body>
    </html>
  );
}