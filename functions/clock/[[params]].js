// SPDX-FileCopyrightText: 2026 Aesthetic Vulpes (github.com/didvc)
// SPDX-License-Identifier: AGPL-3.0-only
import { handle } from "../../src/clock/handler.js";

export function onRequest({ request, params }) {
  const p = params.params;
  return handle(request.method, Array.isArray(p) ? p : p ? [p] : []);
}
