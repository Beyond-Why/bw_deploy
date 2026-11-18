/* ──────────────────────────────────────────────────────────────
   Exploration log → trail.json

   Reads the one-line-per-step log you keep while learning
   (src/content/explorations/<slug>/log.md) and writes the
   trail.json the website draws the canvas from, next to it.

   Run: node scripts/log-to-trail.js src/content/explorations/<slug>/log.md
        node scripts/log-to-trail.js <log.md> --check   (validate only)

   No dependencies. If index.mdx sits in the same folder, its
   frontmatter `id` becomes the trail's explorationId. Canvas
   positions already saved in trail.json ("layout") are kept.
   ────────────────────────────────────────────────────────────── */

const fs = require("fs");
const path = require("path");

const SOURCE_TYPES = [
  "video", "article", "book", "paper", "podcast",
  "conversation", "tool", "course", "datasheet",
];
const LABELS = [
  "led me to", "went deeper", "contradicted", "tested in",
  "so I think", "opened", "reframed",
];
const KIND = {
  Q: "question", S: "source", X: "deadEnd", I: "insight",
  E: "experiment", N: "now", O: "openThread",
};
const DEFAULT_LABEL = {
  question: "reframed", source: "led me to", deadEnd: "led me to",
  insight: "so I think", experiment: "tested in", now: "so I think",
  openThread: "opened",
};
const NAMED = ["took", "led", "why", "from", "tried", "saw", "next", "link"];

const errors = [];
const warnings = [];
const err = (line, msg) => errors.push(`line ${line}: ${msg}`);
const warn = (line, msg) => warnings.push(line ? `line ${line}: ${msg}` : msg);

function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const data = {};
  if (!m) return { data, body: text, offset: 0 };
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
    if (kv) data[kv[1]] = kv[2];
  }
  return { data, body: text.slice(m[0].length), offset: m[0].split("\n").length - 1 };
}

function parseNums(s, line) {
  const out = [];
  for (const part of s.split(",").map((p) => p.trim()).filter(Boolean)) {
    const r = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (r) for (let i = +r[1]; i <= +r[2]; i++) out.push(i);
    else if (/^\d+$/.test(part)) out.push(+part);
    else err(line, `can't read step number "${part}"`);
  }
  return out;
}

function parseLinks(s, line) {
  return s.split(",").map((p) => p.trim()).filter(Boolean).map((p) => {
    const m = p.match(/^(\d+)\s+(.+)$/);
    if (!m) { err(line, `link should look like "3 contradicted", got "${p}"`); return null; }
    if (!LABELS.includes(m[2])) err(line, `unknown link label "${m[2]}" (use: ${LABELS.join(", ")})`);
    return { from: +m[1], label: m[2] };
  }).filter(Boolean);
}

/* A link field is "URL [locator]". Locator: @12:30, p.45, ch.19 ... */
function splitLink(field) {
  const parts = field.trim().split(/\s+/);
  let url = parts[0] && parts[0] !== "-" ? parts[0] : null;
  let locator = parts.slice(1).join(" ") || null;
  if (url && !/^(https?:\/\/|isbn:|doi:|arxiv:)/i.test(url)) {
    locator = [url, locator].filter(Boolean).join(" ");
    url = null;
  }
  if (locator) locator = locator.replace(/^@/, "");
  return { url, locator };
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

/* One key per real-world source, so the same video or book used in
   several trails is one resource row (matches resources.key). */
function resourceKey(url, title) {
  if (!url) return `note:${slugify(title)}`;
  const isbn = url.match(/^isbn:([\dXx-]+)/i);
  if (isbn) return `isbn:${isbn[1].replace(/-/g, "").toUpperCase()}`;
  const doi = url.match(/(?:^doi:|doi\.org\/)(10\.\S+)/i);
  if (doi) return `doi:${doi[1].toLowerCase()}`;
  const arxiv = url.match(/(?:^arxiv:|arxiv\.org\/(?:abs|pdf)\/)([\w.\/-]+?)(?:v\d+)?(?:\.pdf)?$/i);
  if (arxiv) return `arxiv:${arxiv[1]}`;
  let u;
  try { u = new URL(url); } catch { return `url:${url}`; }
  const host = u.hostname.replace(/^www\.|^m\./, "");
  let yt = null;
  if (host === "youtu.be") yt = u.pathname.slice(1);
  else if (host.endsWith("youtube.com")) {
    yt = u.searchParams.get("v") ||
      (u.pathname.match(/^\/(?:shorts|live|embed)\/([\w-]{11})/) || [])[1];
  }
  if (yt) return `youtube:${yt.slice(0, 11)}`;
  for (const k of [...u.searchParams.keys()]) {
    if (/^(utm_|fbclid|gclid|si$|ref$)/.test(k)) u.searchParams.delete(k);
  }
  const q = u.searchParams.toString();
  return `url:${host}${u.pathname.replace(/\/$/, "")}${q ? "?" + q : ""}`;
}

function youtubeSeconds(locator) {
  const m = locator && locator.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
  return m ? (+(m[1] || 0)) * 3600 + +m[2] * 60 + +m[3] : null;
}

function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes("--check");
  const logPath = args.find((a) => !a.startsWith("--"));
  if (!logPath) {
    console.error("usage: node scripts/log-to-trail.js <path/to/log.md> [--check]");
    process.exit(2);
  }
  const dir = path.dirname(logPath);
  const raw = fs.readFileSync(logPath, "utf8");
  const { data, body, offset } = frontmatter(raw);
  const noComments = body.replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, ""));

  const steps = [];
  const links = [];
  const resources = new Map();

  noComments.split(/\r?\n/).forEach((text, i) => {
    const line = i + 1 + offset;
    const m = text.match(/^\s*([QSXIENO])\s*\|(.*)$/);
    if (!m) return; // scratch notes
    const kind = KIND[m[1]];
    const n = steps.length + 1;
    const fields = m[2].trim().split(/\s*\|\s*/).map((f) => f.trim());
    const pos = [];
    const named = {};
    for (const f of fields) {
      const nm = f.match(/^(\w+):\s*(.*)$/);
      if (nm && NAMED.includes(nm[1].toLowerCase())) named[nm[1].toLowerCase()] = nm[2].trim();
      else pos.push(f);
    }
    while (pos.length && pos[pos.length - 1] === "") pos.pop();

    const step = { n, kind, line };
    if (kind === "source" || kind === "deadEnd") {
      const [type, title, linkField = ""] = pos;
      if (!SOURCE_TYPES.includes((type || "").toLowerCase()))
        err(line, `source type "${type}" unknown (use: ${SOURCE_TYPES.join(", ")})`);
      if (!title) err(line, "source has no title");
      const { url, locator } = splitLink(linkField);
      const key = resourceKey(url, title || "untitled");
      if (!resources.has(key)) {
        const r = { key, type: (type || "").toLowerCase(), title: title || "", url };
        if (key.startsWith("youtube:")) {
          r.url = `https://www.youtube.com/watch?v=${key.slice(8)}`;
          r.thumbnail = `https://i.ytimg.com/vi/${key.slice(8)}/hqdefault.jpg`;
        }
        resources.set(key, r);
      }
      step.resource = key;
      if (locator) step.locator = locator;
      if (key.startsWith("youtube:") && youtubeSeconds(locator) !== null)
        step.at = youtubeSeconds(locator);
      if (kind === "source") {
        step.took = named.took || "";
        step.led = named.led || "";
        if (!step.took) warn(line, "source has no took: note");
        if (!step.led) warn(line, "source has no led: note");
      } else {
        step.why = named.why || "";
        if (named.led) step.led = named.led;
        if (!step.why) warn(line, "dead end has no why: note");
      }
    } else if (kind === "experiment") {
      step.title = pos[0] || "";
      if (pos[1]) step.media = pos[1].split(",").map((s) => s.trim()).filter(Boolean);
      step.tried = named.tried || "";
      step.saw = named.saw || "";
      if (!step.title) err(line, "experiment has no title");
      if (!step.saw) warn(line, "experiment has no saw: note");
    } else {
      step.text = pos.join(" | ");
      if (!step.text) err(line, `${kind} step is empty`);
      if (named.from) step.from = parseNums(named.from, line);
      if (kind === "openThread") step.next = named.next || null;
    }

    // links into this step: from the step above, unless link: says otherwise.
    // (from: on I and N is a citation shown on the card, not extra arrows.)
    if (named.link) {
      for (const l of parseLinks(named.link, line)) links.push({ from: l.from, to: n, label: l.label, line });
    } else if (n > 1) {
      links.push({ from: n - 1, to: n, label: DEFAULT_LABEL[kind], line });
    }
    steps.push(step);
  });

  // checks
  if (!steps.length) err(0, "no steps found");
  else if (steps[0].kind !== "question") err(steps[0].line, "the first step must be the question (Q)");
  for (const l of links) {
    if (l.from >= l.to) err(l.line, `step ${l.to} links from step ${l.from}, which isn't above it`);
  }
  for (const s of steps) {
    for (const f of s.from || []) if (f >= s.n) err(s.line, `from: ${f} isn't an earlier step`);
  }
  const count = (k) => steps.filter((s) => s.kind === k).length;
  if (!count("now")) warn(null, 'no "what I think now" (N) step yet');
  if (!count("openThread")) warn(null, "no open threads (O) yet; a trail shouldn't end on a full stop");

  warnings.forEach((w) => console.warn("warning: " + w));
  if (errors.length) {
    errors.forEach((e) => console.error("error: " + e));
    process.exit(1);
  }

  const summary = {
    sources: count("source") + count("deadEnd"),
    deadEnds: count("deadEnd"),
    experiments: count("experiment"),
    openThreads: count("openThread"),
  };
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  summary.text = [
    plural(summary.sources, "source"),
    summary.deadEnds && plural(summary.deadEnds, "dead end"),
    summary.experiments && plural(summary.experiments, "experiment"),
    plural(summary.openThreads, "open thread"),
  ].filter(Boolean).join(" · ");

  let explorationId = null;
  const mdx = path.join(dir, "index.mdx");
  if (fs.existsSync(mdx)) explorationId = frontmatter(fs.readFileSync(mdx, "utf8")).data.id || null;
  if (!explorationId) warn(null, "no index.mdx with an id beside the log; explorationId left empty");

  const outPath = path.join(dir, "trail.json");
  let layout = {};
  if (fs.existsSync(outPath)) {
    try { layout = JSON.parse(fs.readFileSync(outPath, "utf8")).layout || {}; } catch {}
  }

  const trail = {
    version: 1,
    explorationId,
    slug: data.slug || path.basename(dir),
    question: steps[0].text,
    started: data.started || null,
    updated: new Date().toLocaleDateString("en-CA"), // local YYYY-MM-DD
    summary,
    resources: [...resources.values()],
    steps: steps.map(({ line, ...s }) => s),
    links: links.map(({ line, ...l }) => l),
    layout,
  };

  if (checkOnly) {
    console.log(`ok: ${steps.length} steps · ${summary.text}`);
    return;
  }
  fs.writeFileSync(outPath, JSON.stringify(trail, null, 2) + "\n");
  console.log(`wrote ${outPath}: ${steps.length} steps · ${summary.text}`);
}

main();
