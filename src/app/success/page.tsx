import type { Metadata } from "next";

import { CheckoutVerifier } from "@/components/checkout-verifier";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Payment confirmation" };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { session_id: sessionId } = await searchParams;
  return <div className="subpage success-page"><SiteHeader /><main><CheckoutVerifier sessionId={typeof sessionId === "string" ? sessionId : undefined} /></main></div>;
}
