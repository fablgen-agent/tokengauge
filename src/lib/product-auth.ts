import "server-only";

import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import { createHmac } from "node:crypto";

import { authEmailReady, queueAuthEmail } from "@/lib/auth-email";
import { anonymizeDeletedProductAccount, getDatabase, upsertUser } from "@/lib/db";
import { getAppUrl, getProductAuthSecret } from "@/lib/env";

let singleton: ReturnType<typeof createProductAuth> | undefined;

export function productAccountId(userId: string): string {
  return `product_${userId}`;
}

function createProductAuth() {
  const appUrl = getAppUrl();
  const canSendEmail = authEmailReady();
  return betterAuth({
    appName: "TokenGauge",
    baseURL: appUrl,
    basePath: "/api/auth",
    secret: getProductAuthSecret(),
    database: getDatabase(),
    trustedOrigins: [appUrl],
    emailAndPassword: {
      enabled: true,
      disableSignUp: !canSendEmail,
      requireEmailVerification: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      resetPasswordTokenExpiresIn: 60 * 60,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => queueAuthEmail("reset", user.email, url),
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      expiresIn: 60 * 60,
      sendVerificationEmail: async ({ user, url }) => queueAuthEmail("verify", user.email, url),
    },
    user: {
      changeEmail: {
        enabled: true,
        sendChangeEmailConfirmation: async ({ user, url }) => queueAuthEmail("change", user.email, url),
      },
      deleteUser: {
        enabled: true,
        afterDelete: async (user) => {
          anonymizeDeletedProductAccount(productAccountId(user.id));
        },
      },
    },
    session: {
      expiresIn: 7 * 24 * 60 * 60,
      updateAge: 24 * 60 * 60,
      freshAge: 10 * 60,
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 100,
    },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production",
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
    },
    plugins: [twoFactor({
      issuer: "TokenGauge",
      twoFactorCookieMaxAge: 10 * 60,
      trustDeviceMaxAge: 30 * 24 * 60 * 60,
      backupCodeOptions: { amount: 10, length: 10 },
      accountLockout: { enabled: true, maxFailedAttempts: 8, durationSeconds: 15 * 60 },
    })],
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            const accountId = productAccountId(user.id);
            upsertUser({
              accountId,
              billingUserId: billingIdForProductUser(user.id),
              name: user.name,
              email: user.email,
            });
          },
        },
        update: {
          after: async (user) => {
            const accountId = productAccountId(user.id);
            upsertUser({
              accountId,
              billingUserId: billingIdForProductUser(user.id),
              name: user.name,
              email: user.email,
            });
          },
        },
      },
    },
    telemetry: { enabled: false },
  });
}

export function getProductAuth(): ReturnType<typeof createProductAuth> {
  if (singleton) return singleton;
  singleton = createProductAuth();
  return singleton;
}

export function billingIdForProductUser(userId: string): string {
  return `tg_${createHmac("sha256", getProductAuthSecret()).update(productAccountId(userId)).digest("hex")}`;
}

export type ProductAuth = ReturnType<typeof getProductAuth>;
