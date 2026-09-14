"use client";

import { useEffect, useRef } from "react";
import { useLike, formatLikeCount } from "@/hooks/useLike";
import styles from "./EpisodeReader.module.css";

export interface LikeState {
  count: number;
  liked: boolean;
}

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

interface AnimatedCountProps {
  value: number;
  prevValue: number;
  direction: "up" | "down" | null;
}

/** Slot-machine tick: renders a static count, or — right after a change —
 *  the outgoing and incoming digits stacked so CSS can slide them past
 *  each other. Purely prop-driven so it works whether or not it remounts. */
function AnimatedCount({ value, prevValue, direction }: AnimatedCountProps) {
  const showTransition = direction !== null && prevValue !== value;

  return (
    <span className={styles.countSlot}>
      {showTransition && (
        <span
          className={cx(
            styles.countDigit,
            direction === "up" ? styles.countOutUp : styles.countOutDown
          )}
        >
          {formatLikeCount(prevValue)}
        </span>
      )}
      <span
        className={cx(
          styles.countDigit,
          showTransition &&
            (direction === "up" ? styles.countInUp : styles.countInDown)
        )}
      >
        {formatLikeCount(value)}
      </span>
    </span>
  );
}

interface LikeButtonProps {
  contentId: string;
  contentType: string;
  initialCount: number;
  initialLiked: boolean;
  isAuthenticated: boolean;
  /** Current reading progress (0–1), attached to the sign-in intent for logged-out clicks. */
  scrollPercent?: number;
  /** 'compact' drops the button box (border/background/padding) and shrinks
   *  the icon + count for tight spaces like the insight card top bar. */
  size?: "default" | "compact";
  /** Reports the live count/liked state back up whenever it changes — lets a
   *  parent that persists across this button's remounts (e.g. a card-to-card
   *  slide transition that recreates this component) re-seed the next mount
   *  with the latest known value instead of the original server-fetched one. */
  onStateChange?: (state: LikeState) => void;
}

export function LikeButton({
  contentId,
  contentType,
  initialCount,
  initialLiked,
  isAuthenticated,
  scrollPercent,
  size = "default",
  onStateChange,
}: LikeButtonProps) {
  const { count, liked, loading, toggle, animationType, animationKey } = useLike({
    contentId,
    contentType,
    initialCount,
    initialLiked,
    isAuthenticated,
    scrollPercent,
  });
  const compact = size === "compact";

  // Tracks the count from the previous render so AnimatedCount can render
  // the outgoing digit even though its own wrapper remounts every tick.
  // Updated in an effect (not during render) so it stays correct under
  // StrictMode's double-invoked render passes.
  const prevCountRef = useRef(count);
  const displayPrevCount = prevCountRef.current;
  useEffect(() => {
    prevCountRef.current = count;
  }, [count]);

  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;
  useEffect(() => {
    onStateChangeRef.current?.({ count, liked });
  }, [count, liked]);

  const direction =
    animationType === "like" ? "up" : animationType === "unlike" ? "down" : null;

  return (
    <button
      type="button"
      className={cx(
        styles.actionBtn,
        styles.likeBtn,
        liked && styles.actionBtnLiked,
        loading && styles.likeBtnLoading,
        compact && styles.actionBtnCompact
      )}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      aria-disabled={loading}
      onClick={toggle}
    >
      <span
        key={animationKey}
        className={cx(
          styles.likeInner,
          compact && styles.actionInnerCompact,
          animationType === "error" && styles.likeShake
        )}
      >
        <svg
          className={cx(
            styles.actionIcon,
            compact && styles.actionIconCompact,
            loading && styles.likeIconLoading,
            animationType === "like" && styles.likeIconPulseLike,
            animationType === "unlike" && styles.likeIconPulseUnlike
          )}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={liked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <AnimatedCount value={count} prevValue={displayPrevCount} direction={direction} />
      </span>
    </button>
  );
}
