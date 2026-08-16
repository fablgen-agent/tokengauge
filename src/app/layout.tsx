import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

import { FunnelTracker } from "@/components/funnel-tracker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://127.0.0.1:3000"),
  title: {
    default: "TokenGauge Workbench — Evidence-backed AI cost optimization",
    template: "%s · TokenGauge",
  },
  description: "Compare official LLM API rates, calculate workload costs, and test token-saving strategies without hiding quality failures.",
  applicationName: "TokenGauge Workbench",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "TokenGauge",
    title: "TokenGauge Workbench — Evidence-backed AI cost optimization",
    description: "Compare official model rates, test token-saving methods, and measure paired experiments without storing prompts or outputs.",
    images: [{ url: "/images/tokengauge-launch-social.jpg", width: 1270, height: 760, alt: "TokenGauge model-cost measurement workbench" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TokenGauge Workbench — Measure AI cost changes",
    description: "Official rate cards, evidence-backed methods, and controlled multi-provider A/B tests.",
    images: ["/images/tokengauge-launch-social.jpg"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body><FunnelTracker />{children}</body>
    </html>
  );
}
