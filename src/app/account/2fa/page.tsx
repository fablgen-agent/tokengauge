import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { TwoFactorChallenge } from "@/components/two-factor-challenge";

export const metadata: Metadata = { title: "Two-factor verification" };

export default function TwoFactorPage() {
  return <div className="subpage account-page"><SiteHeader /><main className="section-pad centered-account"><TwoFactorChallenge /></main></div>;
}
