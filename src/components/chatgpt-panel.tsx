"use client";

import { LoginWithChatGPT } from "@opencoredev/loginwithchatgpt-react";

export function ChatGPTPanel({ compact = false, purpose = "connection" }: { compact?: boolean; purpose?: "connection" | "sign-in" }) {
  const signIn = purpose === "sign-in";
  return (
    <div className={`account-panel chatgpt-panel ${compact ? "compact" : ""}`}>
      <LoginWithChatGPT
        label={signIn ? "Continue with ChatGPT" : "Connect ChatGPT"}
        consent={{ appName: "TokenGauge", continueLabel: signIn ? "Continue to TokenGauge" : "Connect my ChatGPT plan", securityHref: "/privacy" }}
        onAuthenticated={() => window.location.reload()}
      />
      {!compact ? <p className="account-explainer">{signIn ? "Use your ChatGPT identity for TokenGauge access and billing. Lab requests use the connection only when you explicitly run a test." : "This connection powers only the lab requests you explicitly run. TokenGauge purchases remain separate."}</p> : null}
    </div>
  );
}
