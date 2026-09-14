import type { Metadata } from "next";
import { DM_Serif_Display, Lora, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { Navigation } from "@/components/Navigation";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getProfileById } from "@/lib/profile";
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

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

/* ── METADATA ── */
export const metadata: Metadata = {
  title: "Beyond Why",
  description:
    "Serialized intellectual journeys, insight cards, and builder logs. Exploring ideas beyond the surface.",
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
      className={`${dmSerifDisplay.variable} ${lora.variable} ${inter.variable}`}
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
