"use client";

import Link from "next/link";
import { useRef, useState, type FocusEvent, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import LogGlyph, { type LogGlyphKind } from "@/components/builder-log/LogGlyph";
import LogPeek from "@/components/builder-log/LogPeek";
import styles from "./BuilderLogBanner.module.css";

export interface RoadNode {
  day: number;
  dateLabel: string;
  title: string;
  thumbnail?: string;
  hasThumbnail: boolean;
  glyph: LogGlyphKind;
  /** Position along the road, as a % of the track. */
  left: number;
  newest: boolean;
}

/** Gap between the top of a node's hit area and the peek's caret. */
const PEEK_GAP = 4;

/**
 * The banner road's nodes: each one a link to its log on the series page
 * (`#day-N`), with a 24px hit area around the glyph and a name like
 * "Day 20: Teaching it what black means".
 *
 * Mouse hover or keyboard focus shows the journey bar's peek card above
 * the node, kept inside the banner. Touch never peeks: a tap just follows
 * the link, and a sideways pan on the phone road scrolls it (browsers
 * don't fire a click for a pan). The peek renders into the banner's stage
 * so the phone road's scroller can't clip it.
 */
export default function BuilderLogRoadNodes({
  nodes,
  seriesHref,
}: {
  nodes: RoadNode[];
  seriesHref: string;
}) {
  const [peek, setPeek] = useState<{ node: RoadNode; left: number; bottom: number; host: HTMLElement } | null>(null);
  const boundsRef = useRef<HTMLElement | null>(null);
  // The focus a tap produces isn't keyboard focus — never peek for it.
  const lastPressRef = useRef<string | null>(null);

  const show = (node: RoadNode, target: HTMLElement) => {
    const host = target.closest<HTMLElement>("[data-peek-host]");
    if (!host) return;
    boundsRef.current = target.closest<HTMLElement>("section");
    const hostRect = host.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    setPeek({
      node,
      host,
      left: rect.left + rect.width / 2 - hostRect.left,
      bottom: hostRect.bottom - rect.top + PEEK_GAP,
    });
  };
  const hide = () => setPeek(null);

  return (
    <>
      {nodes.map((node) => (
        <Link
          key={node.day}
          href={`${seriesHref}#day-${node.day}`}
          // The series feed lands on #day-N itself; a router scroll would race it.
          scroll={false}
          className={`${styles.nodeLink} ${node.newest ? styles.nodeLinkNewest : ""}`}
          style={{ left: `${node.left}%` }}
          aria-label={`Day ${node.day}: ${node.title}`}
          onPointerEnter={(event: PointerEvent<HTMLAnchorElement>) => {
            if (event.pointerType === "mouse") show(node, event.currentTarget);
          }}
          onPointerLeave={hide}
          onPointerDown={(event: PointerEvent<HTMLAnchorElement>) => {
            lastPressRef.current = event.pointerType;
          }}
          onFocus={(event: FocusEvent<HTMLAnchorElement>) => {
            // Keyboard focus only — a tap also focuses the link on its way.
            const pressed = lastPressRef.current;
            lastPressRef.current = null;
            if (pressed === "touch" || pressed === "pen") return;
            if (event.currentTarget.matches(":focus-visible")) show(node, event.currentTarget);
          }}
          onBlur={hide}
        >
          {node.newest ? (
            <span className={styles.newestNode} aria-hidden="true" />
          ) : (
            <LogGlyph kind={node.glyph} />
          )}
        </Link>
      ))}
      {peek &&
        createPortal(
          <LogPeek log={peek.node} left={peek.left} bottom={peek.bottom} boundsRef={boundsRef} />,
          peek.host
        )}
    </>
  );
}
