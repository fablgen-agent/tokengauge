import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import { AccountPanel } from "@/components/account-panel";
import { MethodDashboard } from "@/components/method-dashboard";
import { SiteHeader } from "@/components/site-header";
import { getOwnerAccountContext } from "@/lib/access";
import { tokenTips } from "@/lib/catalog";
import { experimentSummaries, methodProgress } from "@/lib/db";
import { planAtLeast, planDefinition } from "@/lib/plans";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const request = new Request("http://tokengauge.internal/dashboard", { headers: await headers() });
  const account = await getOwnerAccountContext(request);
  if (!account) return <div className="subpage"><SiteHeader /><main><section className="subpage-hero section-pad"><span className="eyebrow eyebrow-lime">DASHBOARD</span><h1>Your measured workbench.</h1><p>Sign in to keep experiment totals and an optional method queue under your TokenGauge identity.</p></section><section className="gate-card"><AccountPanel /></section></main></div>;

  const experimentLimit = account.accessPlan === "ultimate" ? 1_000 : planAtLeast(account.accessPlan, "pro_plus") ? 250 : 100;
  const experiments = experimentSummaries(account.accountId, experimentLimit);
  const progress = methodProgress(account.accountId);
  const baselineTokens = experiments.reduce((total, experiment) => total + experiment.baselineTotal, 0);
  const candidateTokens = experiments.reduce((total, experiment) => total + experiment.optimizedTotal, 0);
  const delta = baselineTokens - candidateTokens;
  const reduction = baselineTokens > 0 ? delta / baselineTokens * 100 : 0;
  const adopted = Object.values(progress).filter((status) => status === "adopted").length;
  const plan = planDefinition(account.accessPlan);

  return <div className="subpage dashboard-page"><SiteHeader /><main><section className="subpage-hero section-pad dashboard-hero"><div><span className="eyebrow eyebrow-lime">MEASURED DASHBOARD</span><h1>What the paired tests observed.</h1><p>This reports token differences inside TokenGauge experiments. It is not a production-usage meter, API invoice, or guaranteed saving.</p></div><div className="plan-stamp"><span>Current plan</span><strong>{plan.name}</strong><Link href="/#pricing">Compare access</Link></div></section><section className="section-pad dashboard-body"><div className="dashboard-stats"><article><span>Paired tests</span><strong>{experiments.length}</strong><small>two requests per test</small></article><article><span>Baseline tokens</span><strong>{baselineTokens.toLocaleString()}</strong><small>measured arms only</small></article><article><span>Candidate delta</span><strong className={delta >= 0 ? "positive" : "negative"}>{delta >= 0 ? "−" : "+"}{Math.abs(delta).toLocaleString()}</strong><small>{reduction >= 0 ? reduction.toFixed(1) : `+${Math.abs(reduction).toFixed(1)}`}% vs baseline</small></article><article><span>Methods adopted</span><strong>{adopted}</strong><small>self-reported status</small></article></div><div className="dashboard-actions"><Link className="button button-lime" href="/lab">Run another paired test</Link>{planAtLeast(account.accessPlan, "pro_plus") ? <a className="button button-dark" href="/api/dashboard/export">Export experiment CSV</a> : <Link className="button button-dark" href="/#pricing">Unlock CSV with Pro+</Link>}<Link className="text-link" href="/settings">Manage providers <span>→</span></Link></div><section className="experiment-ledger"><div className="settings-intro"><div><span className="eyebrow">RECENT EXPERIMENTS</span><h2>Metadata, not prompt contents.</h2></div><p>Negative deltas mean the candidate used fewer tokens. Quality still decides whether the candidate should ship.</p></div>{experiments.length ? <div className="experiment-table-wrap"><table><thead><tr><th>Date</th><th>Provider</th><th>Model</th><th>Strategy</th><th>Baseline</th><th>Candidate</th><th>Delta</th></tr></thead><tbody>{experiments.map((experiment) => <tr key={experiment.id}><td>{new Date(experiment.createdAt).toLocaleDateString("en-GB", { timeZone: "UTC" })}</td><td>{experiment.providerId}</td><td>{experiment.model}</td><td>{experiment.strategyId}</td><td>{experiment.baselineTotal}</td><td>{experiment.optimizedTotal}</td><td className={experiment.tokenDelta >= 0 ? "positive" : "negative"}>{experiment.tokenDelta >= 0 ? "−" : "+"}{Math.abs(experiment.tokenDelta)}</td></tr>)}</tbody></table></div> : <div className="empty-dashboard"><h3>No paired tests yet.</h3><p>Run the same task through a baseline and candidate to create the first measured record.</p><Link className="button button-dark" href="/lab">Open the lab</Link></div>}</section><MethodDashboard methods={tokenTips.map((tip) => ({ id: tip.id, title: tip.title, category: tip.category, access: tip.access, status: progress[tip.id] }))} /></section></main></div>;
}
