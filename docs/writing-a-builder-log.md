# Writing a Builder Log

One series = one folder. One log = one MDX file, named by the day of the build. The full design is in `docs/specs/builder-log-spec.md`; this page is just what you need to write.

## Where files go

```
src/content/builder-log/<series>/index.mdx        series info + optional "Meet the robot" intro (the body)
src/content/builder-log/<series>/episode_<day>.mdx one per log; <day> = days since the build started
public/content/builder-log/<series>/day-<day>.png  covers (and any photos/videos the logs use)
```

Gaps are normal: `episode_1`, `episode_4`, `episode_10`… The file name *is* the day; the build fails if `episode:` in the frontmatter disagrees.

## Series: `index.mdx`

```yaml
---
id: "<new UUID>"            # permanent; generate once (e.g. `uuidgen`), never change
title: "Teaching a Robot to Follow a Line"
description: "One-line premise, shown under the title."
category: "e-Yantra Robotics Competition"
status: "in-progress"       # in-progress | complete | planned | paused
date: "2026-09-03"          # the day the build started
thumbnail: "/content/builder-log/<series>/day-1.png"
thumbnailAlt: "What the cover shows, for screen readers."
draft: true                 # hides the series in production; delete this line to go live
---

Optional "Meet the robot" intro — shown when readers press "New here? Meet the robot".
```

## Log: `episode_<day>.mdx` (copy-paste template)

```yaml
---
id: "<new UUID>"                        # permanent, unique across the whole site
title: "The real arena isn't the practice mat"
episode: 40                             # the day number — must match episode_40.mdx
date: "2026-10-12"                      # YYYY-MM-DD, shown as "Mon 12 Oct"
excerpt: "It rolled up to the very first junction and just stared at it."  # one line; the homepage quote when it's the newest log
highlight: "breakthrough"               # breakthrough | milestone — or leave the line out
thumbnail: "/content/builder-log/<series>/day-40.png"   # 16:9 cover
thumbnailAlt: "What the cover shows."   # required whenever there's a thumbnail
video: "/content/builder-log/<series>/videos/day-40.mp4"  # optional: a file path or a YouTube id (e.g. aqz-KE-bpKQ)
videoLength: "0:28"                     # optional: the clip length shown on the cover
explore: ["the-field-that-powers-the-world"]  # optional: Deep Dive slugs for "Explore more" on the log's share page
draft: true                             # optional: hides just this log in production
---
```

With `video` set, the cover becomes the poster with a play button; nothing plays until it's clicked. A video file that doesn't exist yet just leaves the plain cover.

## Breakthrough or milestone?

- **breakthrough** (spark ✦): the day something finally *worked* that hadn't before. A surprise, a fix that clicked.
- **milestone** (diamond ◆): a goal from the plan, reached. Expected, but a step done.
- Most days are neither; leave `highlight` out. Highlights get a mark on every track, and the most recent ones hang as cards on the homepage banner, so keep them rare.

## Writing the body

Write it like a diary. Anything technical goes in a Toggle so curious readers can open it and everyone else can skim past.

| Component | One-line example |
| --- | --- |
| Entry (a timestamped moment) | `<Entry time="10:20">` … text … `</Entry>` |
| Toggle (under the hood, closed by default) | `<Toggle title="Sensor readings">` … text, code, tables … `</Toggle>` |
| Gallery (3 photos in a row; a swipe strip on phones) | `<Gallery><Photo src="/content/…/a.png" alt="…" caption="…" /> …</Gallery>` |
| Photo on its own (full width) | `<Photo src="/content/…/a.png" alt="…" caption="…" />` |
| Compare (two side by side, captions as corner labels) | `<Compare caption="Same corner, three hours apart"><Photo … /><Photo … /></Compare>` |
| Lesson ("What I learned") | `<Lesson>If the robot can tell you how wrong it is, use that.</Lesson>` |
| Table | Markdown: `\| Surface \| Dark hall \|` then `\| --- \| --- \|` then rows |
| Diagram | A fenced code block with `mermaid` as its language |

Leave a blank line after an opening tag and before its closing tag, so the text inside is read as paragraphs. Missing photo files show a quiet placeholder with the alt text, never a broken image.

## How folding decides

- **Desktop and tablet:** the first 3 logs in the current order (newest first, or from Day 1) always show in full. Any later log whose body is taller than 720px folds to 300px with "Read the whole log" and a hint counted from the body ("Inside: 3 photos and a look under the hood"). Short logs never fold. A `#day-N` link opens its log.
- **Phone:** nothing folds. One log fills the screen and simply scrolls.

## Thumbnails (covers)

- 16:9 at **1280×720** (or 1600×900). Never cropped anywhere.
- Words on the left, the robot on the right, a thin stripe in the site blue **`#7BA4E0`** along the bottom.
- **No day number.** The site stamps "Day N" on share images and shows it everywhere else.
- Keep the **bottom-right corner clear**: the clip length sits there on logs with a video.
- Save as PNG or JPEG (share images can't use WebP) under `public/content/builder-log/<series>/`.
- Placeholders for testing: `node scripts/generate-builder-log-placeholders.js` (writes the sample series' covers).

## Launch, step by step

1. Delete the sample series: `src/content/builder-log/line-follower/` and `public/content/builder-log/line-follower/`. If you keep the placeholder script, point `OUT_DIR` and the lists in it at your series or delete it too.
2. Create `src/content/builder-log/<your-series>/index.mdx` and the `episode_<day>.mdx` files from the templates above, with fresh UUIDs for every `id`. Put the covers in `public/content/builder-log/<your-series>/`.
3. Make sure no `draft: true` line is left in the series or any log you want live.
4. Run `npm run validate:content`, which checks ids are unique UUIDs and every `episode:` matches its file name.
5. Run `npm run build` (it fails on bad content), then deploy.
6. Check on the live site: `/builder-log/<your-series>`, one log's share page, the Builder Log banner on the home page and in the "Builder Logs" tab, and that the series and its logs appear in `/sitemap.xml`.
