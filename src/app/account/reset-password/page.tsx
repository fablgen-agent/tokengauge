import type { Metadata } from "next";

import { PasswordResetForm } from "@/components/password-reset-form";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <div className="subpage account-page"><SiteHeader /><main className="section-pad centered-account"><PasswordResetForm token={token} /></main></div>;
}
