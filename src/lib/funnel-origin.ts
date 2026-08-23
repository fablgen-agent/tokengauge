const brandedWorkOrigin = "https://work.enby.fish";

export function funnelOriginAllowed(origin: string | null, appUrl: string): boolean {
  if (!origin) return false;

  try {
    const allowedOrigins = new Set([new URL(appUrl).origin, brandedWorkOrigin]);
    return allowedOrigins.has(origin);
  } catch {
    return false;
  }
}
