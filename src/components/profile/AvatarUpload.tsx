"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar } from "@/lib/avatar";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/useToast";
import styles from "./AvatarUpload.module.css";

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function CameraIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.cameraIcon}
      aria-hidden="true"
    >
      <path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

interface AvatarUploadProps {
  userId: string;
  /** Display name or username — used for the initial-letter fallback. */
  label: string;
  /** Server-rendered avatar_url for the profile being viewed. Used as-is
   *  for non-owners; owners read the live value from ProfileContext
   *  instead (seeded with this same value) so an upload updates instantly. */
  avatarUrl: string | null;
  isOwner: boolean;
  /** "default" (120px, profile header) or "small" (64px, edit page). */
  size?: "default" | "small";
}

/** The profile page's avatar circle. Owner-only: hover reveals a camera
 *  scrim, click opens a hidden file input, and a successful upload
 *  updates ProfileContext so the navbar/dropdown avatar update too. */
export function AvatarUpload({
  userId,
  label,
  avatarUrl: initialAvatarUrl,
  isOwner,
  size = "default",
}: AvatarUploadProps) {
  const { avatarUrl: contextAvatarUrl, updateAvatarUrl } = useProfile();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const avatarUrl = isOwner ? contextAvatarUrl : initialAvatarUrl;
  const initial = label.charAt(0).toUpperCase();

  const handleClick = () => {
    if (!isOwner || loading) return;
    inputRef.current?.click();
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so selecting the same file again still fires onChange.
    e.target.value = "";
    if (!file) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const url = await uploadAvatar(supabase, userId, file);

      const res = await fetch("/api/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });
      if (!res.ok) throw new Error("Couldn't save your new photo. Try again.");

      updateAvatarUrl(url);
      toast.show({ message: "Profile photo updated" });
    } catch (err) {
      toast.show({
        message: err instanceof Error ? err.message : "Couldn't update photo. Try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cx(styles.avatar, size === "small" && styles.avatarSmall, isOwner && styles.avatarOwner)}
      onClick={handleClick}
      role={isOwner ? "button" : undefined}
      tabIndex={isOwner ? 0 : undefined}
      aria-label={isOwner ? "Change profile photo" : undefined}
      onKeyDown={
        isOwner
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className={styles.avatarImage} />
      ) : (
        <span className={styles.avatarInitial} aria-hidden="true">
          {initial}
        </span>
      )}

      {isOwner && (
        <>
          <div className={cx(styles.scrim, loading && styles.scrimActive)} aria-hidden="true">
            {loading ? <span className={styles.spinner} /> : <CameraIcon />}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="visually-hidden"
            onChange={handleChange}
            tabIndex={-1}
          />
        </>
      )}
    </div>
  );
}
