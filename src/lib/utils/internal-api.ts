import "server-only";

import { headers } from "next/headers";

export function getInternalBaseUrl() {
  const requestHeaders = headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return "http://localhost:3000";
  }

  return `${protocol}://${host}`;
}

export function getInternalFetchHeaders() {
  const requestHeaders = headers();
  const cookie = requestHeaders.get("cookie");

  return cookie ? { cookie } : undefined;
}
