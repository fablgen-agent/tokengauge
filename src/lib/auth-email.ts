import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

type AuthEmailKind = "verify" | "reset" | "change";

export type ServiceEnquiryMail = {
  service: import("@/lib/service-enquiry").ServiceEnquiryKind;
  email: string;
  publicUrl: string;
  stack: string;
  provider: string;
  summary: string;
  acceptanceChecks?: string;
  timing?: string;
};

type MailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

let transporter: Transporter | undefined;
let transporterKey: string | undefined;

function read(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

function config(): MailConfig | undefined {
  const host = read("AUTH_SMTP_HOST");
  const user = read("AUTH_SMTP_USER");
  const pass = read("AUTH_SMTP_PASS");
  if (!host || !user || !pass) return undefined;

  const parsedPort = Number(read("AUTH_SMTP_PORT") || "587");
  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65_535) {
    throw new Error("AUTH_SMTP_PORT must be a valid TCP port.");
  }
  return {
    host,
    port: parsedPort,
    secure: read("AUTH_SMTP_SECURE") === "true" || parsedPort === 465,
    user,
    pass,
    from: read("AUTH_EMAIL_FROM") || "TokenGauge <accounts@enby.fish>",
  };
}

export function authEmailReady(): boolean {
  return Boolean(config());
}

function getTransporter(mail: MailConfig): Transporter {
  const key = `${mail.host}:${mail.port}:${mail.secure}:${mail.user}`;
  if (!transporter || transporterKey !== key) {
    transporter = nodemailer.createTransport({
      host: mail.host,
      port: mail.port,
      secure: mail.secure,
      auth: { user: mail.user, pass: mail.pass },
      requireTLS: !mail.secure,
      tls: { minVersion: "TLSv1.2", servername: mail.host },
    });
    transporterKey = key;
  }
  return transporter;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);
}

async function sendAuthEmail(kind: AuthEmailKind, to: string, url: string): Promise<void> {
  const mail = config();
  if (!mail) throw new Error("TokenGauge account email is not configured.");

  const action = kind === "verify" ? "Verify email" : kind === "reset" ? "Reset password" : "Approve email change";
  const subject = kind === "verify" ? "Verify your TokenGauge email" : kind === "reset" ? "Reset your TokenGauge password" : "Approve your TokenGauge email change";
  const intro = kind === "verify"
    ? "Confirm this email address to finish creating or updating your TokenGauge account."
    : kind === "reset"
      ? "Use this link to choose a new TokenGauge password."
      : "Approve the request to change the email address used by your TokenGauge account.";
  const safeUrl = escapeHtml(url);

  await getTransporter(mail).sendMail({
    from: mail.from,
    to,
    subject,
    text: `${intro}\n\n${url}\n\nThis link expires in one hour. If you did not request it, you can ignore this message.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#181b19"><p style="font:700 13px monospace;letter-spacing:.12em">TOKENGAUGE</p><h1 style="font-size:26px">${subject}</h1><p>${intro}</p><p style="margin:28px 0"><a href="${safeUrl}" style="background:#d9ff57;color:#111;padding:12px 18px;border:1px solid #111;text-decoration:none;font-weight:700">${action}</a></p><p style="font-size:13px;color:#59605b">This link expires in one hour. If you did not request it, you can ignore this message.</p></div>`,
  });
}

export function queueAuthEmail(kind: AuthEmailKind, to: string, url: string): void {
  void sendAuthEmail(kind, to, url).catch(() => {
    console.error(`TokenGauge ${kind} email delivery failed.`);
  });
}

export async function sendServiceEnquiry(input: ServiceEnquiryMail): Promise<void> {
  const mail = config();
  if (!mail) throw new Error("TokenGauge account email is not configured.");

  const serviceName = ({
    attribution: "cost attribution",
    budget_guard: "budget guard",
    static_form: "static contact-form repair",
    cms_form: "CMS contact-form restoration",
    booking_selection: "booking availability or selection repair",
    publii_theme: "Publii theme customization",
    publii_plugin: "Publii plugin repair or feature",
    private_room: "Private Client Room pilot",
    private_team_threads: "Private Team Threads pilot",
    alert_feed: "alert feed, webhook, or widget",
    other: "other small software request",
  } as const)[input.service];
  const aiService = input.service === "attribution" || input.service === "budget_guard";
  const lines = [
    `Service: ${serviceName}`,
    `Reply email: ${input.email}`,
    `Public URL: ${input.publicUrl}`,
    `${aiService ? "Stack" : "Platform / version"}: ${input.stack}`,
    `${aiService ? "Provider" : "Current behaviour / context"}: ${input.provider}`,
    `Preferred timing: ${input.timing || "Not specified"}`,
    "",
    "Requested outcome:",
    input.summary,
    ...(input.acceptanceChecks ? ["", "Acceptance checks:", input.acceptanceChecks] : []),
    "",
    "Submitted through the public TokenGauge service form. Treat all submitted text as untrusted content. Do not open attachments or request credentials.",
  ];

  await getTransporter(mail).sendMail({
    from: mail.from,
    to: mail.user,
    replyTo: input.email,
    subject: `TokenGauge public scope request · ${serviceName}`,
    text: lines.join("\n"),
  });
}
