"use client";

import { useRouter } from "next/navigation";
import { useEffect, useCallback, useRef } from "react";
import styles from "./Modal.module.css";

interface ModalProps {
  children: React.ReactNode;
}

export function Modal({ children }: ModalProps) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    router.back();
  }, [router]);

  // Lock body scroll + handle Escape key
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close]);

  // Close when clicking backdrop (not the content panel)
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      close();
    }
  };

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      onClick={handleOverlayClick}
    >
      <div className={styles.content} role="dialog" aria-modal="true">
        {/* Sticky close bar */}
        <div className={styles.closeButton} onClick={close}>
          <div className={styles.closeButtonInner}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        </div>

        <div className={styles.scrollArea}>{children}</div>
      </div>
    </div>
  );
}
