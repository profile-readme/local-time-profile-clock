// SPDX-FileCopyrightText: 2026 Aesthetic Vulpes (github.com/didvc)
// SPDX-License-Identifier: AGPL-3.0-only
// Request -> SVG. Never cached: the server-drawn starting time must be fresh for the CSS to stay correct.
import { parseOptions } from "./options.js";
import { renderClock, renderNotice } from "./render.js";

const HEADERS = {
  "Content-Type": "image/svg+xml; charset=utf-8",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
  "X-Content-Type-Options": "nosniff",
  "Access-Control-Allow-Origin": "*",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export function handle(method, segments, now = new Date()) {
  if (method !== "GET" && method !== "HEAD") return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  const out = (body, extra = {}) => new Response(method === "HEAD" ? null : body, { headers: { ...HEADERS, ...extra } });
  const { opts, error } = parseOptions(segments);
  if (error) return out(renderNotice(error), { "X-Clock-Error": error });
  return out(renderClock(opts, now));
}
