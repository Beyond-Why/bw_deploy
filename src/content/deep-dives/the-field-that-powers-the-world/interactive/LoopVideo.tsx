"use client";

import { useEffect, useRef } from "react";
import styles from "./LoopVideo.module.css";

interface LoopVideoProps {
  /** Path to the video file, e.g. "/content/.../clip.mp4". */
  src: string;
  /** Optional poster frame shown before the video is in view / can play. */
  poster?: string;
  /** Accessible label; the video carries no audio and has no captions/controls. */
  label?: string;
}

/**
 * A muted, looping video that only plays while it is 100% inside the
 * viewport (IntersectionObserver threshold: 1.0) and pauses the moment
 * any part of it scrolls out of view.
 */
export default function LoopVideo({ src, poster, label }: LoopVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      className={styles.video}
      src={src}
      poster={poster}
      aria-label={label}
      muted
      loop
      playsInline
      preload="metadata"
    />
  );
}
