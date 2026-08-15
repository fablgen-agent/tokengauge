"use client";

import { LoginWithChatGPT } from "@opencoredev/loginwithchatgpt-react";

export function ChatGPTPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`account-panel chatgpt-panel ${compact ? "compact" : ""}`}>
      <LoginWithChatGPT
        label="Connect ChatGPT"
        consent={{ appName: "TokenGauge", continueLabel: "Connect my ChatGPT plan", securityHref: "/privacy" }}
        onAuthenticated={() => window.location.reload()}
      />
      {!compact ? <p className="account-explainer">This connection is only for lab requests on your ChatGPT plan. TokenGauge account ownership and billing remain separate.</p> : null}
    </div>
  );
}
