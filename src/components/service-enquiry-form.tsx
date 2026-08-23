"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import { serviceEnquiryCopy, type ServiceEnquiryKind } from "@/lib/service-enquiry";
import { funnelMeasurementDisabled } from "@/lib/funnel-preference";

export function ServiceEnquiryForm({ service }: { service: ServiceEnquiryKind }) {
  const copy = serviceEnquiryCopy[service];
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
      setMessage(error instanceof TypeError
        ? "The request could not be sent. Use the email link instead."
        : error instanceof Error
          ? error.message
          : "The request could not be sent. Use the email link instead.");
    }
  }

  return <form id="scope-request" className="service-enquiry-form" onSubmit={submit}>
    <div className="service-enquiry-heading"><span className="eyebrow eyebrow-lime">NO ACCOUNT REQUIRED</span><h2>Send the public scope here.</h2><p>The form emails the TokenGauge mailbox. It is not saved in the workbench database.</p></div>
    <div className="service-enquiry-fields">
      <label>Reply email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      <label>Public repository or product URL<input name="publicUrl" type="url" inputMode="url" placeholder="https://…" maxLength={500} required /></label>
      <label>{copy.stackLabel}<input name="stack" placeholder={copy.stackPlaceholder} maxLength={120} required /></label>
      <label>{copy.providerLabel}<input name="provider" placeholder={copy.providerPlaceholder} maxLength={120} required /></label>
      <label className="service-enquiry-wide">{copy.summaryLabel}<textarea name="summary" minLength={40} maxLength={2000} required placeholder={copy.summaryPlaceholder} /></label>
      <label className="service-enquiry-wide">Acceptance checks {!copy.acceptanceRequired ? <small>Optional</small> : null}<textarea name="acceptanceChecks" minLength={copy.acceptanceRequired ? 20 : undefined} maxLength={1000} required={copy.acceptanceRequired} placeholder={copy.acceptancePlaceholder} /></label>
      <label className="service-enquiry-wide">Preferred timing <small>Optional</small><input name="timing" maxLength={120} /></label>
      <label className="service-enquiry-trap" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
    </div>
    <p className="service-enquiry-privacy">Send only public context. Do not include credentials, private source, prompts, outputs, customer data, or payment details.</p>
    <div className="service-enquiry-submit"><button className="button button-lime" type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send scope request"}</button>{message ? <p className={status === "sent" ? "form-notice" : "form-error"} role="status">{message}</p> : null}</div>
  </form>;
}
