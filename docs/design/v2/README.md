# Beyond Why v2: design spec

This is what to build from. The pictures are in `reference/`: open the HTML
files in a browser (they're static mock-ups, not app code). Swap
`theme-dark` for `theme-light` on the root div to see the light theme.

| File | Shows |
|---|---|
| `reference/home-desktop.html` | Desktop home, top to bottom, including one card's hover card |
| `reference/home-phone.html` | Phone: home, the feed with the tab bar, and an exploration page |
| `reference/icons.html` | The icon set and the timeline |
| `reference/marks.html` | Trail-mark options. **A (icon counts) is chosen.** |

The original baseline mock-ups (claude.ai/artifact/8aMtc7uECQ42TMHANq12k1)
still apply to pages not drawn here: the trail canvas, /builds and
/builds/[slug]. Where Madhav's brief and a mock-up differ, the brief wins.
The current hero stays exactly as it is.

## Principles

1. **Content cards sit on the page; tools sit on surfaces.** Exploration cards
   have no box (a YouTube-style grid). Tiles, polls, the quick-questions list,
   source cards and the hover card sit on `--bg-surface` / `--bg-elevated`
   with a 1px border.
2. Serif (DM Serif Display) for every title and question, Lora for reading
   text and notes, Inter for UI. No other fonts.
3. Interactive text underlines on hover (1px, offset 4px). Buttons don't.
4. Status pills are hairline: 1px border in `currentColor`, no fill.
5. Every tap target is at least 44 × 44px. No emoji anywhere.
6. Both themes, always. Every colour comes from a token.
7. Small labels (kickers, dates, "Next milestone") are 10.5–11.5px Inter 600,
   uppercase, letter-spacing .12em.

## Tokens: mock-up name → globals.css

| Mock-up | Use | Notes |
|---|---|---|
| `--bg` | `--bg-primary` | |
| `--surface` | `--bg-surface` | |
| `--raised` | `--bg-elevated` | hover card, polls, chips |
| `--ink` / `--ink2` / `--muted` | `--text-primary` / `--text-secondary` / `--text-muted` | |
| `--line` / `--line2` | `--border-subtle` / `--border-medium` | |
| `--accent` / `--accent-strong` | `--accent` / `--accent-strong` | don't change their values |
| `--accent-soft` | `--accent-light` | |
| `--green` | `--status-complete` | "Active build" pill, "Build 01" label |
| `--band` | **new: `--bg-band`** | dark `#15140F`, light `#EFE6DA`; build banner only |
| `--t-peri/sand/sage/clay` | **new: `--tone-peri` etc.** | thumbnail backgrounds for motif art; values in the reference files |

## Icons

- `src/components/icons/iconPaths.ts` holds the whole set (36 icons plus the
  timeline star), exported from the icon board. Don't redraw them.
- Build one `<Icon name size label? />` component: `svg viewBox="0 0 24 24"`,
  `fill="none" stroke="currentColor" stroke-width="1.75"
  stroke-linecap="round" stroke-linejoin="round"`; elements with `data-fill`
  get `fill: currentColor; stroke: none`. At 40px and up use stroke 1.4.
  `aria-hidden` unless `label` is given (then `role="img"` + `aria-label`).
- Sizes: 14–16 in meta lines, 20 in buttons and the tab bar, 24+ beside headings.
- Insight is a light bulb. The star means only "important" on a timeline.
- Replace the old icons (`DeepDiveIcon`, `InsightCardIcon`, `BuilderLogIcon`)
  where they're used, once their pages are rebuilt.

## Components

Each one is built once, in the UI kit step, and reused everywhere.

### TrailCounts (option A)
One line under a card title: `[source] 9  [dead end] 1  [experiment] 1  [open] 3 open`.
- Data: `trail.summary`. Sources always shown; dead ends and experiments only
  when > 0; open threads always, in `--accent` with the word "open".
- Icons 14px in `--text-muted`, numbers 13px Inter 500 in `--text-secondary`.
- Visually hidden words after each number ("sources", "dead end"...) for
  screen readers. On the exploration page header the words are visible
  ("9 sources", "1 dead end").

### ExplorationCard and the hover card
- Thumbnail 16:9, radius 12, 1px border, duration badge bottom-right.
  Thumbnail image if the exploration has one, else its motif art on a tone.
- Below: topic kicker (accent), serif title 21px (underline on hover),
  TrailCounts.
- Grid: 4 per row at 1400px and up, 3 from 900px, 2 from 560px, 1 on phones.
  Row gap 48px, column gap 24px.
- Hover card (pointer devices only, `@media (hover: hover)`): opens after
  350ms over the card, on `--bg-elevated`, radius 16, shadow. Contents:
  "How the trail starts" (the first three steps after the question, each with
  its source or step icon), "+ N more steps", topic · minutes, title, a
  one-line teaser, "Leads to" (open-thread texts as dashed accent pills),
  then **Read the story** (solid), **Walk the trail** (outline), and a square
  save button. Also opens on keyboard focus inside the card.

### SectionHeading
Serif h2 (34px desktop / 26px phone), a muted one-line subtitle under it, an
optional "See all" link on the right. Every home section uses it.

### NowStrip (the "right now" tiles)
A row of up to 5 tiles under the hero (a grid on desktop, a side-scrolling
row on phones with the last tile peeking). Each tile: small icon + label at
the top, a serif line and a muted line at the bottom.
- Build: the latest log ("Build 01 · Latest log" / title / "2 days ago").
- Next milestone: "First hover" / "in 13 days".
- New trail: the newest exploration.
- Your vote: "Pick what I explore next" / "N open questions" → #edge.
- Video: optional, from `src/content/curation/homepage.mdx`.

A tile hides itself when its item is older than 14 days (the countdown
doesn't). If fewer than 3 tiles remain, the strip hides.

### TopicPills
A row of hairline pills: **All** first (selected: 1.5px `--text-primary`
border), then one per topic from exploration frontmatter, then
"Has an experiment". On the home feed and /explore it sticks under the nav
(`top: var(--nav-height)`). Selecting one filters the rows below on the
client and sets `?topic=`. Say "All", not "For you": there's no
personalisation yet.

The nav gets the same filter as a pill-shaped "All topics ▾" picker beside
search (desktop nav, phone top bar).

### BuildBanner
Full width, not a card. Background `--bg-band`, fading from and back to
`--bg-primary` over 140px (desktop) / 56px (phone). At least 60vh tall on
desktop.
- Left: the build number as large outlined serif ("01"), kicker
  "Build · Robotics" + hairline status pill, serif title, a two-line
  description, the countdown ("13 days" large serif, then "To the next
  milestone" / name / target date), **Follow the build** and
  **Kit · get notified**.
- Right: the Timeline (across), the latest log as an Expected | Happened
  split, then "Explorations behind this build" as chips.
- Phone: one column; the timeline goes down, newest first; the description
  is dropped.
- The countdown is computed in the browser (it depends on today's date);
  render nothing on the server to avoid a hydration mismatch, or pass the
  request date down.

### Timeline
Used for build milestones and build logs.
- Done: 10px filled circle, `--text-secondary`.
- Important: 20px filled star (`mark-star`), `--accent-strong`. Only when
  the log or milestone has `highlight: breakthrough` or `highlight: milestone`
  in frontmatter.
- Next: 12px ring, 2px `--accent-strong`, filled with the background.
- Planned: 10px ring, 1.5px `--text-muted`.
- The line is solid (1.5px `--text-secondary`) up to today and dashed
  (`--border-medium`) after it.
- Across: up to 4–5 points, each with a date label and a serif title.
- Down: date column, rail, then title and the Expected / Happened / Broke
  notes. Newest first on the build page.

### ExpectedHappened
Two halves side by side (stacked on phones): "What I expected" on
`--bg-elevated`, "What happened" on `--accent-light` with an accent label.
Serif text. Comes from the latest log's frontmatter.

### QuickQuestions
On a surface: up to 5 rows, each a serif question (21px desktop / 18px
phone), TrailCounts under it, minutes on the right (desktop). Hairline
between rows. For short explorations (under about 12 minutes).

### ExperimentCard ("Tried it myself")
Portrait 3:5, radius 16. The experiment's first photo or video poster (else
motif art on a tone). Duration chip top-left for video. Bottom: dark fade,
the experiment title (serif, light text in both themes) and
"Step 5 · <exploration title>". Links to `/explore/<slug>#step-<n>`.
Data: every `experiment` step in every trail.

### SourceCard ("Sources worth your time")
On a surface: type tag (hairline pill), serif title, "Used in N trails".
Only resources used in 2 or more trails. Links to `/resources/<id>`.

### Poll (visual only in the UI kit)
On `--bg-elevated`, radius 16. Header row: uppercase label + muted note.
Serif question. Before voting: a capsule split into up to 3 options (48px
tall). After voting: a 6px bar split by share (your choice in
`--accent-strong`, others in `--text-secondary` / `--border-medium`),
percentages in serif beneath, "You said: …" and **Change my answer**.
Wired up in a later step (guess first, then read; the build prediction).

### EdgeOfMap
Dashed top border. Left: kicker "The edge of the map", serif heading, one
paragraph. Right: open threads, each with the `step-open` icon, the serif
question, "Opened by: <exploration>", and an **I want this** button.

### Phone tab bar
Below 768px only: a floating capsule 22px above the bottom edge, on
`--bg-elevated` with a border and shadow. Home · Explore · Builds · Saved
(20px icons, 11.5px labels). The current tab sits on a darker inner pill.
The top nav keeps only the logo, search and the topic picker on phones.

## The home feed

After the build banner and the sticky TopicPills, the feed is a sequence of
rows. Each row is one of:

1. A card grid row under a rotating heading ("Start anywhere",
   "Robots, and the ideas behind them", ...).
2. QuickQuestions + "New this week" (a larger card) side by side.
3. "Tried it myself" (ExperimentCards).
4. "Sources worth your time" (SourceCards).

Rules: an exploration appears at most once in the whole feed, Most Popular
included. More rows load as you scroll (IntersectionObserver). When nothing
is left, show "More rows load as you scroll. Nothing repeats." only while
loading, then the EdgeOfMap. Row order comes from a seeded generator shared
by server and client (see `src/lib/feedScheduler.ts`), so hydration matches.

## Not now (designed, built later)

- The build prediction poll ("Will it hover by 20 December?").
- "Guess first, then read" on the exploration page (its own step, after the
  story view works).
- Personalised "For you".
