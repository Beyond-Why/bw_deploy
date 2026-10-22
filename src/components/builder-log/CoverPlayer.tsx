"use client";

import { useState, type ReactNode } from "react";
import YouTubeEmbed from "@/components/mdx/YouTubeEmbed";
import styles from "./LogCover.module.css";

/**
 * A cover that's also a video poster: a round play button in the middle
 * and the clip length bottom-right. Nothing loads or plays until the
 * reader clicks; then the video replaces the cover in place.
 */
export default function CoverPlayer({
  cover,
  video,
  youtubeId,
  length,
  title,
}: {
  cover: ReactNode;
  /** A file path, when the video is a file. */
  video?: string;
  /** A YouTube id, when the video is on YouTube. */
  youtubeId?: string;
  length?: string;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing && youtubeId) {
    return (
      <div className={styles.player}>
        <YouTubeEmbed id={youtubeId} title={title} autoplay />
      </div>
    );
  }
  if (playing && video) {
    return (
      <div className={styles.frame}>
        <video className={styles.video} src={video} controls autoPlay playsInline />
      </div>
    );
  }

  return (
    <div className={styles.frame}>
      {cover}
      <button
        type="button"
        className={styles.play}
        onClick={() => setPlaying(true)}
        aria-label={`Play the video${length ? ` (${length})` : ""}: ${title}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M8 5.5v13l11-6.5z" />
        </svg>
      </button>
      {length && (
        <span className={styles.length} aria-hidden="true">
          {length}
        </span>
      )}
    </div>
  );
}
