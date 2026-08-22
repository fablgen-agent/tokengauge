"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function CheckoutVerifier({ sessionId }: { sessionId?: string }) {
  const [status, setStatus] = useState<"checking" | "ready" | "error">(sessionId ? "checking" : "error");
  const [message, setMessage] = useState(sessionId ? "Confirming your payment with Stripe…" : "The checkout reference is missing.");
  const [verificationAttempt, setVerificationAttempt] = useState(0);

  useEffect(() => {
    if (!sessionId) return;
    const controller = new AbortController();

    void (async () => {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const response = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
          signal: controller.signal,
        });
        const data = (await response.json()) as { fulfilled?: boolean; plan?: string; reason?: string; error?: string };
        if (response.ok && data.fulfilled) {
          setStatus("ready");
          const label = data.plan === "ultimate" ? "Ultimate" : data.plan === "pro_plus" ? "Pro+" : "Pro";
          setMessage(`Your ${label} access is active.`);
          return;
        }
        if (response.status !== 409 || attempt === 7) {
          throw new Error(data.reason || data.error || "Payment is not ready yet.");
        }
        setMessage(`Stripe is still finalising the payment… (${attempt + 2}/8)`);
        await new Promise<void>((resolve) => window.setTimeout(resolve, 1_500));
      }
    })().catch((cause) => {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setStatus("error");
      setMessage(cause instanceof Error ? cause.message : "We could not confirm the payment.");
    });

    return () => controller.abort();
  }, [sessionId, verificationAttempt]);

  function retryVerification() {
    setStatus("checking");
    setMessage("Confirming your payment with Stripe…");
    setVerificationAttempt((attempt) => attempt + 1);
  }

  return (
    <div className={`success-card status-${status}`}>
      <span className="success-mark" aria-hidden="true">{status === "checking" ? "…" : status === "ready" ? "✓" : "!"}</span>
      <h1>{status === "ready" ? "You’re in." : status === "checking" ? "One moment." : "Not confirmed yet."}</h1>
      <p>{message}</p>
      {status === "ready" ? <Link className="button button-lime" href="/dashboard">Open your dashboard</Link> : status === "error" && sessionId ? <div className="security-actions"><button className="button button-lime" type="button" onClick={retryVerification}>Check payment again</button><Link className="button button-dark" href="/">Return home</Link></div> : <Link className="button button-dark" href="/">Return home</Link>}
    </div>
  );
}
