"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./LoopVideo.module.css";

interface LoopVideoProps {
  src: string;
  poster?: string;
  label?: string;
  threshold?: number;
  pauseMs?: number;
}

export default function LoopVideo({
  src,
  poster,
  label,
  threshold = 1,
  pauseMs = 0,
}: LoopVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const reducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  // Sync playing state from the video element (autoplay, intersection pause, etc.)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, []);

  // Update progress bar
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };
    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, []);

  // Intersection-based autoplay (same logic as before)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || reducedMotion) return;

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
  }, [threshold, pauseMs, reducedMotion]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, []);

  // Scrub on progress bar click
  const handleScrub = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const bar = e.currentTarget;
    if (!video || !video.duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    video.currentTime = ratio * video.duration;
  }, []);

  return (
    <figure className={styles.figure} aria-label={label}>
      <div className={styles.videoWrapper} onClick={togglePlay}>
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
        {/* Play/pause overlay button */}
        <button
          className={`${styles.playBtn} ${playing ? styles.playBtnHidden : ""}`}
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          aria-label={playing ? "Pause" : "Play"}
          type="button"
        >
          {playing ? (
            // Pause icon
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            // Play icon
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Progress bar */}
      <div
        ref={progressRef}
        className={styles.progressTrack}
        onClick={handleScrub}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Video progress"
      >
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>
    </figure>
  );
}
