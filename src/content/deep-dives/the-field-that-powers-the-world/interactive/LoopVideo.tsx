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
  /** Fraction of the video (0–1) that must be on screen before it plays. Default 1. */
  threshold?: number;
  /** Pause in ms on the last frame before each replay. Default 0 (seamless loop). */
  pauseMs?: number;
}

/**
 * A muted, looping video that only plays while at least `threshold` of it
 * is inside the viewport and pauses as soon as less of it is visible.
 * With `pauseMs`, it holds on the last frame that long before replaying.
 */
export default function LoopVideo({
  src,
  poster,
  label,
  threshold = 1,
  pauseMs = 0,
}: LoopVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let visible = false;
    let restartTimer: ReturnType<typeof setTimeout> | undefined;

    const onEnded = () => {
      restartTimer = setTimeout(() => {
        restartTimer = undefined;
        video.currentTime = 0;
        if (visible) void video.play().catch(() => {});
      }, pauseMs);
    };
    if (pauseMs > 0) video.addEventListener("ended", onEnded);

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio >= threshold;
        // While holding between loops, let the timer resume playback.
        if (restartTimer) return;
        if (visible) {
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold }
    );

    observer.observe(video);
    return () => {
      observer.disconnect();
      video.removeEventListener("ended", onEnded);
      clearTimeout(restartTimer);
    };
  }, [threshold, pauseMs]);

  return (
    <video
      ref={videoRef}
      className={styles.video}
      src={src}
      poster={poster}
      aria-label={label}
      muted
      loop={pauseMs <= 0}
      playsInline
      preload="metadata"
    />
  );
}
