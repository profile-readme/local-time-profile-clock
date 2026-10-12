// SPDX-FileCopyrightText: 2026 Aesthetic Vulpes (github.com/didvc)
// SPDX-License-Identifier: AGPL-3.0-only
import { test } from "node:test";
import assert from "node:assert/strict";
import { handle } from "../src/clock/handler.js";
import { parseZone, offsetMinutes, formatOffset } from "../src/clock/time.js";
import { parseOptions } from "../src/clock/options.js";
import { servePage } from "../src/clock/pages.js";

const svg = async (path, now) => (await handle("GET", path.split("/").filter(Boolean), now).text());
// Visible value of a strip: the entry whose index matches the inline translateY.
function stripValues(body) {
  const out = [];
  for (const m of body.matchAll(/<g class="(s\d+)">(.*?)<\/g><\/g>/g)) {
    const lh = +(m[2].match(/y="([\d.]+)"/g).slice(0, 2).map((s) => +s.slice(3, -1)).reduce((a, b) => b - a));
    const shift = +body.match(new RegExp(`\\.${m[1]}\\{transform:translateY\\(-([\\d.]+)px\\)`))[1];
    const entries = [...m[2].matchAll(/>([^<]*)<\/text>/g)].map((x) => x[1]);
    out.push(entries[Math.round(shift / lh)]);
  }
  return out;
}

test("zones and offsets, including daylight saving time", () => {
  const tokyo = parseZone("asia-tokyo"), ny = parseZone("america-new_york");
  assert.equal(tokyo.city, "Tokyo");
  assert.equal(offsetMinutes(tokyo, new Date("2026-01-15T00:00:00Z")), 540);
  assert.equal(offsetMinutes(ny, new Date("2026-01-15T12:00:00Z")), -300);
  assert.equal(offsetMinutes(ny, new Date("2026-07-15T12:00:00Z")), -240);
  assert.equal(parseZone("utc+0530").fixed, 330);
  assert.equal(parseZone("utc+15"), null);
  assert.equal(formatOffset(330), "UTC+5:30");
  assert.equal(formatOffset(-240), "UTC-4");
  assert.equal(parseZone("america-port-au-prince").zone, "America/Port-au-Prince");
});

test("digital clock shows the right time in the zone", async () => {
  const now = new Date("2026-10-10T03:07:42Z"); // 12:07:42 in Tokyo
  const body = await svg("asia-tokyo/seconds", now);
  assert.deepEqual(stripValues(body), ["12", "0", "7", "4", "2"]);
  assert.match(body, /Tokyo · UTC\+9/);
  const ny = stripValues(await svg("america-new_york/12h", now)); // 23:07 previous day, EDT
  assert.deepEqual(ny, ["11", "0", "7", "PM"]);
});

test("strips animate with steps and negative delays matching the phase", async () => {
  const now = new Date("2026-10-10T03:07:42Z");
  const body = await svg("asia-tokyo/seconds", now);
  assert.match(body, /animation:s4 10s steps\(10\) infinite;animation-delay:-2s/);
  assert.match(body, /animation:s0 86400s steps\(24\) infinite;animation-delay:-43662s/);
});

test("status line follows working hours, weekends and sleep", async () => {
  const sat = await svg("asia-tokyo/work-9-18", new Date("2026-10-10T03:00:00Z")); // Sat 12:00
  assert.ok(stripValues(sat).includes("weekend"));
  const mon = await svg("asia-tokyo/work-9-18", new Date("2026-10-12T03:00:00Z")); // Mon 12:00
  assert.ok(stripValues(mon).includes("working hours"));
  const night = await svg("asia-tokyo/work-9-18/kaomoji", new Date("2026-10-12T17:00:00Z")); // Tue 02:00
  assert.ok(stripValues(night).includes("(˘ω˘) zZ probably asleep"));
  const shop = await svg("asia-tokyo/work-10-19/days-tue-sat", new Date("2026-10-10T03:00:00Z")); // Sat 12:00
  assert.ok(stripValues(shop).includes("working hours"));
});

test("analog hands rotate from the current angle", async () => {
  const body = await svg("utc/analog/seconds", new Date("2026-10-10T03:00:30Z"));
  assert.match(body, /\.hh\{[^}]*transform:rotate\(90.3deg\)/);
  assert.match(body, /\.sh\{[^}]*transform:rotate\(180deg\);animation:rot 60s steps\(60\)/);
});

test("options, errors, caching and methods", async () => {
  assert.equal(parseOptions(["size-500"]).opts.size, 96);
  assert.equal(parseOptions(["work-9-9"]).error, "unknown option #1");
  const bad = handle("GET", ["asia-tokyo", "<b>"]);
  assert.equal(bad.headers.get("x-clock-error"), "unknown option #2");
  assert.ok(!(await bad.text()).includes("<b>"));
  assert.match(handle("GET", []).headers.get("cache-control"), /no-store/);
  assert.equal(handle("POST", []).status, 405);
  for (const p of ["", "analog/card/dark", "12h/seconds/date/work-8-16/kaomoji/border-3", "utc-0930/nolabel/nooffset/transparent", "europe-london/label-local/size-96"])
    assert.ok(!/NaN|undefined|Infinity/.test(await svg(p)), p);
});

test("help and agents pages", async () => {
  const help = await servePage(new Request("https://readmes.pages.dev/clock/help"), "help");
  const html = await help.text();
  assert.match(html, /<link rel="canonical" href="https:\/\/readmes\.pages\.dev\/clock\/help">/);
  assert.match(html, /<option value="asia-tokyo">Asia\/Tokyo<\/option>/);
  assert.match(help.headers.get("content-security-policy"), /script-src 'sha256-/);
  for (const img of html.matchAll(/<img [^>]*>/g)) assert.match(img[0], /alt="[^"]+"/);
  const md = await (await servePage(new Request("https://readmes.pages.dev/clock/agents"), "agents")).text();
  assert.match(md, /GET https:\/\/readmes\.pages\.dev\/clock/);
});

test("rem sizing by default, px option, rem size tokens", async () => {
  assert.match(await svg("asia-tokyo"), /^<svg[^>]*width="[\d.]+rem" height="[\d.]+rem"/);
  assert.match(await svg("asia-tokyo/px"), /^<svg[^>]*width="\d+" height="\d+" viewBox/);
  assert.equal(parseOptions(["size-3rem"]).opts.size, 48);
});

test("default colors match GitHub's text; warm keeps the readmes palette", async () => {
  const d = await svg("asia-tokyo");
  assert.match(d, /--fg:#1f2328;--muted:#59636e;/);
  assert.match(d, /--fg:#f0f6fc;--muted:#9198a1;/);
  assert.match(await svg("asia-tokyo/warm"), /--fg:#f6e7dc;/);
});
