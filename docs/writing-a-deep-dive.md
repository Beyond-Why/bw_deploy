# Writing a Deep Dive

One series = one folder. One episode = one MDX file. Interactive components are documented in `src/content/deep-dives/INTERACTIVE_COMPONENTS.md`; this page covers files and frontmatter.

## Where files go

```
src/content/deep-dives/<series>/index.mdx        series info (the hub page)
src/content/deep-dives/<series>/episode_<n>.mdx  one per episode
public/content/deep-dives/<series>/              thumbnails and images the episodes use
```

## Series: `index.mdx`

```yaml
---
id: "<new UUID>"            # permanent; generate once (e.g. `uuidgen`), never change
title: "The Field That Powers The World"
description: "The premise, shown on the hub and used as the meta description."
category: "Foundation & Reality"
status: "in-progress"       # in-progress | complete | planned | paused
date: "2026-09-14"
thumbnail: "/content/deep-dives/<series>/main-thumbnail.png"
thumbnailAlt: "What the image shows, for screen readers and search."
---
```

## Episode: `episode_<n>.mdx`

```yaml
---
id: "<new UUID>"            # permanent, unique across the whole site
title: "The Space That Isn't Empty"
description: "One or two sentences — the meta description and share text."
episode: 1
date: "2026-09-14"          # YYYY-MM-DD; datePublished and the sitemap's lastmod
thumbnail: "/content/deep-dives/<series>/ep1-thumbnail.jpg"
thumbnailAlt: "What the image shows, for screen readers and search."
---
```

Thumbnails: aim for at least 1200px wide (the share card fills 1200×630; anything under 800px wide is shown small beside the title instead), and strip camera EXIF/GPS before committing.

## Optional fields

These work on both `index.mdx` and episode files.

| Field | What it does |
|---|---|
| `seoTitle` | Replaces the title in the browser tab, search results and link previews (`<title>`, `og:title`, `twitter:title`). " \| Beyond Why" is still appended. The title on the page itself never changes. Without it, an episode uses "Episode title — Series title" and a hub uses its title. |
| `keywords` | A list of strings, e.g. `keywords: ["electric field", "Poynting vector"]`. Goes into the episode's Article structured data (`"keywords"`) only — there's no `<meta name="keywords">` tag, which search engines ignore. An episode without its own list uses the series' list. |
| `seoDescription` | Replaces `description` for the meta description only. |
| `updated` | Date of the last meaningful revision — the sitemap's lastmod and `dateModified`. |
| `publishedAt` | Go-live date. A future date keeps the page out of the sitemap and marks it noindex until then. |
| `comingSoon` / `eta` | Shows a coming-soon placeholder instead of the live entry; kept out of the sitemap. |
| `draft: true` | Hidden in production builds, visible in `npm run dev`. |
