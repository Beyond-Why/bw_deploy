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

interface OgImageAltInput {
  title: string;
  /** What the page is, e.g. "Deep Dive episode 2". */
  kind: string;
  /** Parent series or collection. */
  context?: string;
  /** The frontmatter's own thumbnailAlt, when the card shows that thumbnail. */
  thumbnailAlt?: string;
}

/**
 * One share image per route, with alt text built from the page's own
 * frontmatter — for generateImageMetadata, since the static `alt` export
 * can't vary by page.
 */
export function ogImageMetadata({ title, kind, context, thumbnailAlt }: OgImageAltInput) {
  const alt = `“${title}” — ${kind}${context ? ` from ${context}` : ""} on Beyond Why${
    thumbnailAlt ? `. ${thumbnailAlt}` : ""
  }`;
  return [{ id: "card", alt, size: ogImageSize, contentType: ogImageContentType }];
}

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

/* ── THUMBNAILS ──
   The page's thumbnail goes into the card, prepared by sharp first so the
   renderer only ever sees a small JPEG (never a multi-MB camera original),
   with EXIF — including any GPS — dropped. Wide-enough sources fill the
   card behind a dark gradient; small ones sit beside the title at no more
   than their natural size, since scaling them up would look soft. */

/** Below this source width a full-bleed background would be visibly upscaled. */
const FULL_BLEED_MIN_WIDTH = 800;
const INSET_MAX = { width: 380, height: 380 };

interface CardThumbnail {
  url: string;
  width: number;
  height: number;
  fullBleed: boolean;
  /** Source narrower than the card — gets a heavier overlay. */
  soft: boolean;
}

const thumbnailCache = new Map<string, Promise<CardThumbnail | null>>();

function cardThumbnail(src?: string): Promise<CardThumbnail | null> {
  if (!src) return Promise.resolve(null);
  let cached = thumbnailCache.get(src);
  if (!cached) {
    cached = prepareThumbnail(src);
    thumbnailCache.set(src, cached);
  }
  return cached;
}

async function prepareThumbnail(src: string): Promise<CardThumbnail | null> {
  const filePath = publicFilePath(src);
  if (!filePath) return null;
  try {
    const { default: sharp } = await import("sharp");
    const meta = await sharp(filePath).metadata();
    // EXIF orientations 5–8 are rotated a quarter turn.
    const swapped = (meta.orientation ?? 1) >= 5;
    const width = (swapped ? meta.height : meta.width) ?? 0;
    const height = (swapped ? meta.width : meta.height) ?? 0;
    if (!width || !height) return null;

    if (width >= FULL_BLEED_MIN_WIDTH) {
      const buffer = await sharp(filePath)
        .rotate()
        .resize(ogImageSize.width, ogImageSize.height, { fit: "cover" })
        .jpeg({ quality: 80 })
        .toBuffer();
      return {
        url: `data:image/jpeg;base64,${buffer.toString("base64")}`,
        ...ogImageSize,
        fullBleed: true,
        soft: width < ogImageSize.width,
      };
    }

    console.warn(
      `[og] ${src} is only ${width}×${height}; placing it beside the title instead of full-bleed. Replace it with a version at least ${ogImageSize.width}px wide.`
    );
    const { data, info } = await sharp(filePath)
      .rotate()
      .resize(INSET_MAX.width, INSET_MAX.height, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer({ resolveWithObject: true });
    return {
      url: `data:image/jpeg;base64,${data.toString("base64")}`,
      width: info.width,
      height: info.height,
      fullBleed: false,
      soft: true,
    };
  } catch (err) {
    console.warn(`[og] couldn't prepare ${src}; using the text-only card`, err);
    return null;
  }
}

interface OgImageInput {
  /** Small label, e.g. "Deep Dive · Episode 02". */
  kind: string;
  title: string;
  /** Parent series or collection, shown under the title. */
  context?: string;
  /** Site-relative thumbnail path; the text-only card is used without one. */
  thumbnail?: string;
}

export async function renderOgImage({ kind, title, context, thumbnail }: OgImageInput) {
  const [{ serif, ui, logo }, thumb] = await Promise.all([loadAssets(), cardThumbnail(thumbnail)]);
  const inset = thumb && !thumb.fullBleed ? thumb : null;

  return new ImageResponse(
    (
      // Outer frame carries no padding so the background layers sit at the
      // card's corner; the padded column is drawn over them.
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: COLORS.bg }}>
        {thumb?.fullBleed && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumb.url}
              width={ogImageSize.width}
              height={ogImageSize.height}
              alt=""
              style={{ position: "absolute", top: 0, left: 0 }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: ogImageSize.width,
                height: ogImageSize.height,
                display: "flex",
                backgroundImage: thumb.soft
                  ? "linear-gradient(180deg, rgba(13,13,13,0.72) 0%, rgba(13,13,13,0.82) 45%, rgba(13,13,13,0.94) 100%)"
                  : "linear-gradient(180deg, rgba(13,13,13,0.55) 0%, rgba(13,13,13,0.7) 45%, rgba(13,13,13,0.9) 100%)",
              }}
            />
          </>
        )}

        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
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

          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", maxWidth: inset ? 980 - inset.width - 56 : 980 }}>
              <div
                style={{
                  display: "flex",
                  fontFamily: "DM Serif Display",
                  // Narrower column beside an inset thumbnail — step the title down to match.
                  fontSize: inset ? Math.round(titleSize(title) * 0.8) : titleSize(title),
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
            {inset && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={inset.url}
                width={inset.width}
                height={inset.height}
                alt=""
                style={{ marginLeft: 56, borderRadius: 12, border: `1px solid ${COLORS.border}` }}
              />
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

/** A site-relative PNG/JPEG path resolved inside public/, or null for
 *  anything else — never a path outside public/. */
function publicFilePath(src?: string): string | null {
  if (!src || !src.startsWith("/")) return null;
  const filePath = path.join(PUBLIC_DIR, decodeURIComponent(src.split(/[?#]/)[0]));
  if (!COVER_TYPES[path.extname(filePath).toLowerCase()]) return null;
  return filePath.startsWith(PUBLIC_DIR + path.sep) ? filePath : null;
}

/** A public/ image as a data URL, or null if it's missing or a format the
 *  image renderer can't draw. */
async function coverDataUrl(src?: string): Promise<string | null> {
  const filePath = publicFilePath(src);
  if (!filePath) return null;
  const type = COVER_TYPES[path.extname(filePath).toLowerCase()];
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
