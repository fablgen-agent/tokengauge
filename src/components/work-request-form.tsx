"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import { funnelMeasurementDisabled } from "@/lib/funnel-preference";
import { portfolioServiceOptions, serviceEnquiryCopy, type ServiceEnquiryKind } from "@/lib/service-enquiry";

export function WorkRequestForm({ initialService }: { initialService: ServiceEnquiryKind }) {
  const startedAt = useRef(0);
  const [selectedService, setSelectedService] = useState(initialService);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const copy = serviceEnquiryCopy[selectedService];

  useEffect(() => { startedAt.current = Date.now(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const payload = Object.fromEntries(new FormData(formElement).entries());
    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/service-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ...payload, startedAt: startedAt.current, measurementOff: funnelMeasurementDisabled() }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "The request could not be sent.");
      formElement.reset();
      setStatus("sent");
      setMessage("Request sent. A suitable project will receive a written scope before any payment request.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof TypeError
        ? "The request could not be sent. Use the email link instead."
        : error instanceof Error
          ? error.message
          : "The request could not be sent. Use the email link instead.");
    }
  }

  return <form className="work-request-form" onSubmit={submit}>
    <div className="work-request-fields">
      <label>Requested scope<select name="service" value={selectedService} onChange={(event) => setSelectedService(event.target.value as ServiceEnquiryKind)} required>{portfolioServiceOptions.map((option) => <option value={option.id} key={option.id}>{option.label} · {option.price}</option>)}</select></label>
      <label>Reply email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      <label className="work-request-wide">Public repository, site, or product URL<input name="publicUrl" type="url" inputMode="url" placeholder="https://…" maxLength={500} required /></label>
      <label>{copy.stackLabel}<input name="stack" placeholder={copy.stackPlaceholder} maxLength={120} required /></label>
      <label>{copy.providerLabel}<input name="provider" placeholder={copy.providerPlaceholder} maxLength={120} required /></label>
      <label className="work-request-wide">{copy.summaryLabel}<textarea name="summary" minLength={40} maxLength={2000} required placeholder={copy.summaryPlaceholder} /></label>
      <label className="work-request-wide">Acceptance checks<textarea name="acceptanceChecks" minLength={20} maxLength={1000} required placeholder={copy.acceptancePlaceholder.replace(/^Optional: /, "")} /></label>
      <label className="work-request-wide">Preferred timing <small>Optional</small><input name="timing" maxLength={120} /></label>
      <label className="service-enquiry-trap" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
    </div>
    <p className="work-request-privacy">Public context only. Do not send passwords, tokens, private source, customer data, unpublished content, recovery material, payment details, or security findings. Submissions go to the Fablgen mailbox and are not stored in the workbench database.</p>
    <div className="work-request-submit"><button className="button button-lime" type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send public scope"}</button>{message ? <p className={status === "sent" ? "form-notice" : "form-error"} role="status">{message}</p> : null}</div>
  </form>;
}
