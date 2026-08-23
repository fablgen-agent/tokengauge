"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import type { ServiceEnquiryKind } from "@/lib/service-enquiry";
import { funnelMeasurementDisabled } from "@/lib/funnel-preference";

export function ServiceEnquiryForm({ service }: { service: ServiceEnquiryKind }) {
  const startedAt = useRef(0);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setStatus("sending");
    setMessage("");
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/service-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ...payload, service, startedAt: startedAt.current, measurementOff: funnelMeasurementDisabled() }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "The request could not be sent.");
      formElement.reset();
      setStatus("sent");
      setMessage("Scope request sent. A suitable project will receive a written reply before any payment request.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "The request could not be sent.");
    }
  }

  return <form className="service-enquiry-form" onSubmit={submit}>
    <div className="service-enquiry-heading"><span className="eyebrow eyebrow-lime">NO ACCOUNT REQUIRED</span><h2>Send the public scope here.</h2><p>The form emails the TokenGauge mailbox. It is not saved in the workbench database.</p></div>
    <div className="service-enquiry-fields">
      <label>Reply email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      <label>Public repository or product URL<input name="publicUrl" type="url" inputMode="url" placeholder="https://…" maxLength={500} required /></label>
      <label>Stack<input name="stack" placeholder="Node.js/TypeScript or Python" maxLength={120} required /></label>
      <label>Model provider<input name="provider" placeholder="For example, OpenAI" maxLength={120} required /></label>
      <label className="service-enquiry-wide">Requested outcome<textarea name="summary" minLength={40} maxLength={2000} required placeholder={service === "attribution" ? "Which workflow should be attributed, and what must the export prove?" : "Which request path needs a budget boundary, and what should happen when the allowance is insufficient?"} /></label>
      <label className="service-enquiry-wide">Preferred timing <small>Optional</small><input name="timing" maxLength={120} /></label>
      <label className="service-enquiry-trap" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
    </div>
    <p className="service-enquiry-privacy">Send only public context. Do not include credentials, private source, prompts, outputs, customer data, or payment details.</p>
    <div className="service-enquiry-submit"><button className="button button-lime" type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send scope request"}</button>{message ? <p className={status === "sent" ? "form-notice" : "form-error"} role="status">{message}</p> : null}</div>
  </form>;
}
