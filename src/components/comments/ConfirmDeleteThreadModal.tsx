"use client";

import { useEffect, useRef } from "react";
import styles from "./ConfirmDeleteThreadModal.module.css";

interface ConfirmDeleteThreadModalProps {
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirms deleting a top-level comment that has replies from other
 *  people, since doing so takes the whole thread with it — a plain
 *  browser confirm() would work but wouldn't match the rest of the
 *  product, so this follows the same self-contained overlay pattern
 *  ShareModal already uses (no routing dependency, unlike the route-based
 *  Modal component) rather than introducing a third modal convention. */
export function ConfirmDeleteThreadModal({ deleting, onConfirm, onCancel }: ConfirmDeleteThreadModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel, deleting]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current && !deleting) onCancel();
  };

  return (
    <div ref={overlayRef} className={styles.overlay} onClick={handleOverlayClick}>
      <div
        className={styles.panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmDeleteThreadTitle"
        aria-describedby="confirmDeleteThreadMessage"
      >
        <h2 id="confirmDeleteThreadTitle" className={styles.title}>
          Delete this comment and its replies?
        </h2>
        <p id="confirmDeleteThreadMessage" className={styles.message}>
          This comment has replies from other people. If you continue, the comment and all replies in
          this thread will be permanently removed from the discussion. This action cannot be undone.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={deleting}>
            No, keep it
          </button>
          <button type="button" className={styles.confirmBtn} onClick={onConfirm} disabled={deleting}>
            {deleting ? "Deleting…" : "Yes, delete thread"}
          </button>
        </div>
      </div>
    </div>
  );
}
