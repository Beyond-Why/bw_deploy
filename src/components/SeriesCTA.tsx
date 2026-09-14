"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./HeroSection.module.css";
import type { EpisodeInfo } from "@/lib/content";
import { getLastOpenedEpisode } from "@/lib/progress";

interface SeriesCTAProps {
  series: string;
  episodes: EpisodeInfo[];
}

export function SeriesCTA({ series, episodes }: SeriesCTAProps) {
  const [targetEpisodeSlug, setTargetEpisodeSlug] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = getLastOpenedEpisode(series);
    // Verify that the stored slug actually exists in our episodes list
    if (stored && episodes.some((ep) => ep.slug === stored)) {
      setTargetEpisodeSlug(stored);
    }
    setIsLoaded(true);
  }, [series, episodes]);

  // Default to first episode if not loaded or if no progress found
  const firstEpisodeSlug = episodes[0]?.slug;
  const href = targetEpisodeSlug
    ? `/deep-dives/${series}/${targetEpisodeSlug}`
    : firstEpisodeSlug
    ? `/deep-dives/${series}/${firstEpisodeSlug}`
    : `/deep-dives/${series}`;

  // Get contextual label text
  let label = "Start Reading";
  if (isLoaded && targetEpisodeSlug) {
    const targetEpisode = episodes.find((ep) => ep.slug === targetEpisodeSlug);
    if (targetEpisode) {
      label = `Continue — Episode ${targetEpisode.episode}`;
    } else {
      label = "Continue";
    }
  }

  return (
    <Link href={href} className={styles.ctaSolid}>
      <span>{label}</span>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </Link>
  );
}
