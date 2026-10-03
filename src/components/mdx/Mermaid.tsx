"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import styles from "./Mermaid.module.css";

/**
 * Renders a ```mermaid fenced block (wired up in MDXComponents' `pre`
 * override). mermaid itself is dynamically imported inside the effect, so
 * its chunk is only fetched on pages that actually contain a diagram.
 *
 * Rendering is deferred until the figure is laid out and near the viewport:
 * mermaid measures label text in the DOM, so drawing inside a hidden or
 * zero-width container produces a broken diagram.
 */

// Rendered SVG per chart source. An insight card's outgoing pane remounts
// during the stack-slide transition; reusing the SVG keeps it from
// collapsing back to the placeholder mid-animation.
const svgCache = new Map<string, string>();

let renderCount = 0;

function token(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** First non-transparent background behind `el` — edge labels sit on it. */
function backdropColor(el: HTMLElement) {
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    const bg = getComputedStyle(node).backgroundColor;
    if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") return bg;
  }
  return token("--bg-primary");
}

async function renderChart(el: HTMLElement, chart: string) {
  const { default: mermaid } = await import("mermaid");
  await document.fonts.ready;

  const fill = token("--bg-elevated");
  const text = token("--text-primary");
  const border = token("--border-medium");
  const edge = token("--text-muted");
  const accent = token("--accent");

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: "base",
    fontFamily: getComputedStyle(el).fontFamily,
    themeVariables: {
      fontFamily: getComputedStyle(el).fontFamily,
      fontSize: "14px",
      background: backdropColor(el),
      primaryColor: fill,
      primaryTextColor: text,
      primaryBorderColor: border,
      mainBkg: fill,
      nodeBorder: border,
      secondaryColor: fill,
      tertiaryColor: fill,
      clusterBkg: fill,
      clusterBorder: border,
      textColor: text,
      titleColor: text,
      lineColor: edge,
      edgeLabelBackground: backdropColor(el),
    },
    // `:::key` puts a "key" class on the node — the one accented node.
    themeCSS: `
      .node.key rect, .node.key polygon, .node.key circle, .node.key path {
        stroke: ${accent} !important;
      }
    `,
  });

  const id = `mermaid-${++renderCount}`;
  try {
    const { svg } = await mermaid.render(id, chart);
    return svg;
  } finally {
    // On a parse error mermaid leaves its scratch container in <body>.
    document.getElementById(`d${id}`)?.remove();
  }
}

export default function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const labelId = useId();

  // Before paint, so a cached diagram never flashes the placeholder.
  useLayoutEffect(() => {
    setSvg(svgCache.get(chart) ?? null);
    setError(null);
  }, [chart]);

  useEffect(() => {
    const el = ref.current;
    if (!el || svgCache.has(chart)) return;

    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting || entry.boundingClientRect.width === 0) return;
        observer.disconnect();
        renderChart(el, chart).then(
          (result) => {
            svgCache.set(chart, result);
            if (!cancelled) setSvg(result);
          },
          (err: unknown) => {
            // First line only ("Parse error on line 3:") — the rest is a
            // token dump; the source is shown below the message anyway.
            const message = err instanceof Error ? err.message : String(err);
            if (!cancelled) setError(message.split("\n")[0]);
          }
        );
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(el);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [chart]);

  if (error) {
    return (
      <figure className={`${styles.figure} ${styles.error}`} role="group" aria-labelledby={labelId}>
        <p id={labelId} className={styles.errorMessage}>
          This diagram couldn&apos;t be rendered: {error}
        </p>
        <pre className={styles.errorSource}>{chart}</pre>
      </figure>
    );
  }

  return (
    <figure
      ref={ref}
      className={`${styles.figure} ${svg ? "" : styles.pending}`}
      role="img"
      aria-label="Diagram"
      aria-busy={!svg}
    >
      {svg && <div className={styles.svg} dangerouslySetInnerHTML={{ __html: svg }} />}
    </figure>
  );
}
