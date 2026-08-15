import "server-only";

import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

import {
  deleteProviderConnectionRecord,
  listProviderConnectionRecords,
  providerConnectionRecord,
  saveProviderConnectionRecord,
} from "@/lib/db";
import { getProductAuthSecret } from "@/lib/env";
import { providerConfiguration, type ProviderId } from "@/lib/providers";

function vaultKey(accountId: string): Buffer {
  return createHmac("sha256", getProductAuthSecret())
    .update(`tokengauge-provider-vault-v1:${accountId}`)
    .digest();
}

function aad(accountId: string, providerId: ProviderId): Buffer {
  return Buffer.from(`${accountId}:${providerId}`, "utf8");
}

function encrypt(accountId: string, providerId: ProviderId, apiKey: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", vaultKey(accountId), iv);
  cipher.setAAD(aad(accountId, providerId));
  const encrypted = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

function decrypt(accountId: string, providerId: ProviderId, payload: string): string {
  const [version, ivValue, tagValue, encryptedValue] = payload.split(".");
  if (version !== "v1" || !ivValue || !tagValue || !encryptedValue) throw new Error("Provider credential is unreadable.");
  const decipher = createDecipheriv("aes-256-gcm", vaultKey(accountId), Buffer.from(ivValue, "base64url"));
  decipher.setAAD(aad(accountId, providerId));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function saveProviderCredential(input: {
  accountId: string;
  providerId: ProviderId;
  apiKey: string;
  configuration?: Record<string, string>;
}): void {
  const normalized = input.apiKey.trim();
  if (normalized.length < 12 || normalized.length > 1_000) throw new Error("API key length is invalid.");
  saveProviderConnectionRecord({
    accountId: input.accountId,
    providerId: input.providerId,
    encryptedKey: encrypt(input.accountId, input.providerId, normalized),
    keyHint: normalized.slice(-4),
    configuration: providerConfiguration(input.providerId, input.configuration),
  });
}

export function getProviderCredential(accountId: string, providerId: ProviderId): { apiKey: string; configuration: Record<string, string> } | undefined {
  const record = providerConnectionRecord(accountId, providerId);
  if (!record) return undefined;
  return {
    apiKey: decrypt(accountId, providerId, record.encrypted_key),
    configuration: JSON.parse(record.configuration) as Record<string, string>,
  };
}

export function listProviderCredentials(accountId: string): Array<{ providerId: string; keyHint: string; configuration: Record<string, string>; updatedAt: number }> {
  return listProviderConnectionRecords(accountId).map((record) => ({
    providerId: record.provider_id,
    keyHint: record.key_hint,
    configuration: JSON.parse(record.configuration) as Record<string, string>,
    updatedAt: record.updated_at,
  }));
}

export function deleteProviderCredential(accountId: string, providerId: ProviderId): boolean {
  return deleteProviderConnectionRecord(accountId, providerId);
}
