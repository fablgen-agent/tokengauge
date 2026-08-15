"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function CheckoutVerifier({ sessionId }: { sessionId?: string }) {
  const [status, setStatus] = useState<"checking" | "ready" | "error">(sessionId ? "checking" : "error");
  const [message, setMessage] = useState(sessionId ? "Confirming your payment with Stripe…" : "The checkout reference is missing.");

  useEffect(() => {
    if (!sessionId) {
      return;
    }
    void fetch("/api/checkout/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).then(async (response) => {
      const data = (await response.json()) as { fulfilled?: boolean; reason?: string; error?: string };
      if (!response.ok || !data.fulfilled) throw new Error(data.reason || data.error || "Payment is not ready yet.");
      setStatus("ready");
      setMessage("Your Pro access is active.");
    }).catch((cause) => {
      setStatus("error");
      setMessage(cause instanceof Error ? cause.message : "We could not confirm the payment.");
    });
  }, [sessionId]);

  return (
    <div className={`success-card status-${status}`}>
      <span className="success-mark" aria-hidden="true">{status === "checking" ? "…" : status === "ready" ? "✓" : "!"}</span>
      <h1>{status === "ready" ? "You’re in." : status === "checking" ? "One moment." : "Not confirmed yet."}</h1>
      <p>{message}</p>
      {status === "ready" ? <Link className="button button-lime" href="/library">Open the full library</Link> : <Link className="button button-dark" href="/">Return home</Link>}
    </div>
  );
}
