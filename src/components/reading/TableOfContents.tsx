"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useId,
} from "react";
import { usePathname } from "next/navigation";
import styles from "./TableOfContents.module.css";

/* ──────────────────────────────────────────────────────────────
   Floating table of contents for Deep Dive episode pages.
   Reference behaviour: Substack's long-form contents widget —
   a dash rail pinned left that expands into a nested outline.

   Renders identically in Focus and Explore mode (fixed to the
   far left of the viewport) — it no longer needs to know which
   mode EpisodeReader is in.

   TOP_ID must match the id EpisodeReader puts on its article
   header (see EpisodeReader.tsx's `id={TOP_ID}` on .header) —
   there's no shared constants module between these two files,
   so the string is duplicated deliberately on both sides.
   ────────────────────────────────────────────────────────────── */

const TOP_ID = "episode-top";

interface Heading {
  id: string;
  text: string;
  level: 2 | 3 | 4;
}

// useLayoutEffect warns on the server; swap for useEffect there.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function TableOfContents() {
  const pathname = usePathname();
  const panelId = useId();

  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>(TOP_ID);
  const [isOpen, setIsOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [entered, setEntered] = useState(false);
  const [panelOffset, setPanelOffset] = useState(0);

  const navRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dashRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Collect headings from the rendered <article> ── */
  useEffect(() => {
    const extractHeadings = () => {
      const article = document.querySelector("article");
      if (!article) {
        setHeadings([]);
        return;
      }
      const elements = Array.from(
        article.querySelectorAll<HTMLElement>("h2[id], h3[id], h4[id]")
      );
      const extracted: Heading[] = elements.map((el) => ({
        id: el.id,
        text: el.textContent || "",
        level: el.tagName === "H2" ? 2 : el.tagName === "H3" ? 3 : 4,
      }));
      setHeadings(extracted);
    };

    // Small delay so MDX content is fully in the DOM (also re-runs on
    // episode navigation, since the route — and article content — changes).
    const timeoutId = setTimeout(extractHeadings, 100);
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  /* ── Full outline: just the article's real headings. Scroll-to-top is
     already available via the browser/nav — it doesn't need its own row. ── */
  const items: Heading[] = headings;

  /* ── Default active item: first, until scroll proves otherwise ── */
  useEffect(() => {
    if (items.length === 0) {
      setActiveId(TOP_ID);
      return;
    }
    setActiveId((prev) =>
      items.some((h) => h.id === prev) ? prev : items[0].id
    );
  }, [items]);

  /* ── Scroll spy: last item to cross the top line wins (Top included) ── */
  useEffect(() => {
    if (items.length === 0) return;

    const intersecting = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).id;
          if (entry.isIntersecting) intersecting.add(id);
          else intersecting.delete(id);
        });

        for (let i = items.length - 1; i >= 0; i--) {
          if (intersecting.has(items[i].id)) {
            setActiveId(items[i].id);
            break;
          }
        }
        // If nothing currently intersects the band, keep the previous
        // active id — it means we're either above Top (default already
        // applies) or past the last heading (stays lit).
      },
      { rootMargin: "-72px 0px -70% 0px", threshold: 0 }
    );

    items.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  /* ── Ancestors of the active item (for the "lifted" outline colour) ── */
  const ancestorIds = useMemo(() => {
    const set = new Set<string>();
    const activeIndex = headings.findIndex((h) => h.id === activeId);
    if (activeIndex < 0) return set;
    let level = headings[activeIndex].level;
    for (let i = activeIndex - 1; i >= 0; i--) {
      if (headings[i].level < level) {
        set.add(headings[i].id);
        level = headings[i].level;
      }
    }
    return set;
  }, [headings, activeId]);

  /* ── Timers ── */
  const clearTimers = () => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  useEffect(() => clearTimers, []);

  const closePanel = () => {
    clearTimers();
    setPinned(false);
    setIsOpen(false);
  };

  const handleMouseEnter = () => {
    if (pinned) return;
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (isOpen || openTimerRef.current) return;
    openTimerRef.current = setTimeout(() => {
      setIsOpen(true);
      openTimerRef.current = null;
    }, 120);
  };

  const handleMouseLeave = () => {
    if (pinned) return;
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      closeTimerRef.current = null;
    }, 200);
  };

  const handleToggleClick = () => {
    clearTimers();
    if (pinned) {
      setPinned(false);
      setIsOpen(false);
    } else {
      setPinned(true);
      setIsOpen(true);
    }
  };

  /* ── Pinned: close on outside click ── */
  useEffect(() => {
    if (!pinned) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setPinned(false);
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [pinned]);

  /* ── Escape closes (pinned or hover) and returns focus to the toggle ── */
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPinned(false);
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  /* ── Enter transition: opacity + 4px translateX, next frame ── */
  useEffect(() => {
    if (!isOpen) {
      setEntered(false);
      return;
    }
    setEntered(false);
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  /* ── Vertical anchor: align the active item with the active dash,
     clamped 24px inside the viewport. Recomputed from live rects each
     time, so it self-corrects instead of compounding drift. ── */
  useIsomorphicLayoutEffect(() => {
    if (!isOpen) return;
    const panelEl = panelRef.current;
    const dashEl = dashRefs.current[activeId];
    const itemEl = itemRefs.current[activeId];
    if (!panelEl || !dashEl || !itemEl) return;

    const dashRect = dashEl.getBoundingClientRect();
    const itemRect = itemEl.getBoundingClientRect();
    const panelRect = panelEl.getBoundingClientRect();

    const delta = dashRect.top - itemRect.top;
    let nextOffset = panelOffset + delta;

    const margin = 24;
    const naturalTop = panelRect.top - panelOffset;
    const resultingTop = naturalTop + nextOffset;
    const minTop = margin;
    const maxTop = Math.max(margin, window.innerHeight - margin - panelRect.height);

    if (resultingTop < minTop) nextOffset += minTop - resultingTop;
    else if (resultingTop > maxTop) nextOffset += maxTop - resultingTop;

    setPanelOffset(nextOffset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeId]);

  /* ── Item click: smooth-scroll, close, update hash without a jump ── */
  const handleItemClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
    }
    closePanel();
  };

  // At least one real heading is required — Top alone isn't a table of contents.
  if (headings.length === 0) return null;

  return (
    <nav
      ref={navRef}
      className={styles.tocNav}
      aria-label="Table of contents"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={buttonRef}
        type="button"
        className={styles.rail}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={handleToggleClick}
      >
        {items.map((h) => (
          <span
            key={h.id}
            ref={(el) => {
              dashRefs.current[h.id] = el;
            }}
            aria-hidden="true"
            className={cx(
              styles.dash,
              styles[`dashH${h.level}`],
              activeId === h.id && styles.dashActive
            )}
          />
        ))}
      </button>

      {isOpen && (
        <div
          id={panelId}
          ref={panelRef}
          className={styles.panel}
          style={{
            transform: `translate(${entered ? 0 : 4}px, ${panelOffset}px)`,
            opacity: entered ? 1 : 0,
          }}
        >
          <div className={styles.panelHeader}>Contents</div>
          <ul className={styles.panelList}>
            {items.map((h) => {
              const isActive = activeId === h.id;
              const isAncestor = ancestorIds.has(h.id);
              return (
                <li key={h.id}>
                  <a
                    ref={(el) => {
                      itemRefs.current[h.id] = el;
                    }}
                    href={`#${h.id}`}
                    className={cx(
                      styles.item,
                      styles[`itemH${h.level}`],
                      isActive && styles.itemActive,
                      isAncestor && styles.itemAncestor
                    )}
                    onClick={(e) => handleItemClick(e, h.id)}
                  >
                    {h.text}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </nav>
  );
}
