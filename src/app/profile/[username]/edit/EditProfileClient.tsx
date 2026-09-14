"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { PasswordField } from "@/components/auth/PasswordField";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/useToast";
import styles from "./EditProfileClient.module.css";

interface Profile {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

interface SettingsSection {
  id: string;
  label: string;
}

const SECTIONS: SettingsSection[] = [
  { id: "profile", label: "Profile" },
  { id: "bio", label: "Bio" },
  { id: "password", label: "Password" },
  { id: "account", label: "Account" },
];

const SUCCESS_MESSAGE_MS = 3000;

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function EditProfileClient({
  profile,
  email,
  signInMethod,
  isGoogleOnly,
  hasPassword,
  deepDivesCount,
  collectionsCount,
}: {
  profile: Profile;
  email: string;
  signInMethod: string;
  isGoogleOnly: boolean;
  hasPassword: boolean;
  deepDivesCount: number;
  collectionsCount: number;
}) {
  const router = useRouter();
  const toast = useToast();

  // Live avatar URL for this same user — AvatarUpload writes here the
  // moment an upload succeeds, so the live-preview card below picks up
  // a newly selected photo without waiting for a page reload.
  const { avatarUrl: liveAvatarUrl } = useProfile();
  const previewAvatarUrl = liveAvatarUrl ?? profile.avatarUrl;

  // ── Profile + Bio (one shared save) ──────────────────────────────────
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const displayNameId = useId();
  const usernameId = useId();

  // ── Public profile preview (Profile tab, right column) ────────────────
  const previewLabel = displayName || username;
  const previewInitial = previewLabel ? previewLabel.charAt(0).toUpperCase() : "?";

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, username, bio }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      toast.show({ message: "Profile updated" });
      if (username !== profile.username) {
        router.replace(`/profile/${username}/edit`);
      } else {
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Avatar — "Change photo" text link triggers AvatarUpload's own
  // click-to-upload behavior (its outer element is role="button") rather
  // than duplicating the upload logic here. ────────────────────────────
  const avatarWrapperRef = useRef<HTMLDivElement>(null);
  const triggerAvatarChange = () => {
    avatarWrapperRef.current?.querySelector<HTMLElement>('[role="button"]')?.click();
  };

  // ── Password ──────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Set a password (Google-only user, no email identity yet) ──────────
  const [passwordResetSending, setPasswordResetSending] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const handleUpdatePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation don't match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setPasswordError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => setPasswordSuccess(false), SUCCESS_MESSAGE_MS);
    } catch {
      setPasswordError("Something went wrong. Please try again.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSetPassword = async () => {
    setPasswordResetSending(true);
    try {
      const supabase = createClient();
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
          "/reset-password"
        )}`,
      });
      setPasswordResetSent(true);
    } finally {
      setPasswordResetSending(false);
    }
  };

  // ── Sidebar — click to scroll, IntersectionObserver to highlight ──────
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const headingRefs = useRef(new Map<string, HTMLHeadingElement>());

  const registerHeading = useCallback((id: string, el: HTMLHeadingElement | null) => {
    if (el) headingRefs.current.set(id, el);
    else headingRefs.current.delete(id);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.sectionId;
            if (id) setActiveSection(id);
          }
        });
      },
      { threshold: 0.5 }
    );

    headingRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={styles.page}>
      <Link href={`/profile/${profile.username}`} className={styles.backLink}>
        ← Back to profile
      </Link>
      <h1 className={styles.title}>Edit profile</h1>

      <div className={styles.layout}>
        {/* ── Sidebar ── */}
        <nav className={styles.settingsSidebar} aria-label="Settings sections">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className={cx(
                styles.sidebarItem,
                activeSection === section.id && styles.sidebarItemActive
              )}
              onClick={() => scrollToSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>

        {/* ── Content ── */}
        <div className={styles.settingsContent}>
          {/* ── Profile + Bio (two-column: form + live preview) ── */}
          <div className={styles.profileGrid}>
            <div className={styles.profileGridLeft}>
              {/* ── Profile ── */}
              <div id="profile" className={styles.section}>
                <h2
                  ref={(el) => registerHeading("profile", el)}
                  data-section-id="profile"
                  className={styles.sectionHeading}
                >
                  Profile
                </h2>
                <div className={styles.sectionBody}>
                  <div className={styles.avatarBlock}>
                    <div ref={avatarWrapperRef}>
                      <AvatarUpload
                        userId={profile.id}
                        label={displayName || profile.username}
                        avatarUrl={profile.avatarUrl}
                        isOwner
                        size="small"
                      />
                    </div>
                    <button
                      type="button"
                      className={styles.changePhotoLink}
                      onClick={triggerAvatarChange}
                    >
                      Change photo
                    </button>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor={displayNameId} className={styles.label}>
                      Display name
                    </label>
                    <input
                      id={displayNameId}
                      className={styles.input}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      maxLength={80}
                      disabled={saving}
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor={usernameId} className={styles.label}>
                      Username
                    </label>
                    <div className={styles.usernameRow}>
                      <span className={styles.usernamePrefix}>beyondwhy.org/</span>
                      <input
                        id={usernameId}
                        className={styles.input}
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        maxLength={30}
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Bio ── */}
              <div id="bio" className={styles.section}>
                <h2
                  ref={(el) => registerHeading("bio", el)}
                  data-section-id="bio"
                  className={styles.sectionHeading}
                >
                  Bio
                </h2>
                <div className={styles.sectionBody}>
                  <textarea
                    className={styles.textarea}
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={500}
                    disabled={saving}
                    placeholder="A line or two about yourself — what you're curious about, what you're building."
                    aria-label="Bio"
                  />

                  {error && (
                    <p className={styles.errorMessage} role="alert">
                      {error}
                    </p>
                  )}

                  <div className={styles.saveRow}>
                    <button
                      type="button"
                      className={styles.saveButton}
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Live preview ── */}
            <aside className={styles.previewCard} aria-label="Public profile preview">
              <div className={styles.previewHeader}>
                <span className={styles.previewLabel}>Public profile</span>
                <span className={styles.previewBadge}>Live preview</span>
              </div>

              <div className={styles.previewAvatar} aria-hidden="true">
                {previewAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewAvatarUrl} alt="" className={styles.previewAvatarImage} />
                ) : (
                  previewInitial
                )}
              </div>

              <p className={styles.previewName}>{previewLabel}</p>
              <p className={styles.previewUsername}>@{username}</p>
              <p className={styles.previewBio}>{bio || "No bio yet."}</p>

              <div className={styles.previewDivider} />

              <div className={styles.previewStats}>
                <div className={styles.statPill}>
                  <span className={styles.statValue}>{deepDivesCount}</span>
                  <span className={styles.statLabel}>Deep dives</span>
                </div>
                <div className={styles.statPill}>
                  <span className={styles.statValue}>{collectionsCount}</span>
                  <span className={styles.statLabel}>Collections</span>
                </div>
              </div>
            </aside>
          </div>

          {/* ── Password ── */}
          <div id="password" className={styles.section}>
            <h2
              ref={(el) => registerHeading("password", el)}
              data-section-id="password"
              className={styles.sectionHeading}
            >
              Password
            </h2>
            <div className={styles.sectionBody}>
              {isGoogleOnly && !hasPassword ? (
                <>
                  <p className={styles.googleOnlyNotice}>You&apos;re signed in with Google.</p>

                  {passwordResetSent ? (
                    <p className={styles.sectionDescription}>
                      Password reset email sent to {email}
                    </p>
                  ) : (
                    <div className={styles.saveRow}>
                      <button
                        type="button"
                        className={styles.saveButton}
                        onClick={handleSetPassword}
                        disabled={passwordResetSending}
                      >
                        {passwordResetSending ? "Sending…" : "Set a password"}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className={styles.passwordFieldsScope}>
                    <PasswordField
                      label="Current password"
                      value={currentPassword}
                      onChange={setCurrentPassword}
                      autoComplete="current-password"
                      disabled={passwordSaving}
                    />
                    <PasswordField
                      label="New password"
                      value={newPassword}
                      onChange={setNewPassword}
                      autoComplete="new-password"
                      minLength={8}
                      disabled={passwordSaving}
                    />
                    <PasswordField
                      label="Confirm new password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      autoComplete="new-password"
                      disabled={passwordSaving}
                    />
                  </div>

                  {passwordError && (
                    <p className={styles.errorMessage} role="alert">
                      {passwordError}
                    </p>
                  )}
                  {passwordSuccess && (
                    <p className={styles.successMessage} role="status">
                      Password updated
                    </p>
                  )}

                  <div className={styles.saveRow}>
                    <button
                      type="button"
                      className={styles.saveButton}
                      onClick={handleUpdatePassword}
                      disabled={passwordSaving}
                    >
                      {passwordSaving ? "Updating…" : "Update password"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Account ── */}
          <div id="account" className={styles.section}>
            <h2
              ref={(el) => registerHeading("account", el)}
              data-section-id="account"
              className={styles.sectionHeading}
            >
              Account
            </h2>
            <div className={styles.sectionBody}>
              <div className={styles.fields}>
                <div className={styles.field}>
                  <span className={styles.label}>Email</span>
                  <span className={styles.fieldValue}>{email}</span>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Signed in with</span>
                  <span className={styles.fieldValue}>{signInMethod}</span>
                </div>
              </div>

              <form action="/signout" method="post">
                <button type="submit" className={styles.signOutButton}>
                  Sign out
                </button>
              </form>

              <div className={styles.divider} />

              <div className={styles.dangerZone}>
                <div>
                  <span className={styles.dangerLabel}>Danger zone</span>
                  <p className={styles.dangerText}>
                    Permanently delete your account and everything associated with it.
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className={styles.dialogOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div
            className={styles.dialog}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-account-title" className={styles.dialogTitle}>
              Delete your account?
            </h3>
            <p className={styles.dialogBody}>
              This will permanently remove your profile, bookmarks, likes, and comments. This
              can&apos;t be undone.
            </p>
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.dialogCancel}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.dialogConfirm}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  toast.show({ message: "Account deletion isn't available yet.", type: "error" });
                }}
              >
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
