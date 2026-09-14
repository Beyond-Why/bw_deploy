"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./ShareModal.module.css";

interface ShareModalProps {
  /** Absolute URL of the thing being shared. */
  url: string;
  /** Used to seed WhatsApp/X share text — falls back to just the URL. */
  shareTitle?: string;
  onClose: () => void;
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.18.2-.35.22-.65.08-.3-.15-1.28-.47-2.43-1.5-.9-.8-1.5-1.79-1.68-2.09-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.68-1.64-.93-2.24-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.53.08-.8.38-.28.3-1.05 1.02-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.13 3.25 5.16 4.56.72.31 1.28.5 1.72.63.72.23 1.38.2 1.9.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.18-1.43-.08-.13-.28-.2-.58-.35z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.87.5 3.62 1.4 5.13L2 22l5.13-1.5a9.86 9.86 0 0 0 4.9 1.32h.01c5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm0 18.1a8.15 8.15 0 0 1-4.16-1.14l-.3-.18-3.05.89.9-2.97-.2-.31a8.13 8.13 0 0 1-1.25-4.48c0-4.5 3.66-8.16 8.16-8.16a8.1 8.1 0 0 1 5.77 2.39 8.1 8.1 0 0 1 2.39 5.77c0 4.5-3.66 8.19-8.26 8.19z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14.5 8.5h2V5.6c-.35-.05-1.54-.15-2.94-.15-2.9 0-4.9 1.77-4.9 5.02v2.5H6v3.3h3.16V22h3.4v-5.73h3.03l.48-3.3h-3.51v-2.14c0-.96.26-1.62 1.64-1.62z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.9 3H22l-7.2 8.23L23 21h-6.6l-5.17-6.36L5.3 21H2.2l7.7-8.8L2 3h6.75l4.67 5.82L18.9 3zm-1.16 16.2h1.72L7.35 4.7H5.5l12.24 14.5z" />
    </svg>
  );
}

/** Auto-close countdown — pausable, resumes from where it left off rather
 *  than restarting (see the mouseenter/mouseleave handlers below). */
const AUTO_CLOSE_MS = 10000;

export function ShareModal({ url, shareTitle, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [paused, setPaused] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-close timer state. Kept in refs (not React state) since they're
  // read/written inside event handlers and a timeout callback, none of
  // which should trigger a re-render on their own.
  const remainingRef = useRef(AUTO_CLOSE_MS);
  const runStartedAtRef = useRef(0);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, [onClose]);

  // Auto-close countdown — separate effect so remounting (a fresh "open")
  // always starts a clean 10s run, independent of the escape/scroll-lock
  // effect above.
  useEffect(() => {
    runStartedAtRef.current = Date.now();
    closeTimerRef.current = setTimeout(onClose, remainingRef.current);

    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [onClose]);

  const handlePanelMouseEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    const elapsed = Date.now() - runStartedAtRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    setPaused(true);
  };

  const handlePanelMouseLeave = () => {
    runStartedAtRef.current = Date.now();
    closeTimerRef.current = setTimeout(onClose, remainingRef.current);
    setPaused(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API unavailable/denied — the URL is still visible and
      // selectable in the input, so the reader can copy it manually.
    }
    setCopied(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [url]);

  const shareText = shareTitle ? `${shareTitle} — ${url}` : url;
  const openShareWindow = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <div ref={overlayRef} className={styles.overlay} onClick={handleOverlayClick}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Share"
        onMouseEnter={handlePanelMouseEnter}
        onMouseLeave={handlePanelMouseLeave}
      >
        <button type="button" className={styles.closeButton} aria-label="Close" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className={styles.title}>Share</h2>

        <div className={styles.iconRow}>
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.brandWhatsapp}`}
            aria-label="Share on WhatsApp"
            onClick={() => openShareWindow(`https://wa.me/?text=${encodeURIComponent(shareText)}`)}
          >
            <WhatsAppIcon />
          </button>
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.brandInstagram}`}
            aria-label="Copy link for Instagram"
            title="Instagram doesn't support direct link sharing — copies the link instead"
            onClick={handleCopy}
          >
            <InstagramIcon />
          </button>
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.brandFacebook}`}
            aria-label="Share on Facebook"
            onClick={() => openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)}
          >
            <FacebookIcon />
          </button>
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.brandX}`}
            aria-label="Share on X"
            onClick={() =>
              openShareWindow(
                `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}${shareTitle ? `&text=${encodeURIComponent(shareTitle)}` : ""}`
              )
            }
          >
            <XIcon />
          </button>
        </div>

        <div className={styles.copyRow}>
          <input type="text" className={styles.urlInput} value={url} readOnly onFocus={(e) => e.target.select()} />
          <button
            type="button"
            className={`${styles.copyBtn} ${copied ? styles.copied : ""}`}
            onClick={handleCopy}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className={`${styles.progressBar} ${paused ? styles.paused : ""}`} />
      </div>
    </div>
  );
}
