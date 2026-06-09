interface JWTPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  [key: string]: unknown;
}

/** Decode the payload section of a JWT without any external library. */
export function decodeJWTPayload(token: string): JWTPayload {
  try {
    const raw = token.startsWith("Bearer ") ? token.slice(7) : token;
    const base64Url = raw.split(".")[1];
    if (!base64Url) return {};
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const jsonStr = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonStr) as JWTPayload;
  } catch {
    return {};
  }
}

/** Returns expiry as a Unix millisecond timestamp, or null if undecodable. */
export function getTokenExpiry(token: string): number | null {
  const { exp } = decodeJWTPayload(token);
  return exp ? exp * 1000 : null;
}

/**
 * Returns true if the token is expired (or will expire within `bufferMs`).
 * Treats undecodable tokens as expired.
 */
export function isTokenExpired(token: string, bufferMs = 0): boolean {
  const expiry = getTokenExpiry(token);
  if (expiry === null) return true;
  return Date.now() + bufferMs >= expiry;
}

export function stripBearerPrefix(token: string): string {
  return token.startsWith("Bearer ") ? token.slice(7) : token;
}
