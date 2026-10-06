import type { Metadata } from "next";
import { DM_Serif_Display, Lora, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { Navigation } from "@/components/Navigation";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getProfileById } from "@/lib/profile";
import { SITE_DESCRIPTION, SITE_LOCALE, SITE_NAME, SITE_URL } from "@/lib/seo";
import "katex/dist/katex.min.css";
import "./globals.css";

/* ── FONTS ── */
const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lora",
  display: "swap",
});

/* True italic cuts for the episode emphasis components (PullQuote,
   Closer), so they never fall back to synthesized italics. Separate
   instances keep the download to the one weight each actually needs.
   They register under the same family names, so any other italic in
   those families (e.g. Lora <em>) also picks up the real cut. */
const dmSerifDisplayItalic = DM_Serif_Display({
  weight: "400",
  style: "italic",
  subsets: ["latin"],
  variable: "--font-dm-serif-italic",
  display: "swap",
});

const loraItalic = Lora({
  weight: "400",
  style: "italic",
  subsets: ["latin"],
  variable: "--font-lora-italic",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

/* ── METADATA ── */
// Pages set a bare title; the template adds the site name. Nested objects
// (openGraph, twitter) are replaced, not merged, by a page that sets its
// own — see pageMetadata() in lib/seo.ts. The homepage's canonical and
// og:url live on app/page.tsx, not here: anything set here is inherited
// by every route (sign-in, 404s, …) that doesn't override it.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s — ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: [
      {
        url: "/logo/apertures-light-favicon-512.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/logo/apertures-ink-favicon-512.png",
        media: "(prefers-color-scheme: light)",
      },
    ],
  },
};

/* ── ROOT LAYOUT ── */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Seeds ProfileContext so the navbar/dropdown avatar renders correctly
  // on first paint — getProfileById is React-cache-deduped, so this
  // doesn't add a DB round trip beyond what Navigation already does.
  const user = await getCurrentUser();
  const profile = user ? await getProfileById(user.id) : null;

  return (
    <html
      lang="en"
      className={`${dmSerifDisplay.variable} ${lora.variable} ${inter.variable} ${dmSerifDisplayItalic.variable} ${loraItalic.variable}`}
      // ThemeProvider applies data-theme to document.documentElement (this
      // <html> tag, not <body>) after mount — setting it here too means
      // the correct value is already present in the server-rendered
      // markup, so dark-mode tokens resolve correctly from first paint
      // instead of waiting on that client effect.
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        {/* Belt-and-suspenders against a pre-hydration flash: fires before
            any JS runs, so <body>'s hardcoded background (see globals.css)
            is backed up even if this stylesheet hasn't loaded yet. */}
        <style>{`html, body { background: #0d0d0d; }`}</style>
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <ToastProvider>
            <ProfileProvider initialAvatarUrl={profile?.avatarUrl ?? null}>
              <Navigation />
              <main>{children}</main>
            </ProfileProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
