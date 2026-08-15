import "server-only";

import {
  createChatGPTHandler,
  type ChatGPTHandler,
  type RateLimitBucket,
  type StoredSession,
} from "@opencoredev/loginwithchatgpt-server";

import { SqliteKeyValueStore } from "@/lib/db";
import { getAppUrl, getLoginSecret } from "@/lib/env";

let singleton: ChatGPTHandler | undefined;

export function getChatGPTHandler(): ChatGPTHandler {
  if (singleton) return singleton;

  singleton = createChatGPTHandler({
    basePath: "/api/chatgpt",
    secret: getLoginSecret(),
    allowedOrigins: [getAppUrl()],
    sessionStore: new SqliteKeyValueStore<StoredSession>("chatgpt-session"),
    sessionTtlMs: 7 * 24 * 60 * 60 * 1000,
    cookie: {
      httpOnly: true,
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
    },
    dangerouslyAllowTokenExport: false,
    dangerouslyAllowRefreshTokenExport: false,
    responsesProxy: {
      allowedModels: (model) => /^[a-z0-9][a-z0-9._-]{1,100}$/i.test(model),
      maxRequestBytes: 64 * 1024,
      rateLimit: {
        limit: 10,
        windowMs: 60_000,
        store: new SqliteKeyValueStore<RateLimitBucket>("chatgpt-rate-limit"),
      },
    },
  });

  return singleton;
}
