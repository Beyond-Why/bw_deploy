# Exploration trails: log → trail.json

Every exploration is one folder. You write two files by hand and generate the third.

```
src/content/explorations/<slug>/
  log.md       ← you fill this in while learning (one line per step)
  index.mdx    ← the story view, written last (frontmatter id = UUID, as now)
  trail.json   ← generated: node scripts/log-to-trail.js src/content/explorations/<slug>/log.md
```

Install: `log-to-trail.js` → `scripts/`, `trail.ts` → `src/lib/`, and add
`"trail": "node scripts/log-to-trail.js"` to package.json scripts.
Copy `log.md` into each new exploration folder.

## The log: seven step codes

| Code | Step | Line |
|---|---|---|
| Q | Question | `Q \| the question in your words` |
| S | Source | `S \| type \| title \| link [@12:30 / p.45] \| took: … \| led: …` |
| X | Dead end | `X \| type \| title \| link \| why: … \| led: …` |
| I | Insight | `I \| what clicked \| from: 2, 4` |
| E | Experiment | `E \| what you tried \| media links \| tried: … \| saw: …` |
| N | What I think now | `N \| current answer and what's still uncertain \| from: 2-6` |
| O | Open thread | `O \| unfinished question \| next: other-slug` |

- Each step connects from the one above it. `| link: 3 contradicted` connects it from step 3 instead.
- Labels: led me to, went deeper, contradicted, tested in, so I think, opened, reframed.
- Any line that doesn't start with a code is a scratch note and is ignored.
- A second `Q` line means the question changed; keep the old one.
- After publishing, never renumber. Add new steps at the bottom.

## What trail.json holds

- `summary.text` — the card line, e.g. "9 sources · 1 dead end · 3 open threads".
- `resources` — each source once, with a dedupe `key` (`youtube:ID`, `isbn:`, `doi:`, `arxiv:`, `url:`, `note:`), matching the planned `resources` table. YouTube gets a clean URL and thumbnail; other previews come from the server fetcher.
- `steps` — numbered from 1; the anchor is `/explore/<slug>#step-<n>`. YouTube sources with a timestamp get `at` (seconds) so the embed can start there.
- `links` — `{from, to, label}` edges for React Flow.
- `layout` — canvas positions saved by the trail editor, kept across re-runs. Steps without one get an automatic top-to-bottom layout.

The converter stops with line numbers if a step can't be read (unknown source type, missing title, a link pointing at a later step, no Q first) and warns about missing took/led/why/saw notes, a missing N step, or no open threads. `--check` validates without writing.
