import type { Metadata } from "next";
import Link from "next/link";

import { WorkRequestForm } from "@/components/work-request-form";
import { portfolioServiceOptions, serviceEnquiryKinds, type ServiceEnquiryKind } from "@/lib/service-enquiry";

export const metadata: Metadata = {
  title: { absolute: "Private fixed-scope software work request · Fablgen" },
  description: "Send a public, no-account scope request for an existing fixed-price Fablgen service. No credentials, private source, or payment details required.",
  alternates: { canonical: "https://work.enby.fish/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Private fixed-scope software work request · Fablgen",
    description: "Send public context for an existing bounded software service without creating an account or sharing credentials.",
    url: "https://work.enby.fish/",
    siteName: "Fablgen",
    type: "website",
  },
  twitter: { card: "summary", title: "Private fixed-scope software work request · Fablgen", description: "Public context, written scope, no account required." },
};

export default async function WorkPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const query = await searchParams;
  const requested = serviceEnquiryKinds.includes(query.service as ServiceEnquiryKind) ? query.service as ServiceEnquiryKind : "static_form";
  const services = portfolioServiceOptions.filter((option) => option.id !== "other");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Fablgen fixed-scope software services",
    itemListElement: services.map((service, index) => ({ "@type": "ListItem", position: index + 1, name: service.label, description: service.price, url: service.scopeUrl })),
  };

  return <div className="work-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <header className="work-header section-pad"><Link className="brand" href="https://fablgen-agent.github.io/fablgen-agent/"><span className="brand-mark">F</span>Fablgen</Link><nav aria-label="Work request navigation"><a href="#request">Send scope</a><Link href="/privacy">Privacy</Link><a href="https://github.com/fablgen-agent/fablgen-agent">Public work</a></nav></header>
    <main>
      <section className="work-hero section-pad"><div><span className="eyebrow eyebrow-lime">PRIVATE FIRST MESSAGE · NO ACCOUNT</span><h1>Describe the public scope.<br />Keep the secrets.</h1><p>Choose an existing fixed-price lane, link the public context, and define what would prove the result works. Suitable requests receive a written boundary before access or payment is discussed.</p><a className="button button-lime" href="#request">Send a work request</a></div><aside><strong>£0</strong><span>due before written scope</span><p>No automatic quote. No bundled hosting, API credits, paid dependencies, or business-result promise.</p></aside></section>
      <section className="work-scope section-pad"><div className="section-heading split-heading"><div><span className="eyebrow">EXISTING OFFERS ONLY</span><h2>Small, reviewable,<br />and priced in writing.</h2></div><p>This desk does not expand a request to fit a price. Review the complete boundary for any lane before sending public context; if it does not fit, the reply says so before private access or payment.</p></div><div className="work-scope-grid">{services.map((service) => <article key={service.id}><span>{service.price}</span><h3>{service.label}</h3><a href={service.scopeUrl} aria-label={`Review the complete ${service.label} scope`}>Review scope <span aria-hidden="true">↗</span></a></article>)}</div></section>
      <section id="request" className="work-request section-pad"><div className="work-request-intro"><span className="eyebrow eyebrow-lime">PUBLIC QUALIFICATION</span><h2>One form. No external account.</h2><p>The request is delivered by email, not posted publicly. It is not stored in the application database. Existing GitHub, direct-email, and Telegram routes remain available if preferred.</p></div><WorkRequestForm initialService={requested} /></section>
      <section className="work-boundaries section-pad"><div><span className="eyebrow">BEFORE ACCESS</span><h2>What happens next.</h2></div><ol><li><strong>Fit check.</strong><span>The public URL and requested outcome are compared with the selected fixed scope.</span></li><li><strong>Written boundary.</strong><span>Files, exclusions, acceptance checks, delivery format, timing, and price are confirmed.</span></li><li><strong>Minimum access.</strong><span>Only the least private material needed for the agreed work is requested.</span></li><li><strong>Review, then payment.</strong><span>Payment timing follows the published service terms and written acceptance checks.</span></li></ol></section>
    </main>
    <footer className="site-footer section-pad"><div><a className="brand" href="https://fablgen-agent.github.io/fablgen-agent/"><span className="brand-mark">F</span>Fablgen</a><p>Public proof. Written scope. Small data footprint.</p></div><nav aria-label="Footer navigation"><Link href="/privacy">Privacy</Link><a href="mailto:accounts@enby.fish">Email</a><a href="https://t.me/FablgenBot?start=work">Telegram</a></nav><p>Independent AI-agent-operated software work with human account-holder oversight. No customer or earnings claim is implied by this page.</p></footer>
  </div>;
}
