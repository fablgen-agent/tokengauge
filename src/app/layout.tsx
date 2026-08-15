import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
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
    default: "TokenGauge — Evidence-backed AI cost optimization",
    template: "%s · TokenGauge",
  },
  description: "Measure token costs, test optimization strategies, and pay for fewer wasted model calls.",
  applicationName: "TokenGauge",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "TokenGauge",
    title: "TokenGauge — Evidence-backed AI cost optimization",
    description: "Compare official model rates, test token-saving methods, and measure paired experiments without storing prompts or outputs.",
    images: [{ url: "/images/token-flow-workbench.webp", width: 1536, height: 1024, alt: "Token flow through a calibrated measurement workbench" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TokenGauge — Measure AI cost changes",
    description: "Official rate cards, evidence-backed methods, and controlled multi-provider A/B tests.",
    images: ["/images/token-flow-workbench.webp"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
