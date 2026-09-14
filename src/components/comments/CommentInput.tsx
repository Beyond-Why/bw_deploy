"use client";

import { useEffect, useRef, useState } from "react";
import type { CurrentUser } from "./CommentSection";
import styles from "./CommentSection.module.css";

const MAX_LENGTH = 2000;
const AUTH_ERROR_MESSAGE = "__AUTH__";

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

interface CommentInputProps {
  user: CurrentUser | null;
  onRequestAuth: () => void;
  onSubmit: (body: string) => Promise<unknown>;
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
  avatarSize?: number;
  onCancel?: () => void;
  /** Applied to the underlying textarea — lets the empty state's "Start
   *  the conversation" nudge find and focus this exact composer. */
  id?: string;
}

export function CommentInput({
  user,
  onRequestAuth,
  onSubmit,
  placeholder = "Add a comment…",
  submitLabel = "Comment",
  autoFocus = false,
  avatarSize = 32,
  onCancel,
  id,
}: CommentInputProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(autoFocus);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  const trimmed = value.trim();
  const overLimit = value.length > MAX_LENGTH;
  const canSubmit = trimmed.length > 0 && !overLimit && !submitting;
  const remaining = MAX_LENGTH - value.length;

  const reset = () => {
    setValue("");
    setSubmitError(null);
    setFocused(false);
    textareaRef.current?.blur();
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!user) {
      e.preventDefault();
      onRequestAuth();
    }
  };

  const cancel = () => {
    reset();
    onCancel?.();
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(trimmed);
      reset();
    } catch (err) {
      if (err instanceof Error && err.message === AUTH_ERROR_MESSAGE) {
        onRequestAuth();
      } else {
        setSubmitError("Something went wrong. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  const initial = (user?.displayName || user?.handle || "?").charAt(0).toUpperCase();

  return (
    <div className={styles.inputRow}>
      <span
        className={styles.avatar}
        style={{ width: avatarSize, height: avatarSize }}
        aria-hidden="true"
      >
        {user?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className={styles.avatarImage} />
        ) : (
          <span className={styles.avatarInitial}>{initial}</span>
        )}
      </span>

      <div className={styles.inputBody}>
        <textarea
          id={id}
          ref={textareaRef}
          className={styles.textarea}
          value={value}
          placeholder={placeholder}
          rows={1}
          maxLength={MAX_LENGTH + 200}
          onMouseDown={handlePointerDown}
          onFocus={() => user && setFocused(true)}
          onChange={(e) => {
            setValue(e.target.value);
            setSubmitError(null);
          }}
          onKeyDown={handleKeyDown}
        />

        {submitError && <p className={styles.inputError}>{submitError}</p>}

        <div className={cx(styles.inputActions, focused && styles.inputActionsVisible)}>
          {remaining < 200 && (
            <span className={cx(styles.charCount, remaining < 0 && styles.charCountOver)}>
              {remaining}
            </span>
          )}
          <button type="button" className={styles.cancelBtn} onClick={cancel}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.submitBtn}
            disabled={!canSubmit}
            onClick={submit}
          >
            {submitting ? "Posting…" : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
