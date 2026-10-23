import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";

/* ──────────────────────────────────────────────────────────────
   Shared Open Graph / Twitter share image (1200×630) for content
   routes. Dark canvas matching --bg-primary (dark theme), the kind
   of content as a small label, the title in the heading serif, and
   the wordmark. Fonts are bundled in src/assets/og-fonts (OFL) so
   rendering never depends on a network fetch.
   ────────────────────────────────────────────────────────────── */

export const ogImageSize = { width: 1200, height: 630 };
export const ogImageContentType = "image/png";

const COLORS = {
  bg: "#0d0d0d",
  text: "#E8E0D6",
  secondary: "#B0A89E",
  muted: "#7A736B",
  accent: "#7BA4E0",
  border: "#2A2A2A",
};

const FONT_DIR = path.join(process.cwd(), "src", "assets", "og-fonts");

let assets: Promise<{ serif: Buffer; ui: Buffer; logo: string }> | null = null;

function loadAssets() {
  assets ??= Promise.all([
    readFile(path.join(FONT_DIR, "DMSerifDisplay-Regular.ttf")),
    readFile(path.join(FONT_DIR, "Inter-Medium.ttf")),
    readFile(path.join(process.cwd(), "public", "logo", "apertures-light-512.png")),
  ]).then(([serif, ui, logo]) => ({
    serif,
    ui,
    logo: `data:image/png;base64,${logo.toString("base64")}`,
  }));
  return assets;
}

/** Steps the title down as it gets longer so it always fits in three or four lines. */
function titleSize(title: string): number {
  if (title.length <= 32) return 76;
  if (title.length <= 60) return 64;
  if (title.length <= 90) return 54;
  return 46;
}

interface OgImageInput {
  /** Small label, e.g. "Deep Dive · Episode 02". */
  kind: string;
  title: string;
  /** Parent series or collection, shown under the title. */
  context?: string;
}

export async function renderOgImage({ kind, title, context }: OgImageInput) {
  const { serif, ui, logo } = await loadAssets();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: COLORS.bg,
          padding: "72px 88px 64px",
          color: COLORS.text,
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Inter",
            fontSize: 22,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: COLORS.accent,
          }}
        >
          {kind}
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 980 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "DM Serif Display",
              fontSize: titleSize(title),
              lineHeight: 1.12,
              color: COLORS.text,
            }}
          >
            {title}
          </div>
          {context && (
            <div
              style={{
                display: "flex",
                marginTop: 28,
                fontFamily: "Inter",
                fontSize: 26,
                color: COLORS.secondary,
              }}
            >
              {context}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            borderTop: `1px solid ${COLORS.border}`,
            paddingTop: 28,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={40} height={40} alt="" />
          <div
            style={{
              display: "flex",
              marginLeft: 16,
              fontFamily: "DM Serif Display",
              fontSize: 32,
              color: COLORS.text,
            }}
          >
            Beyond Why
          </div>
        </div>
      </div>
    ),
    {
      ...ogImageSize,
      fonts: [
        { name: "DM Serif Display", data: serif, weight: 400, style: "normal" },
        { name: "Inter", data: ui, weight: 500, style: "normal" },
      ],
    }
  );
}

/* ── BUILDER LOG: the log's own cover, stamped by the site ──
   Builder Log covers (Canva) deliberately leave the day number out; the
   share image puts the 16:9 cover on the dark canvas — letterboxed, never
   cropped — and stamps "Day N" and the series title on it. */

const PUBLIC_DIR = path.join(process.cwd(), "public");
const COVER_TYPES: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" };

/** A public/ image as a data URL, or null if it's missing or a format the
 *  image renderer can't draw. Never reads outside public/. */
async function coverDataUrl(src?: string): Promise<string | null> {
  if (!src || !src.startsWith("/")) return null;
  const filePath = path.join(PUBLIC_DIR, decodeURIComponent(src.split(/[?#]/)[0]));
  const type = COVER_TYPES[path.extname(filePath).toLowerCase()];
  if (!type || !filePath.startsWith(PUBLIC_DIR + path.sep)) return null;
  try {
    return `data:${type};base64,${(await readFile(filePath)).toString("base64")}`;
  } catch {
    return null;
  }
}

interface BuilderLogOgInput {
  /** Site-relative cover path, e.g. "/content/builder-log/<series>/day-40.png". */
  cover?: string;
  /** The big stamp: "Day 40", or "Builder Log" for the series. */
  stamp: string;
  /** Under the stamp: the series title. */
  seriesTitle: string;
  /** Used only by the no-cover fallback card, as its title. */
  fallbackTitle: string;
  /** Fallback card's small label, e.g. "Builder Log · Day 40". */
  fallbackKind: string;
}

export async function renderBuilderLogOgImage({
  cover,
  stamp,
  seriesTitle,
  fallbackTitle,
  fallbackKind,
}: BuilderLogOgInput) {
  const image = await coverDataUrl(cover);
  if (!image) {
    return renderOgImage({ kind: fallbackKind, title: fallbackTitle, context: seriesTitle });
  }
  const { serif, ui } = await loadAssets();
  const coverWidth = Math.round((ogImageSize.height * 16) / 9);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          background: COLORS.bg,
          position: "relative",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} width={coverWidth} height={ogImageSize.height} alt="" />
        <div
          style={{
            position: "absolute",
            top: 36,
            right: 36 + (ogImageSize.width - coverWidth) / 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            maxWidth: 460,
            padding: "18px 26px 20px",
            borderRadius: 18,
            background: "rgba(13, 13, 13, 0.88)",
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <div style={{ display: "flex", fontFamily: "DM Serif Display", fontSize: 56, lineHeight: 1, color: COLORS.accent }}>
            {stamp}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 10,
              fontFamily: "Inter",
              fontSize: 24,
              lineHeight: 1.25,
              textAlign: "right",
              color: COLORS.text,
            }}
          >
            {seriesTitle}
          </div>
        </div>
      </div>
    ),
    {
      ...ogImageSize,
      fonts: [
        { name: "DM Serif Display", data: serif, weight: 400, style: "normal" },
        { name: "Inter", data: ui, weight: 500, style: "normal" },
      ],
    }
  );
}
