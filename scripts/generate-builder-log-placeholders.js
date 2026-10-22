/* ──────────────────────────────────────────────────────────────
   Placeholder images for the sample Builder Log series.

   Writes 1280x720 PNG covers (day-<n>.png) and in-body photos into
   public/content/builder-log/line-follower/. They're deliberately
   obvious stand-ins: light background, a few words on the left, an
   empty "robot" frame on the right, a thin blue stripe along the
   bottom, no day number and the bottom-right corner left clear for a
   clip length (see docs/specs/builder-log-spec.md, Thumbnails).

   Run: node scripts/generate-builder-log-placeholders.js
   Replace each file with the real Canva export when the log goes live.
   ────────────────────────────────────────────────────────────── */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const OUT_DIR = path.join(process.cwd(), "public", "content", "builder-log", "line-follower");
const WIDTH = 1280;
const HEIGHT = 720;

// Light-theme --accent from src/app/globals.css.
const ACCENT = "#5887D3";
const BACKGROUND = "#F6F2EC";
const INK = "#2A2A2A";
const MUTED = "#9A8F80";

const COVERS = {
  "day-1": ["It arrives"],
  "day-4": ["One whole", "metre"],
  "day-10": ["It grabs"],
  "day-18": ["Wrong room"],
  "day-20": ["What black", "means"],
  "day-32": ["No more", "wobble"],
  "day-37": ["The whole", "job"],
  "day-40": ["The real", "arena"],
};

const PHOTOS = {
  "photo-20-before": ["Before", "calibration"],
  "photo-20-after": ["After", "calibration"],
  "photo-32-straight": ["On the", "straight"],
  "photo-32-curve": ["On the", "curve"],
  "photo-32-tuning": ["Tuning"],
  "photo-37-pickup": ["Pickup"],
  "photo-37-drop": ["Drop"],
  "photo-40-mat": ["Home mat"],
  "photo-40-arena": ["Real arena"],
};

function escapeXml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function svg(lines, kind) {
  const lineHeight = 104;
  const top = HEIGHT / 2 - ((lines.length - 1) * lineHeight) / 2 + 30;
  const words = lines
    .map(
      (line, i) =>
        `<text x="96" y="${top + i * lineHeight}" font-family="DejaVu Serif, Georgia, serif" font-size="88" fill="${INK}">${escapeXml(line)}</text>`
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <rect width="100%" height="100%" fill="${BACKGROUND}"/>
  <text x="96" y="120" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" letter-spacing="4" fill="${MUTED}">PLACEHOLDER ${kind}</text>
  ${words}
  <rect x="800" y="150" width="380" height="380" rx="28" fill="none" stroke="${MUTED}" stroke-width="4" stroke-dasharray="18 14"/>
  <text x="990" y="350" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="30" fill="${MUTED}">robot</text>
  <rect x="0" y="${HEIGHT - 14}" width="${WIDTH}" height="14" fill="${ACCENT}"/>
</svg>`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const jobs = [
    ...Object.entries(COVERS).map(([name, lines]) => [name, lines, "COVER"]),
    ...Object.entries(PHOTOS).map(([name, lines]) => [name, lines, "PHOTO"]),
  ];
  for (const [name, lines, kind] of jobs) {
    const file = path.join(OUT_DIR, `${name}.png`);
    await sharp(Buffer.from(svg(lines, kind))).png({ compressionLevel: 9 }).toFile(file);
    console.log(path.relative(process.cwd(), file));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
