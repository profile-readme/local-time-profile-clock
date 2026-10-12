// SPDX-FileCopyrightText: 2026 Aesthetic Vulpes (github.com/didvc)
// SPDX-License-Identifier: AGPL-3.0-only
// Render a live clock SVG. The server draws the current time; CSS keeps it running afterwards.
// Each changing field is a vertical "strip" of all its values, clipped to one cell and moved with
// a steps() animation whose negative delay equals the current phase. Analog hands rotate the same way.
import { SITE } from "./site.generated.js";
import { offsetMinutes, formatOffset } from "./time.js";
import { inWindow } from "./options.js";

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const r1 = (n) => Math.round(n * 10) / 10;
// Root size in rem (1rem = 16px) so the whole image follows the reader's browser font-size
// setting; identical to pixels at the default 16px. The px option pins exact pixels instead.
const dim = (n, px) => (px ? String(n) : `${Math.round((n / 16) * 10000) / 10000}rem`);
const mod = (a, n) => ((a % n) + n) % n;

// Default: GitHub's own colors (text, canvas, border), so the image reads like the README around it.
// An image cannot inherit the page's colors, so they are matched exactly. "warm" keeps the readmes palette.
const PALETTES = {
  github: {
    light: { bg: "#ffffff", fg: "#1f2328", muted: "#59636e", line: "#d1d9e0", face: "#f6f8fa" },
    dark: { bg: "#0d1117", fg: "#f0f6fc", muted: "#9198a1", line: "#3d444d", face: "#151b23" },
  },
  warm: {
    light: { bg: "#fff8f1", fg: "#3b2418", muted: "#6b4a38", line: "#ecd9c8", face: "#ffffff" },
    dark: { bg: "#241e2b", fg: "#f6e7dc", muted: "#cdb8a8", line: "#3a3142", face: "#2c2533" },
  },
};
const MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,"DejaVu Sans Mono",monospace';
const SANS = 'ui-rounded,"Hiragino Maru Gothic ProN","Nunito","Segoe UI",system-ui,sans-serif';
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const textW = (s, fs) => [...s].reduce((w, ch) => w + (ch.codePointAt(0) > 0x2e80 ? 1 : 0.58), 0) * fs;

// Status text for hour-of-week index i, where index 0 is Thursday 00:00 (the Unix epoch weekday).
function statusAt(i, opts) {
  const wd = (4 + Math.floor(i / 24)) % 7, h = i % 24;
  const asleep = inWindow(h, opts.sleep);
  let s;
  if (opts.work) {
    if (asleep) s = "probably asleep";
    else if (opts.workdays.includes(wd) && inWindow(h, opts.work)) s = "working hours";
    else if (!opts.workdays.includes(wd)) s = "weekend";
    else s = "off hours";
  } else {
    s = asleep ? "night" : h < 11 ? "morning" : h < 17 ? "daytime" : "evening";
  }
  if (!opts.kaomoji) return s;
  const face = { "probably asleep": "(˘ω˘) zZ", night: "(˘ω˘) zZ", "working hours": "(｀・ω・´)", weekend: "ヽ(・∀・)ノ", "off hours": "( ´ ▽ ` )", morning: "(・ω・)ノ", daytime: "(｀・ω・´)", evening: "( ´ ▽ ` )" }[s];
  return `${face} ${s}`;
}

export function renderClock(opts, now = new Date()) {
  const off = offsetMinutes(opts.zone, now);
  const L = Math.floor(now.getTime() / 1000) + off * 60; // local seconds since the epoch
  const local = new Date(L * 1000);
  const S = opts.size, b = opts.border;
  const pad = r1(opts.card ? S * 0.45 + b : S * 0.15);
  const fs2 = r1(S * 0.34), lh2 = r1(fs2 * 1.4);
  let css = "", defs = "", n = 0;

  function strip({ x, y, w, lh, asc, entries, period, cls, anchor = "start" }) {
    const id = "s" + n++, count = entries.length;
    const phase = mod(L, period), idx = Math.floor(phase / (period / count));
    css += `.${id}{transform:translateY(-${r1(idx * lh)}px);animation:${id} ${period}s steps(${count}) infinite;animation-delay:-${phase}s}`;
    css += `@keyframes ${id}{from{transform:translateY(0)}to{transform:translateY(-${r1(count * lh)}px)}}`;
    const left = anchor === "end" ? x - w : anchor === "middle" ? x - w / 2 : x;
    defs += `<clipPath id="c${id}"><rect x="${r1(left)}" y="${r1(y - asc)}" width="${r1(w)}" height="${r1(lh)}"/></clipPath>`;
    return `<g clip-path="url(#c${id})"><g class="${id}">${entries.map((e, i) => `<text class="${cls}" x="${r1(x)}" y="${r1(y + i * lh)}" text-anchor="${anchor}">${esc(e)}</text>`).join("")}</g></g>`;
  }

  // Annotation lines
  const offTxt = formatOffset(off);
  const city = opts.zone.city;
  let line1 = { city: city ?? offTxt, local: city ? `Local time in ${city}` : "Local time", my: city ? `My time in ${city}` : "My local time", none: "" }[opts.label];
  if (opts.offset && line1 !== offTxt) line1 += line1 ? ` · ${offTxt}` : offTxt;
  if (opts.date) line1 += `${line1 ? " · " : ""}${DAY_NAMES[local.getUTCDay()]}, ${MONTHS[local.getUTCMonth()]} ${local.getUTCDate()}`;
  const showStatus = !!opts.work || opts.kaomoji;
  const statuses = showStatus ? (opts.work ? Array.from({ length: 168 }, (_, i) => statusAt(i, opts)) : Array.from({ length: 24 }, (_, i) => statusAt(i, opts))) : [];
  const statusW = Math.max(0, ...statuses.map((s) => textW(s, fs2)));
  const lines = [line1 && { kind: "text", text: line1 }, showStatus && { kind: "status" }].filter(Boolean);

  let body = "", W, H;
  if (opts.style === "analog") {
    const D = r1(S * 2.4), cx = r1(pad + D / 2), cy = r1(pad + D / 2);
    const tx = r1(pad + D + S * 0.4);
    const labelW = Math.max(0, ...lines.map((l) => (l.kind === "text" ? textW(l.text, fs2) : statusW)));
    W = Math.ceil(pad * 2 + D + (lines.length ? S * 0.4 + labelW : 0));
    H = Math.ceil(pad * 2 + D);
    body += `<circle cx="${cx}" cy="${cy}" r="${r1(D / 2)}" fill="var(--face)" stroke="var(--line)" stroke-width="${r1(S * 0.05)}"/>`;
    for (let k = 0; k < 12; k++) {
      const a = (k * Math.PI) / 6, r0 = D / 2 - (k % 3 ? S * 0.12 : S * 0.22), r2 = D / 2 - S * 0.06;
      body += `<line x1="${r1(cx + Math.sin(a) * r0)}" y1="${r1(cy - Math.cos(a) * r0)}" x2="${r1(cx + Math.sin(a) * r2)}" y2="${r1(cy - Math.cos(a) * r2)}" stroke="var(--muted)" stroke-width="${r1(S * (k % 3 ? 0.03 : 0.06))}" stroke-linecap="round"/>`;
    }
    const hand = (cls, len, width, color, period, steps) => {
      const phase = mod(L, period), deg = r1((phase / period) * 360);
      css += `.${cls}{transform-origin:${cx}px ${cy}px;transform:rotate(${deg}deg);animation:rot ${period}s ${steps ? `steps(${steps})` : "linear"} infinite;animation-delay:-${phase}s}`;
      return `<line class="${cls}" x1="${cx}" y1="${r1(cy + len * 0.15)}" x2="${cx}" y2="${r1(cy - len)}" stroke="${color}" stroke-width="${r1(width)}" stroke-linecap="round"/>`;
    };
    css += "@keyframes rot{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}";
    body += hand("hh", D * 0.25, S * 0.09, "var(--fg)", 43200);
    body += hand("mh", D * 0.37, S * 0.06, "var(--fg)", 3600);
    if (opts.seconds) body += hand("sh", D * 0.4, S * 0.025, "var(--accent)", 60, 60);
    body += `<circle cx="${cx}" cy="${cy}" r="${r1(S * 0.07)}" fill="var(--accent)"/>`;
    let y = r1(cy - ((lines.length - 1) * lh2) / 2 + fs2 * 0.35);
    for (const l of lines) {
      body += l.kind === "text"
        ? `<text class="lbl" x="${tx}" y="${y}">${esc(l.text)}</text>`
        : strip({ x: tx, y, w: statusW + 4, lh: lh2, asc: fs2 * 1.05, entries: statuses, period: statuses.length * 3600, cls: "lbl" });
      y = r1(y + lh2);
    }
  } else {
    const cw = S * 0.6, x0 = pad, base = r1(pad + S * 0.82);
    let x = x0;
    const hours = Array.from({ length: 24 }, (_, h) => (opts.h12 ? String(h % 12 || 12).padStart(2, " ") : String(h).padStart(2, "0")));
    body += strip({ x: x + 2 * cw, y: base, w: 2 * cw, lh: S, asc: S * 0.82, entries: hours, period: 86400, cls: "big", anchor: "end" });
    x += 2 * cw;
    body += `<text class="big" x="${r1(x)}" y="${base}">:</text>`;
    x += cw;
    body += strip({ x, y: base, w: cw, lh: S, asc: S * 0.82, entries: ["0", "1", "2", "3", "4", "5"], period: 3600, cls: "big" });
    x += cw;
    body += strip({ x, y: base, w: cw, lh: S, asc: S * 0.82, entries: "0123456789".split(""), period: 600, cls: "big" });
    x += cw;
    if (opts.seconds) {
      const ss = S * 0.5, cws = ss * 0.6;
      x += S * 0.08;
      body += `<text class="sec" x="${r1(x)}" y="${base}">:</text>`;
      x += cws;
      body += strip({ x, y: base, w: cws, lh: ss, asc: ss * 0.82, entries: ["0", "1", "2", "3", "4", "5"], period: 60, cls: "sec" });
      x += cws;
      body += strip({ x, y: base, w: cws, lh: ss, asc: ss * 0.82, entries: "0123456789".split(""), period: 10, cls: "sec" });
      x += cws;
    }
    if (opts.h12) {
      const af = S * 0.32;
      x += S * 0.15;
      body += strip({ x, y: base, w: af * 1.8, lh: af * 1.2, asc: af, entries: Array.from({ length: 24 }, (_, h) => (h < 12 ? "AM" : "PM")), period: 86400, cls: "ampm" });
      x += af * 1.8;
    }
    const timeW = x - x0;
    const labelW = Math.max(0, ...lines.map((l) => (l.kind === "text" ? textW(l.text, fs2) : statusW)));
    W = Math.ceil(pad * 2 + Math.max(timeW, labelW));
    H = Math.ceil(pad * 2 + S * 1.02 + lines.length * lh2);
    let y = r1(pad + S * 1.02 + fs2 * 1.05);
    for (const l of lines) {
      body += l.kind === "text"
        ? `<text class="lbl" x="${x0}" y="${y}">${esc(l.text)}</text>`
        : strip({ x: x0, y, w: statusW + 4, lh: lh2, asc: fs2 * 1.05, entries: statuses, period: statuses.length * 3600, cls: "lbl" });
      y = r1(y + lh2);
    }
  }

  const vars = (p) => `--bg:${p.bg};--fg:${opts.color ? "#" + opts.color : p.fg};--muted:${p.muted};--line:${p.line};--face:${p.face};--accent:#${opts.color ?? "f08a3c"};`;
  const PALETTE = PALETTES[opts.palette] ?? PALETTES.github;
  let theme = `svg{${vars(opts.theme === "dark" ? PALETTE.dark : PALETTE.light)}}`;
  if (opts.theme === "auto" || opts.theme === "transparent") theme += `@media (prefers-color-scheme:dark){svg{${vars(PALETTE.dark)}}}`;
  const fonts = `.big{font:600 ${S}px ${MONO};fill:var(--fg)}.sec{font:600 ${r1(S * 0.5)}px ${MONO};fill:var(--muted)}.ampm{font:700 ${r1(S * 0.32)}px ${SANS};fill:var(--muted)}.lbl{font:600 ${fs2}px ${SANS};fill:var(--muted)}text{font-variant-numeric:tabular-nums}`;

  let bg = "";
  if (opts.card) {
    const rad = r1(Math.min(W, H) * 0.16);
    if (b) bg += `<rect width="${W}" height="${H}" rx="${rad}" fill="var(--accent)"/>`;
    if (opts.theme !== "transparent" || b) bg += `<rect x="${b}" y="${b}" width="${W - 2 * b}" height="${H - 2 * b}" rx="${Math.max(0, rad - b)}" fill="var(--bg)"${b ? "" : ' stroke="var(--line)"'}/>`;
  }
  const title = `Clock: ${city ? `local time in ${city}` : "local time"} (${offTxt})`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${dim(W, opts.px)}" height="${dim(H, opts.px)}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t">` +
    `<!-- (c) ${esc(SITE.copyrightYear)} ${esc(SITE.copyrightHolder)} (${esc(SITE.copyrightUrl)}) -->` +
    `<title id="t">${esc(title)}</title><style>${theme}${fonts}${css}</style><defs>${defs}</defs>${bg}${body}</svg>`
  );
}

export function renderNotice(message) {
  const text = `clock: ${message} (see help)`;
  const W = Math.round(text.length * 7.2 + 24);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${dim(W)}" height="${dim(28)}" viewBox="0 0 ${W} 28" role="img" aria-label="${esc(text)}">` +
    `<title>${esc(text)}</title><rect width="${W}" height="28" rx="14" fill="#fde2e4"/>` +
    `<text x="${W / 2}" y="18.5" text-anchor="middle" fill="#9b2c3a" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="12">${esc(text)}</text></svg>`
  );
}
