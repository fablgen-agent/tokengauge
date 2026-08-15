import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="TokenGauge home"><span className="brand-mark" aria-hidden="true">T</span>TokenGauge</Link>
      <nav aria-label="Main navigation">
        <Link href="/#rates">Rates</Link>
        <Link href="/#calculator">Calculator</Link>
        <Link href="/library">Methods</Link>
        <Link href="/lab">Lab</Link>
        <Link className="nav-cta" href="/#pricing" aria-label="Upgrade for £9 one time">Upgrade £9</Link>
      </nav>
    </header>
  );
}
