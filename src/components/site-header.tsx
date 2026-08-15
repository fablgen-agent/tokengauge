import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="TokenGauge home"><span className="brand-mark" aria-hidden="true">T</span>TokenGauge</Link>
      <nav aria-label="Main navigation">
        <Link href="/#calculator">Calculator</Link>
        <Link href="/library">Library</Link>
        <Link href="/lab">A/B Lab</Link>
        <Link className="nav-cta" href="/#pricing">Get access</Link>
      </nav>
    </header>
  );
}
