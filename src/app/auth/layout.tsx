import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

// Metadata only — keeps every /auth page (including the client-rendered
// complete-profile-check, which can't export metadata itself) out of search.
export const metadata: Metadata = { robots: NOINDEX };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
