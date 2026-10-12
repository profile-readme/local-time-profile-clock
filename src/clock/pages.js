// SPDX-FileCopyrightText: 2026 Aesthetic Vulpes (github.com/didvc)
// SPDX-License-Identifier: AGPL-3.0-only
// /clock/help (URL builder) and /clock/agents (Markdown). Computed from the request URL only.
import { SITE } from "./site.generated.js";
import { ALL_ZONES, zoneToken } from "./time.js";
import { esc } from "./render.js";

const APP = "clock";
export const OPTION_GROUPS = [
  {
    title: "Time zone",
    rows: [
      ["<zone>", "IANA time zone, lowercased, with / written as -. Examples: asia-tokyo, europe-berlin, america-new_york, america-argentina-buenos_aires."],
      ["utc", "Coordinated Universal Time (default)."],
      ["utc+9, utc-5, utc+0530", "A fixed offset from UTC, without daylight saving time."],
    ],
  },
  {
    title: "Clock",
    rows: [
      ["digital, analog", "Clock style (default digital)."],
      ["12h, 24h", "Hour format for the digital clock (default 24h)."],
      ["seconds", "Show seconds (a second hand on the analog clock)."],
      ["size-N", "Size in pixels, 16 to 96 (default 40); also in rem, e.g. size-2rem (1rem = 16px)."],
      ["px", "Pin the image to exact pixels. By default it is sized in rem, so it grows with the reader's browser font size."],
    ],
  },
  {
    title: "Annotation",
    rows: [
      ["label-city, label-local, label-my, nolabel", "First line: \"Tokyo\" (default), \"Local time in Tokyo\", \"My time in Tokyo\", or nothing."],
      ["nooffset", "Hide the UTC offset, which is shown by default."],
      ["date", "Add the weekday and date."],
      ["work-H-H", "Working hours, e.g. work-9-18. Adds a live status line: working hours, off hours, weekend or probably asleep."],
      ["sleep-H-H", "Sleeping hours for the status line (default sleep-23-7)."],
      ["days-mon-fri, everyday", "Which days are working days (default Monday to Friday)."],
      ["kaomoji", "Add a small face to the status line. Without work hours it shows morning, daytime, evening or night."],
    ],
  },
  {
    title: "Look",
    rows: [
      ["card", "Rounded card background."],
      ["border-N", "Card border in pixels, 0 to 8; implies card."],
      ["color-RRGGBB", "Accent and time color as 3 or 6 hex digits without #."],
      ["auto, light, dark, transparent", "Theme (default auto)."],
      ["warm", "Use the warm readmes palette (cream and cocoa) instead of GitHub's own text colors, which are the default."],
    ],
  },
];

export const isPreviewHost = (host) => /^[^.]+\.[^.]+\.pages\.dev$/i.test(host);
const jsonLd = (d) => JSON.stringify(d).replace(/</g, "\\u003c");
const person = () => ({ "@type": "Person", name: SITE.copyrightHolder, url: SITE.copyrightUrl });

const CSS = `
:root{--bg:#fff8f1;--surface:#fff;--text:#3b2418;--muted:#6b4a38;--link:#9a4310;--accent:#f08a3c;--line:#ecd9c8;--code:#fbeee2;color-scheme:light dark}
@media (prefers-color-scheme:dark){:root{--bg:#1a1620;--surface:#241e2b;--text:#f6e7dc;--muted:#cdb8a8;--link:#ffb37a;--line:#3a3142;--code:#2c2533}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 ui-rounded,"Hiragino Maru Gothic ProN","Nunito","Segoe UI",system-ui,sans-serif}
a{color:var(--link);text-underline-offset:.18em}:focus-visible{outline:3px solid var(--accent);outline-offset:2px;border-radius:4px}
.skip{position:absolute;left:-999px;top:8px;background:var(--surface);padding:8px 12px}.skip:focus{left:16px}
.wrap{max-width:960px;margin:0 auto;padding:0 16px}
header.site{border-bottom:1px solid var(--line)}header.site .wrap{display:flex;flex-wrap:wrap;gap:8px 20px;align-items:center;justify-content:space-between;padding-top:14px;padding-bottom:14px}
.brand{font-weight:800;font-size:1.15rem;text-decoration:none;color:var(--text)}nav ul{display:flex;flex-wrap:wrap;gap:4px 18px;list-style:none;margin:0;padding:0}
main{padding:28px 0 40px}h1{font-size:clamp(1.8rem,5vw,2.4rem);line-height:1.2;margin:.2em 0 .3em}h2{font-size:1.4rem;margin:2em 0 .5em}h3{font-size:1.1rem;margin:1.5em 0 .4em}
.lead{font-size:1.1rem;color:var(--muted);max-width:44em}.muted{color:var(--muted)}
.card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:18px 20px;margin:18px 0}
code,pre,input[type=text],textarea{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.92em}
code{background:var(--code);padding:.1em .35em;border-radius:6px;overflow-wrap:anywhere}pre{background:var(--code);padding:12px 14px;border-radius:10px;overflow-x:auto;margin:0}pre code{padding:0;background:none}
.table{overflow-x:auto}table{border-collapse:collapse;width:100%;margin:8px 0 16px}th,td{text-align:left;vertical-align:top;padding:8px 10px;border-bottom:1px solid var(--line)}
.btn{font:inherit;font-weight:700;color:#3b2418;background:var(--accent);border:0;border-radius:999px;padding:8px 16px;cursor:pointer}
.row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:10px 0}
form.builder{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px 18px}
form.builder label{font-weight:700;display:block;margin-bottom:4px}
form.builder select,form.builder input[type=number]{font:inherit;width:100%;padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--text)}
.out input,.out textarea{width:100%;padding:8px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--text)}
.gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}.gallery figure{margin:0;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:6px;align-items:flex-start}.gallery img{max-width:100%;height:auto}.gallery figcaption{font-size:.9rem}.btn.small{padding:4px 12px;font-size:.85rem}
.preview{min-height:80px;display:flex;align-items:center;justify-content:center;padding:12px;background:repeating-conic-gradient(var(--code) 0 25%,transparent 0 50%) 0 0/20px 20px;border-radius:12px}.preview img{max-width:100%;height:auto}
footer.site{border-top:1px solid var(--line);padding:24px 0 36px;color:var(--muted);font-size:.92rem}footer.site p{margin:.35em 0}
`;

const COPY_JS = `document.querySelectorAll("[data-copy]").forEach(function(b){b.addEventListener("click",function(){var el=document.getElementById(b.getAttribute("data-copy"));var s=document.getElementById(b.getAttribute("data-status"));navigator.clipboard.writeText(el.value).then(function(){s.textContent="Copied."},function(){s.textContent="Copy failed; select the text and copy it manually."})})});`;

function helpPage(origin, noindex) {
  const base = `${origin}/${APP}`;
  const opt = (list) => list.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join("");
  const tables = OPTION_GROUPS.map(
    (g) => `<h3>${esc(g.title)}</h3><div class="table"><table><thead><tr><th scope="col">Option</th><th scope="col">Effect</th></tr></thead><tbody>${g.rows
      .map(([k, v]) => `<tr><td>${k.split(", ").map((t) => `<code>${esc(t)}</code>`).join(", ")}</td><td>${esc(v)}</td></tr>`)
      .join("")}</tbody></table></div>`,
  ).join("\n");
  const examples = [
    ["asia-tokyo/card", "Digital clock for Tokyo on a card"],
    ["europe-berlin/analog/seconds/work-9-17/card", "Analog clock for Berlin with seconds and working-hours status"],
    ["america-new_york/12h/date/label-my", "12-hour clock for New York with date"],
  ];
  const body = `
<h1>Live local-time clock for your profile</h1>
<p class="lead">Show collaborators what time it is where you are, and whether you are likely to answer. The clock keeps ticking after the page loads, and it works on GitHub without any scripts.</p>
<div class="gallery">
${examples.map(([p, alt]) => `<figure><img src="/${APP}/${p}" alt="${esc(alt)}"><figcaption><code>${esc(p)}</code></figcaption></figure>`).join("\n")}
</div>

<section aria-labelledby="builder">
<h2 id="builder">URL builder</h2>
<noscript><p>The builder needs JavaScript. The option tables below describe everything it does.</p></noscript>
<form class="builder card" id="b">
  <div><label for="zone">Time zone</label><input id="zone" type="text" list="zones" placeholder="asia-tokyo" autocomplete="off" style="font:inherit;width:100%;padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--text)"><datalist id="zones">${ALL_ZONES.map((z) => `<option value="${esc(zoneToken(z))}">${esc(z)}</option>`).join("")}</datalist></div>
  <div><label for="style">Style</label><select id="style">${opt([["", "digital (default)"], ["analog", "analog"]])}</select></div>
  <div><label for="hours">Hours</label><select id="hours">${opt([["", "24h (default)"], ["12h", "12h"]])}</select></div>
  <div><label for="label">First line</label><select id="label">${opt([["", "city (default)"], ["label-local", "Local time in ..."], ["label-my", "My time in ..."], ["nolabel", "none"]])}</select></div>
  <div><label for="work">Working hours</label><select id="work">${opt([["", "none"], ["work-9-17", "9 to 17"], ["work-9-18", "9 to 18"], ["work-10-19", "10 to 19"], ["work-8-16", "8 to 16"]])}</select></div>
  <div><label for="size">Size (16 to 96 px)</label><input id="size" type="number" min="16" max="96" placeholder="40"></div>
  <div><label for="theme">Theme</label><select id="theme">${opt([["", "auto (default)"], ["light", "light"], ["dark", "dark"], ["transparent", "transparent"]])}</select></div>
  <div><label><input type="checkbox" id="seconds"> Seconds</label><label><input type="checkbox" id="date"> Date</label><label><input type="checkbox" id="kaomoji"> Kaomoji</label><label><input type="checkbox" id="card"> Card</label><label><input type="checkbox" id="nooffset"> Hide offset</label></div>
</form>
<div class="card out">
  <label for="url"><strong>Image URL</strong></label>
  <input id="url" type="text" readonly value="${esc(base)}">
  <div class="row"><button class="btn" type="button" data-copy="url" data-status="s1">Copy URL</button><span id="s1" role="status" aria-live="polite" class="muted"></span></div>
  <label for="md"><strong>Markdown</strong></label>
  <textarea id="md" rows="3" readonly>![Local time](${esc(base)})</textarea>
  <div class="row"><button class="btn" type="button" data-copy="md" data-status="s2">Copy Markdown</button><span id="s2" role="status" aria-live="polite" class="muted"></span></div>
  <p><strong>Preview</strong></p>
  <div class="preview"><img id="pv" src="/${APP}" alt="Preview of the configured clock"></div>
</div>
</section>

<section aria-labelledby="opts">
<h2 id="opts">All options</h2>
<p>Options are path segments after <code>${esc(base)}/</code>, in any order. A trailing <code>.svg</code> is allowed. An unknown option renders a small error badge.</p>
${tables}
</section>

<section aria-labelledby="how">
<h2 id="how">How it keeps time</h2>
<p>The server draws the current time in your zone, including daylight saving time. Inside the image, each digit is a column of all its possible values, and CSS slides each column at the right speed. The clock therefore keeps running for as long as the page stays open. The image is never cached, so every page load starts from the exact time.</p>
</section>
`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication", name: SITE.app, url: `${base}/help`,
        description: "Live local-time clock SVG for GitHub profile READMEs, with time zone, working hours and status annotations.",
        applicationCategory: "DeveloperApplication", operatingSystem: "Any", isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        author: person(), copyrightHolder: person(), copyrightYear: SITE.copyrightYear, license: "https://www.gnu.org/licenses/agpl-3.0.html",
      },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE.name, item: `${origin}/` },
        { "@type": "ListItem", position: 2, name: "Local-time clock", item: `${base}/help` },
      ] },
    ],
  };
  const script = `(function(){var base=${jsonLd(base)};var f=document.getElementById("b");function v(id){return document.getElementById(id).value.trim()}function c(id){return document.getElementById(id).checked}function build(){var p=[];var z=v("zone").toLowerCase().replace(/\\//g,"-");if(z)p.push(z);["style","hours","label","work"].forEach(function(id){var x=v(id);if(x)p.push(x)});["seconds","date","kaomoji","card","nooffset"].forEach(function(id){if(c(id))p.push(id)});var s=parseInt(v("size"),10);if(!isNaN(s))p.push("size-"+Math.min(96,Math.max(16,s)));var t=v("theme");if(t)p.push(t);var url=base+(p.length?"/"+p.join("/"):"");document.getElementById("url").value=url;document.getElementById("md").value="![Local time]("+url+")";document.getElementById("pv").src=url.replace(base,"/${APP}")}f.addEventListener("input",build);f.addEventListener("change",build);f.addEventListener("submit",function(e){e.preventDefault()});build()})();` + COPY_JS;

  const title = "Live local-time clock for GitHub profile READMEs";
  const description = "A ticking clock SVG for your GitHub profile that shows your local time, UTC offset, date and working-hours status. Any time zone, no scripts, no sign-up.";
  const url = `${base}/help`;
  const holder = SITE.copyrightUrl.replace(/^https?:\/\//, "");
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="author" content="${esc(SITE.copyrightHolder)}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#fff8f1" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1a1620" media="(prefers-color-scheme: dark)">
<meta name="robots" content="${noindex ? "noindex, nofollow" : "index, follow"}">
<link rel="canonical" href="${esc(url)}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cpath d='M8 6l18 14h12L56 6l-4 30c0 12-9 22-20 22S12 48 12 36z' fill='%23f08a3c'/%3E%3C/svg%3E">
<link rel="alternate" type="text/markdown" href="${esc(base)}/agents" title="Local-time clock for AI agents">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<style>${CSS}</style>
<script type="application/ld+json">${jsonLd(ld)}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site"><div class="wrap">
<a class="brand" href="/">${esc(SITE.name)}</a>
<nav aria-label="Main"><ul><li><a href="/">Home</a></li><li><a href="/${APP}/help" aria-current="page">Clock</a></li><li><a href="/${APP}/agents">For agents</a></li><li><a href="${esc(SITE.repository)}">Source</a></li></ul></nav>
</div></header>
<main id="main" class="wrap" tabindex="-1">
${body}
</main>
<footer class="site"><div class="wrap">
<p><small>&copy; ${esc(SITE.copyrightYear)} <a href="${esc(SITE.copyrightUrl)}" rel="author">${esc(SITE.copyrightHolder)} (${esc(holder)})</a>. Code under <a href="${esc(SITE.repository)}/blob/main/LICENSE" rel="license">AGPL-3.0</a>. Time zone data from your platform's IANA database.</small></p>
<p><small>A free demonstration provided as is, without warranty. Not affiliated with GitHub or Cloudflare. No cookies, no tracking, no uploads. <a href="${esc(SITE.repository)}#disclaimer">Disclaimer</a></small></p>
</div></footer>
<script>${script}</script>
</body>
</html>
`;
  return { html, script };
}

export function agentsMarkdown(origin) {
  const base = `${origin}/${APP}`;
  const groups = OPTION_GROUPS.map(
    (g) => `### ${g.title}\n\n| Token | Meaning |\n|---|---|\n${g.rows.map(([k, v]) => `| ${k.split(", ").map((t) => `\`${t}\``).join(", ")} | ${v} |`).join("\n")}`,
  ).join("\n\n");
  return `# Local-time clock: guide for AI agents

© ${SITE.copyrightYear} ${SITE.copyrightHolder} (${SITE.copyrightUrl.replace(/^https?:\/\//, "")}). Code AGPL-3.0-only.

This endpoint returns an SVG clock showing the current time in a chosen time zone, with optional annotations (city, UTC offset, date, working-hours status). The time is drawn by the server and kept running by CSS inside the image, so it ticks without scripts. No API keys, no user data.

## Endpoint

\`\`\`
GET ${base}[/<token>[/<token>...]][.svg]
\`\`\`

- Response: \`image/svg+xml\`, never cached (\`Cache-Control: no-store\`).
- Tokens are case-insensitive and order-independent; at most 16.
- An unknown token returns HTTP 200 with an error badge and \`X-Clock-Error: unknown option #N\`.
- Time zone tokens are IANA names, lowercased, with \`/\` replaced by \`-\` (Asia/Tokyo becomes \`asia-tokyo\`). ${ALL_ZONES.length} zones are available.

## Tokens

${groups}

## Examples

| Goal | URL |
|---|---|
| Tokyo, digital | ${base}/asia-tokyo |
| Berlin, analog with seconds and working hours | ${base}/europe-berlin/analog/seconds/work-9-17 |
| New York, 12-hour with date | ${base}/america-new_york/12h/date |
| Fixed offset UTC+5:30 with kaomoji | ${base}/utc+0530/kaomoji |

\`\`\`markdown
![My local time](${base}/asia-tokyo/work-9-18/card)
\`\`\`

## Guidance for agents

- Map a user's city to the IANA zone name, not to a fixed offset, so daylight saving time is handled.
- Add alt text such as "My local time" when embedding.
- This is a best-effort free demo without warranty. Do not send automated high-volume traffic.

## More

- URL builder and option tables: ${base}/help
- Source, license and disclaimer: ${SITE.repository}
`;
}

async function sha256Base64(text) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return btoa(String.fromCharCode(...new Uint8Array(d)));
}

export async function servePage(request, kind) {
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  const url = new URL(request.url);
  const preview = isPreviewHost(url.hostname);
  const headers = { "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin", "Cache-Control": "public, max-age=300" };
  if (preview) headers["X-Robots-Tag"] = "noindex, nofollow";
  let body;
  if (kind === "help") {
    const { html, script } = helpPage(url.origin, preview);
    headers["Content-Type"] = "text/html; charset=utf-8";
    headers["Content-Security-Policy"] = `default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; script-src 'sha256-${await sha256Base64(script)}'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`;
    body = html;
  } else {
    headers["Content-Type"] = "text/markdown; charset=utf-8";
    body = agentsMarkdown(url.origin);
  }
  return new Response(request.method === "HEAD" ? null : body, { headers });
}
