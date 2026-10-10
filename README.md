# local-time-profile-clock

A live clock for your GitHub profile README that shows the time where you are, your UTC
offset, and whether you are probably working, off for the day or asleep. It keeps ticking
after the page loads, and it needs no scripts, no sign-up and no token.

<p align="center">
  <img src="https://readmes.pages.dev/clock/asia-tokyo/seconds/work-9-18/card" alt="Digital clock showing the current time in Tokyo with a working-hours status line">
  <img src="https://readmes.pages.dev/clock/europe-berlin/analog/seconds/card" alt="Analog clock showing the current time in Berlin with a ticking second hand">
</p>

Both clocks above are showing the real time right now. Leave this page open for a
minute and watch the digits change.

Keywords: GitHub profile clock, local time badge, time zone badge, working hours, remote
work, UTC offset, live clock SVG, analog clock, digital clock, profile README widget,
availability status, Cloudflare Pages Functions.

## Why a clock on a profile

GitHub shows where people say they are, but not what time it is there. If you work with
people across time zones, that one missing detail causes a lot of small friction. People
send a message at your midnight and wonder why you never replied. They schedule a call at
dawn in your city, or hesitate to ping you because they cannot tell whether you are
around.

A small clock answers the question at a glance. Adding your working hours goes one step
further. Visitors then see "working hours", "off hours", "weekend" or "probably asleep"
next to the time, so they know what to expect before they write to you.

Many profiles try to say this in words, with lines like "I am in UTC+9 and usually reply
in the evening". Words go stale when daylight saving time starts or when you move. The
clock always knows the current offset for your zone, so it stays right without you ever
editing the README.

## Quick start

Paste this into your profile `README.md`, replacing the zone with your own:

```markdown
![My local time](https://readmes.pages.dev/clock/asia-tokyo)
```

Add your working hours and a card background:

```markdown
![My local time](https://readmes.pages.dev/clock/asia-tokyo/work-9-18/card)
```

There is also a URL builder with a searchable list of every time zone at
[readmes.pages.dev/clock/help](https://readmes.pages.dev/clock/help).

## Choosing your time zone

Time zones are written as their standard IANA names, the same ones your computer and phone
use. In the URL they are lowercase, and the slash becomes a hyphen. `Asia/Tokyo` becomes
`asia-tokyo`, `Europe/Berlin` becomes `europe-berlin`, and `America/New_York` becomes
`america-new_york`. Underscores stay as they are.

Always prefer the zone of a city near you over a fixed offset. A named zone knows about
daylight saving time and switches automatically when your clocks change. A fixed offset
such as `utc+1` never changes, so it will be an hour off for half of the year in most of
Europe and North America.

Fixed offsets are still useful when you want exactly that: a ship, a research station, or
a team that agreed on one reference time. They are written `utc+9`, `utc-5` or
`utc+0530`, with the minutes optional.

If you are not sure of your zone name, start typing your city in the builder on the help
page. It suggests matching zones as you type.

### Why abbreviations like EST are not accepted

Short names such as EST, IST or CST look convenient, but they are ambiguous. IST can mean
India, Ireland or Israel. CST is used for central North America, China and Cuba, each with
a different offset. Many abbreviations also change with the season, so EST is not the
right name for New York in summer.

Named zones avoid all of this. `asia-kolkata`, `europe-dublin` and `asia-jerusalem` each
point at exactly one set of rules, and the clock picks the right offset for today
automatically. The offset shown on the clock, such as UTC+5:30, is what most people
actually need when they compare times.

### Picking a city when yours is not listed

The time zone database lists one representative city per region rather than every town.
If your city is missing, pick the nearest listed city that shares your rules. Someone in
Osaka uses `asia-tokyo`, someone in Lyon uses `europe-paris`, and someone in Seattle uses
`america-los_angeles`. The city name shown on the clock comes from that zone. Add
`nolabel` if you would rather not show a city at all; the UTC offset still appears unless
you also add `nooffset`.

## Options

Options are path segments after `/clock/`, written in any order. A trailing `.svg` is
allowed and case does not matter. If you mistype something, the image becomes a small pink
notice naming the position of the unknown option.

### Clock

| Option | Effect |
|---|---|
| a zone such as `asia-tokyo` | Time zone (default `utc`) |
| `utc+9`, `utc-0330` | Fixed offset instead of a named zone |
| `digital`, `analog` | Clock style (default `digital`) |
| `12h`, `24h` | Hour format for the digital clock (default `24h`) |
| `seconds` | Show seconds, or a second hand on the analog clock |
| `size-N` | Size in pixels from 16 to 96 (default 40) |

### Annotation

| Option | Effect |
|---|---|
| `label-city` | First line reads "Tokyo" (default) |
| `label-local` | First line reads "Local time in Tokyo" |
| `label-my` | First line reads "My time in Tokyo" |
| `nolabel` | No city text |
| `nooffset` | Hide the UTC offset, which is shown by default |
| `date` | Add the weekday and date |
| `work-H-H` | Working hours, for example `work-9-18` |
| `sleep-H-H` | Sleeping hours (default `sleep-23-7`) |
| `days-mon-fri`, `everyday` | Which days count as working days |
| `kaomoji` | Add a small face to the status line |

### Look

| Option | Effect |
|---|---|
| `card` | Rounded card background |
| `border-N` | Card border in pixels from 0 to 8 |
| `color-RRGGBB` | Accent and time color in hex, without `#` |
| `auto`, `light`, `dark`, `transparent` | Theme (default `auto`) |

## The status line

When you add working hours, a second line appears under the time. It shows one of four
states, worked out for your own zone.

"Working hours" appears on working days between the hours you gave. "Off hours" covers the
rest of a working day. "Weekend" appears on days that are not working days. "Probably
asleep" appears during your sleeping hours on any day, and it takes priority over the
others.

Hours use the 24-hour clock, and a window can wrap past midnight. A night shift written as
`work-22-6` works as expected, and so does a late sleeper's `sleep-2-10`. The end hour is
not included, so `work-9-18` means from 9:00 up to 17:59.

Working days default to Monday through Friday. Write `days-tue-sat` for a Tuesday to
Saturday week, or `everyday` if every day is a working day for you. Ranges wrap around the
week too, so `days-sun-thu` covers Sunday through Thursday.

The status changes on the hour while the page is open, just like the digits, so a profile
left open overnight still shows the right state in the morning.

### Kaomoji

The `kaomoji` option adds a small face to the status line: a determined face during
working hours, a relaxed one after work, a happy one at the weekend and a sleeping one at
night. It is a light touch for profiles that enjoy a bit of character.

If you use `kaomoji` without working hours, the line simply follows the time of day
instead, showing morning, daytime, evening or night with a matching face.

## How it keeps ticking

GitHub does not allow scripts in README images, so a clock cannot update itself in the
usual way. This one works differently.

When a visitor's browser asks for the image, the server draws the current time in your
zone. It also works out the current offset, including daylight saving time. Inside the
image, every digit is a narrow column holding all of its possible values, such as 0 to 9
for the last digit of the minutes. Only one value shows through a small window at a time.

A few lines of CSS slide each column upward at the right speed. The minutes column moves
once a minute and the hours column once an hour. Each column starts at the position that
matches the moment the image was drawn. The analog hands use the same idea and rotate
smoothly from their current angle.

The result is a clock that runs on its own for as long as the page stays open. The image
is never cached, so each new page view starts from the exact current time.

### Accuracy

The clock is accurate to about a second. It can trail by the time it takes the image to
travel from the server to the browser, which is usually a fraction of a second.

If your offset changes while someone has the page open, for example during the night
daylight saving time begins, the clock keeps the old offset until the page reloads. The
date shown by the `date` option is likewise fixed when the image loads. In practice nobody
notices, because profiles are rarely left open across those moments.

### Reduced motion

Some systems ask websites to reduce motion. Windows does this when "Animation effects" is
turned off, and many browsers follow that setting. The clock keeps ticking even then,
because a changing digit is information rather than decoration. The analog second hand
jumps once per second instead of sweeping, which keeps movement to a minimum.

## Recipes

| Look | URL |
|---|---|
| Minimal | `https://readmes.pages.dev/clock/europe-paris` |
| Remote worker | `https://readmes.pages.dev/clock/america-chicago/work-9-17/label-my/card` |
| Night owl | `https://readmes.pages.dev/clock/asia-seoul/sleep-4-12/work-13-22/kaomoji` |
| Analog on dark | `https://readmes.pages.dev/clock/europe-london/analog/dark/card` |
| Big header clock | `https://readmes.pages.dev/clock/australia-sydney/size-72/date` |
| US style | `https://readmes.pages.dev/clock/america-los_angeles/12h/date/card` |

Several clocks side by side work well for teams spread across the world:

```html
<p align="center">
  <img src="https://readmes.pages.dev/clock/america-los_angeles/12h/card" alt="Time in Los Angeles">
  <img src="https://readmes.pages.dev/clock/europe-london/card" alt="Time in London">
  <img src="https://readmes.pages.dev/clock/asia-tokyo/card" alt="Time in Tokyo">
</p>
```

## Making it look right on your profile

A clock works best close to your name or your contact details, where people look when they
want to reach you. Near the top of the README, a modest size of 32 to 48 pixels reads
clearly without dominating the page.

The digital style is the easiest to read at small sizes and suits technical profiles. The
analog style takes a little more space but feels warmer, and pairs well with a card
background and the status line beside it.

Keep annotations to what helps visitors. A city and offset are almost always useful. The
date is nice in a header but redundant in a sidebar. Working hours are valuable if you
want people to know when to expect replies, and unnecessary if you answer whenever you
like.

If your README already uses an accent color, pass it with `color-RRGGBB` so the clock
matches. Leave the theme on `auto` so visitors who use dark mode see light digits on a
dark background, just like the rest of GitHub.

When you show several clocks for a team, give each the same options apart from the zone.
Consistent sizes and labels make the row easy to scan, and `label-city` keeps each card
short.

## Who it helps

Open source maintainers get questions from everywhere. A clock with working hours tells
contributors when a quick review is likely and when an issue will wait until morning,
which sets expectations without anyone needing to ask.

People in remote teams often keep a list of colleagues' time zones in their heads. A clock
on each profile makes that list unnecessary. Before you mention someone in a pull request,
you can see at a glance whether they are working or asleep.

Freelancers and consultants can use the status line as a lightweight availability sign.
Clients who visit the profile see whether this is a good moment to get in touch.

Students and hobbyists who collaborate across continents can simply show where they are.
It makes a profile feel more personal without sharing anything more than a city.

## Troubleshooting

### The clock shows "unknown option"

The notice names the position of the segment it did not understand, counting from the
first segment after `/clock/`. The most common causes are a zone typed with a slash
instead of a hyphen, or a city that is not in the zone list. Use the builder on the help
page to pick a valid zone.

### The time is an hour off

This almost always means a fixed offset is in use during daylight saving time. Replace
something like `utc+1` with a named zone such as `europe-berlin`.

### The status says asleep when I am awake

The default sleeping hours are 23 to 7. Set your own with `sleep-H-H`, for example
`sleep-1-9` if you go to bed late, or a narrow window you are comfortable showing.

### The clock does not tick

Some Markdown previews inside editors show only a still image. The real GitHub profile page
plays the animation. If the clock is still frozen there, a browser extension that blocks
animations may be the cause.

## Accessibility

Every clock image has a title such as "Clock: local time in Tokyo (UTC+9)". Add alt text
like "My local time" when you embed it, so screen reader users know what the image is.

The time itself is drawn as real text inside the image. Screen readers generally treat the
image as a single picture, so the alt text is what gets announced.

The default colors meet WCAG AA contrast against GitHub's light and dark backgrounds, and
the clock follows each visitor's light or dark preference automatically. If you pick your
own color, check that it stays readable in both themes.

## Run your own copy

The demo works for everyone without setup, so most people never need their own copy.
Running one is still easy if you want to change the wording, add a language, or simply
own your infrastructure.

You need Node.js 20 or newer, `make`, and a free Cloudflare account. There is no
`npm install`, because the project has no dependencies.

1. Click "Use this template" on GitHub, create your repository, and clone it.
2. Put your own name and repository link in `site.config.json`.
3. Run `make test`, then deploy.

```sh
npx wrangler pages project create my-badges --production-branch production
make deploy PROJECT=my-badges
```

Your clock is then served at `https://my-badges.pages.dev/clock/<zone>`.

### Project layout

```
functions/clock/        Pages Functions: clock, help page, agents page
src/clock/time.js       zone names, offsets, daylight saving time
src/clock/options.js    URL option parsing
src/clock/render.js     SVG layout and the CSS that keeps it ticking
src/clock/handler.js    request handling
src/clock/pages.js      URL builder and agents guide
test/                   node:test unit tests
```

Everything lives under a `clock` path, so this project can share one Pages project with
other badge apps without file names colliding.

## Web pages

| Path | What it is |
|---|---|
| `/clock/help` | URL builder with a searchable zone list, option tables |
| `/clock/agents` | Markdown guide for AI agents and tools |

The pages include Open Graph tags and schema.org JSON-LD, plus keyboard focus styles and a
skip link. Preview deployments are marked noindex automatically, and scripts are allowed
by hash only through a strict Content Security Policy.

## FAQ

### Does it show the visitor's time or mine?

Yours. The clock shows the time in the zone written in the URL, which is the point: it
tells visitors what time it is for you.

### Will it be right after daylight saving time changes?

Yes, as long as you use a named zone such as `europe-berlin` rather than a fixed offset.
The offset is looked up fresh every time the image loads.

### Why does my clock show the wrong time?

Check the zone name first, because a fixed offset is the most common cause. If the zone is
right and the time is still off, your browser may be showing an old copy. A hard refresh
fixes that.

### Can one image show two time zones?

Not yet. Put two images side by side instead, as in the team example above. Separate
images line up neatly in a centered paragraph, and each one keeps its own label and status
line, which is clearer than squeezing two clocks into one card. On narrow screens GitHub
wraps the images onto separate lines automatically, so the layout stays readable on
phones as well.

### Can it show my city's name in another language?

Not in the demo, which uses the English zone names. Your own copy can change the label
text in a few lines.

### Can I show a custom message instead of the status?

The demo only offers the built-in states, so nobody can put arbitrary text on an image
served from this site. A sibling project in the same series shows fixed words and
owner-chosen status messages.

## Privacy

The clock stores nothing. There are no uploads, forms, cookies or analytics. Each image is
computed only from the URL path and the current time.

The URL does reveal the time zone you chose and, if you add them, your working and
sleeping hours. Everyone who can see your profile can see these, so only add what you are
comfortable sharing.

On GitHub, images are fetched through GitHub's proxy, so the clock normally never sees the
IP addresses of people viewing your profile. As with any website, Cloudflare may keep
standard request logs under its own [privacy policy](https://www.cloudflare.com/privacypolicy/).

## Disclaimer

The hosted demo at `readmes.pages.dev` is provided "as is" and free of charge, without
warranty of any kind, express or implied. That includes warranties of merchantability,
fitness for a particular purpose, availability and non-infringement. It may be
rate-limited, changed or taken offline at any time without notice. The authors are not
liable for any damages arising from its use, including missed meetings or messages sent at
inconvenient hours.

The time shown depends on the time zone data of the platform that runs the clock. Time
zone rules change from time to time by government decision, and updates can take a while
to reach every platform. Do not rely on this clock for anything where the exact time
matters.

This project is not affiliated with, endorsed by or sponsored by GitHub or Cloudflare. All
trademarks belong to their owners.

If you deploy your own copy, you alone are responsible for what it shows. You are also
responsible for following the terms of the services you use and the law where you live.

Nothing in this repository is legal advice. The license texts are the authoritative terms.

## License

The code is licensed under the [GNU AGPL-3.0](LICENSE). If you run a modified version as
a public service, you must offer its source to its users; keeping your template copy public
on GitHub satisfies this. The [NOTICE](NOTICE) file has the details, including a note on
the time zone data.

---

<p align="center"><sub>© 2026 Aesthetic Vulpes (<a href="https://github.com/didvc">github.com/didvc</a>) · <a href="https://readmes.pages.dev/">readmes.pages.dev</a></sub></p>
