"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

// Module-level, so it survives the client-side route change: set on
// click, read by the next EpisodeReader's useState initializer, cleared
// in its mount effect. A fresh load/refresh re-evaluates the module
// (false), so server-rendered HTML is never hidden behind an opacity-0
// fade-in that would only lift after hydration. Read and clear are
// separate so StrictMode's double-invoked initializer sees the same value.
let fadeInPending = false;

/** True if this mount was reached via an EpisodeNavLink click. */
export function isEpisodeFadeInPending(): boolean {
  return fadeInPending;
}

export function clearEpisodeFadeIn(): void {
  fadeInPending = false;
}

interface EpisodeNavLinkProps {
  href: string;
  className?: string;
  /** Runs before navigating, e.g. the reader's fade-out + markCompleted. */
  onNavigate?: () => void;
  children: ReactNode;
}

/**
 * Prev/next episode link. Still a real <Link> (href, prefetch,
 * middle/cmd-click into a new tab), but a plain left click is taken over:
 * onNavigate runs first so the reader can start its fade-out, then
 * router.push. With no episode loading.tsx, the push is a transition that
 * keeps the dimmed episode on screen until the next one is ready.
 */
export function EpisodeNavLink({ href, className, onNavigate, children }: EpisodeNavLinkProps) {
  const router = useRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    onNavigate?.();
    fadeInPending = true;
    router.push(href);
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
