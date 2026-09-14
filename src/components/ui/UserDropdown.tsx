"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import styles from "./UserDropdown.module.css";

// Matches .menuClosing's animation-duration in UserDropdown.module.css.
const CLOSE_ANIMATION_MS = 130;

interface UserDropdownProps {
  username: string;
  displayName: string | null;
}

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function UserDropdown({ username, displayName }: UserDropdownProps) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const label = displayName || username;
  const initial = label.charAt(0).toUpperCase();
  const { avatarUrl } = useProfile();

  const close = useCallback(() => {
    setClosing(true);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, CLOSE_ANIMATION_MS);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, close]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const toggleOpen = () => {
    if (open) {
      close();
      return;
    }
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setClosing(false);
    setOpen(true);
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.avatarButton}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${label}`}
        onClick={toggleOpen}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className={styles.avatarImage} />
        ) : (
          <span className={styles.avatarInitial} aria-hidden="true">
            {initial}
          </span>
        )}
      </button>

      {open && (
        <div className={cx(styles.menu, closing ? styles.menuClosing : styles.menuOpen)} role="menu">
          <div className={styles.header}>
            <span className={styles.headerAvatar} aria-hidden="true">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className={styles.avatarImage} />
              ) : (
                <span className={styles.avatarInitial}>{initial}</span>
              )}
            </span>
            <span className={styles.headerText}>
              <span className={styles.headerName}>{label}</span>
              <span className={styles.headerUsername}>@{username}</span>
            </span>
          </div>

          <div className={styles.divider} />

          <Link href={`/profile/${username}`} className={styles.menuItem} role="menuitem" onClick={close}>
            <span>Profile</span>
            <span className={styles.arrow} aria-hidden="true">→</span>
          </Link>
          <Link href={`/profile/${username}/edit`} className={styles.menuItem} role="menuitem" onClick={close}>
            <span>Edit profile</span>
            <span className={styles.arrow} aria-hidden="true">→</span>
          </Link>

          <div className={styles.divider} />

          <form action="/signout" method="post" className={styles.signOutForm}>
            <button type="submit" className={styles.signOutBtn} role="menuitem">
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
