"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import styles from "./FieldSlider.module.css";

const NARROW_BREAKPOINT = 480;
const DOT_COUNT_WIDE = 80;
const DOT_COUNT_NARROW = 50;
const FIELD_LINES_PER_CHARGE_WIDE = 20;
const FIELD_LINES_PER_CHARGE_NARROW = 14;
const MAX_HEIGHT = 520;
const RING_THRESHOLD = 0.72;
const FIELD_LINE_START_RADIUS = 20;
const CHARGE_GLOW_RADIUS_POSITIVE = 16;
const CHARGE_GLOW_RADIUS_NEGATIVE = 20;
const ARROW_SPACING = 70;
const ARROW_SIZE = 6;
const KEY_STEP = 1;
const KEY_STEP_LARGE = 10;
const RING_PERIOD_MS = 2000;

const STEP_SIZE = 4;
const MAX_STEPS = 1200;
const CAPTURE_RADIUS_NEGATIVE = 22;
const CAPTURE_RADIUS_POSITIVE = 18;
const MIN_R = 6;

const POSITIVE_FRACS = [
  { x: 0.22, y: 0.5, q: 3.0 },
  { x: 0.78, y: 0.5, q: 3.0 },
];
const NEGATIVE_FRAC = { x: 0.5, y: 0.70, q: -3.5 };

interface VacuumDot {
  xFrac: number;
  yFrac: number;
  radius: number;
  offsetY: number;
}

interface Point {
  x: number;
  y: number;
}

interface Charge extends Point {
  q: number;
}

interface Charges {
  positives: Charge[];
  negative: Charge;
}

interface ArrowPoint extends Point {
  angle: number;
}

interface FieldLine {
  points: Point[];
  arrowPoints: ArrowPoint[];
}

interface ChargesAndLines {
  charges: Charges;
  fieldLines: FieldLine[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size: number
) {
  const tipX = x + Math.cos(angle) * (size / 2);
  const tipY = y + Math.sin(angle) * (size / 2);
  const backX = x - Math.cos(angle) * (size / 2);
  const backY = y - Math.sin(angle) * (size / 2);
  const leftX = backX + Math.cos(angle + Math.PI / 2) * (size / 2.5);
  const leftY = backY + Math.sin(angle + Math.PI / 2) * (size / 2.5);
  const rightX = backX + Math.cos(angle - Math.PI / 2) * (size / 2.5);
  const rightY = backY + Math.sin(angle - Math.PI / 2) * (size / 2.5);

  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(leftX, leftY);
  ctx.lineTo(rightX, rightY);
  ctx.closePath();
  ctx.fill();
}

function configureCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  dpr: number
): CanvasRenderingContext2D | null {
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d");
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function drawVacuumDots(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dots: VacuumDot[],
  prefersReducedMotion: boolean,
  mutate: boolean
) {
  ctx.fillStyle = "rgba(180,190,255,0.18)";
  for (const dot of dots) {
    if (mutate && !prefersReducedMotion) {
      dot.offsetY = clamp(dot.offsetY + (Math.random() - 0.5) * 0.8, -3, 3);
    }
    const x = dot.xFrac * width;
    const y = dot.yFrac * height + dot.offsetY;
    ctx.beginPath();
    ctx.arc(x, y, dot.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Bottom layer, always fully visible: the "empty space" state (no field, full void mist). */
function drawEmptySpaceLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dots: VacuumDot[],
  prefersReducedMotion: boolean
) {
  ctx.fillStyle = "#050510";
  ctx.fillRect(0, 0, width, height);

  drawVacuumDots(ctx, width, height, dots, prefersReducedMotion, true);

  const cx = width / 2;
  const cy = height / 2;
  const mistRadius = Math.max(width, height) * 0.75;
  const mistGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, mistRadius);
  mistGradient.addColorStop(0, "rgba(0,0,20,0)");
  mistGradient.addColorStop(1, "rgba(0,0,20,0.7)");
  ctx.fillStyle = mistGradient;
  ctx.fillRect(0, 0, width, height);
}

function computeCharges(width: number, height: number): Charges {
  return {
    positives: POSITIVE_FRACS.map((f) => ({ x: width * f.x, y: height * f.y, q: f.q })),
    negative: { x: width * NEGATIVE_FRAC.x, y: height * NEGATIVE_FRAC.y, q: NEGATIVE_FRAC.q },
  };
}

/** Integrates a single field line from a positive charge surface using RK-1 (Euler) stepping. */
function buildFieldLine(
  start: Point,
  allCharges: Charge[],
  positives: Point[],
  negative: Point,
  width: number,
  height: number
): FieldLine {
  const points: Point[] = [start];
  const arrowPoints: ArrowPoint[] = [];
  let distSinceArrow = 0;
  let capturedByNegative = false;

  for (let step = 0; step < MAX_STEPS; step++) {
    const prev = points[points.length - 1];

    let ex = 0;
    let ey = 0;
    for (const c of allCharges) {
      const dx = prev.x - c.x;
      const dy = prev.y - c.y;
      const r2 = Math.max(dx * dx + dy * dy, MIN_R * MIN_R);
      const r = Math.sqrt(r2);
      const mag = c.q / r2;
      ex += (mag * dx) / r;
      ey += (mag * dy) / r;
    }

    const norm = Math.hypot(ex, ey) || 1;
    const nx = prev.x + (ex / norm) * STEP_SIZE;
    const ny = prev.y + (ey / norm) * STEP_SIZE;
    points.push({ x: nx, y: ny });

    distSinceArrow += STEP_SIZE;
    if (distSinceArrow >= ARROW_SPACING) {
      distSinceArrow = 0;
      arrowPoints.push({ x: nx, y: ny, angle: Math.atan2(ny - prev.y, nx - prev.x) });
    }

    if (Math.hypot(nx - negative.x, ny - negative.y) <= CAPTURE_RADIUS_NEGATIVE) {
      capturedByNegative = true;
      break;
    }

    let capturedByPositive = false;
    for (const pos of positives) {
      if (Math.hypot(nx - pos.x, ny - pos.y) <= CAPTURE_RADIUS_POSITIVE) {
        capturedByPositive = true;
        break;
      }
    }
    if (capturedByPositive) break;
    if (nx < -20 || nx > width + 20 || ny < -20 || ny > height + 20) break;
  }

  if (capturedByNegative) {
    const last = points[points.length - 1];
    const prev = points[points.length - 2] ?? last;
    const angle = Math.atan2(negative.y - prev.y, negative.x - prev.x);
    arrowPoints.push({ x: last.x, y: last.y, angle });
  }

  return { points, arrowPoints };
}

function computeFieldLines(width: number, height: number, charges: Charges, linesPerCharge: number): FieldLine[] {
  const allCharges: Charge[] = [...charges.positives, charges.negative];

  const lines: FieldLine[] = [];
  for (const positive of charges.positives) {
    for (let i = 0; i < linesPerCharge; i++) {
      const angle = (i / linesPerCharge) * Math.PI * 2;
      const start = {
        x: positive.x + Math.cos(angle) * FIELD_LINE_START_RADIUS,
        y: positive.y + Math.sin(angle) * FIELD_LINE_START_RADIUS,
      };
      lines.push(buildFieldLine(start, allCharges, charges.positives, charges.negative, width, height));
    }
  }
  return lines;
}

function drawFieldLine(ctx: CanvasRenderingContext2D, line: FieldLine) {
  if (line.points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(line.points[0].x, line.points[0].y);
  for (let i = 1; i < line.points.length; i++) {
    ctx.lineTo(line.points[i].x, line.points[i].y);
  }
  ctx.stroke();

  for (const arrow of line.arrowPoints) {
    drawArrowhead(ctx, arrow.x, arrow.y, arrow.angle, ARROW_SIZE);
  }
}

/**
 * Top-most layer, never clipped by the slider: the three charges. They
 * exist in space regardless of whether the field is revealed, so they
 * render above both the empty-space and field-line layers.
 */
function drawChargesLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  charges: Charges
) {
  ctx.clearRect(0, 0, width, height);
  for (const pos of charges.positives) {
    drawCharge(ctx, pos, true);
  }
  drawCharge(ctx, charges.negative, false);
}

function drawCharge(ctx: CanvasRenderingContext2D, point: Point, isPositive: boolean) {
  const glowRadius = isPositive ? CHARGE_GLOW_RADIUS_POSITIVE : CHARGE_GLOW_RADIUS_NEGATIVE;
  const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, glowRadius);
  if (isPositive) {
    gradient.addColorStop(0, "rgba(255,255,255,0.95)");
    gradient.addColorStop(1, "rgba(130,170,255,0.25)");
  } else {
    gradient.addColorStop(0, "rgba(255,190,175,0.85)");
    gradient.addColorStop(1, "rgba(255,110,95,0.2)");
  }
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(point.x, point.y, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "600 11px var(--font-inter, Inter, sans-serif)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = isPositive ? "rgba(15,20,45,0.8)" : "rgba(255,240,235,0.9)";
  ctx.fillText(isPositive ? "+" : "−", point.x, point.y);
}

/** Top layer, clipped by the divider: the "the field" state (field lines, charge glow, no mist). */
function drawFieldLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dots: VacuumDot[],
  chargesAndLines: ChargesAndLines,
  elapsed: number,
  showAnnotation: boolean,
  prefersReducedMotion: boolean
) {
  ctx.fillStyle = "#050510";
  ctx.fillRect(0, 0, width, height);

  drawVacuumDots(ctx, width, height, dots, prefersReducedMotion, false);

  ctx.strokeStyle = "#5B9CF6";
  ctx.fillStyle = "#5B9CF6";
  ctx.lineWidth = 1.5;

  for (const line of chargesAndLines.fieldLines) {
    drawFieldLine(ctx, line);
  }

  if (showAnnotation) {
    const cx = chargesAndLines.charges.negative.x;
    const cy = chargesAndLines.charges.negative.y;
    const ringRadius = prefersReducedMotion
      ? 40
      : 40 + 10 * Math.sin(((elapsed % RING_PERIOD_MS) / RING_PERIOD_MS) * Math.PI * 2);

    ctx.strokeStyle = "rgba(91,156,246,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText("⬡ Thumbnail frame", width - 8, 8);
  }
}

interface FieldSliderProps {
  /**
   * Renders a static, non-interactive view for use as an embedded
   * illustration (e.g. inside a card): no labels/handle/divider, no
   * drag interaction, clip-path fixed so only "the field" layer shows.
   */
  embed?: boolean;
}

// clip-path inset(0 0 0 X%) clips X% from the left, so X=0 leaves the
// entire top ("the field") canvas visible with nothing clipped away.
const EMBED_POSITION = 0;

/**
 * FieldSlider — a before/after comparison slider revealing the electric
 * field of a three-charge system (two positive charges flanking one
 * stronger negative charge). Left of the divider: empty space (void
 * mist over the ever-present vacuum fluctuations). Right of the
 * divider: the field itself, with field lines traced by numerical
 * integration from each positive charge toward the negative charge.
 * Both states are rendered in full every frame; the divider only
 * clips which one shows through.
 */
export default function FieldSlider({ embed = false }: FieldSliderProps = {}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const bottomCanvasRef = useRef<HTMLCanvasElement>(null);
  const topCanvasRef = useRef<HTMLCanvasElement>(null);
  const chargeCanvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<VacuumDot[] | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const positionRef = useRef(80);
  const draggingRef = useRef(false);

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [position, setPosition] = useState(embed ? EMBED_POSITION : 80);
  const [isDragging, setIsDragging] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  positionRef.current = position;

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const measure = (width: number) => {
      if (width <= 0) return;
      const height = Math.min(width * (9 / 16), MAX_HEIGHT);
      setSize({ width, height });

      if (!dotsRef.current) {
        const count = width < NARROW_BREAKPOINT ? DOT_COUNT_NARROW : DOT_COUNT_WIDE;
        const dots: VacuumDot[] = [];
        for (let i = 0; i < count; i++) {
          dots.push({
            xFrac: Math.random(),
            yFrac: Math.random(),
            radius: 1 + Math.random() * 0.5,
            offsetY: 0,
          });
        }
        dotsRef.current = dots;
      }
    };

    measure(el.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) measure(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Pre-computed once per size change (charge positions are fixed fractions of size), never per frame.
  const chargesAndLines = useMemo<ChargesAndLines | null>(() => {
    if (size.width === 0 || size.height === 0) return null;
    const isNarrow = size.width < NARROW_BREAKPOINT;
    const linesPerCharge = isNarrow ? FIELD_LINES_PER_CHARGE_NARROW : FIELD_LINES_PER_CHARGE_WIDE;
    const charges = computeCharges(size.width, size.height);
    const fieldLines = computeFieldLines(size.width, size.height, charges, linesPerCharge);
    return { charges, fieldLines };
  }, [size.width, size.height]);

  useEffect(() => {
    const bottomCanvas = bottomCanvasRef.current;
    const topCanvas = topCanvasRef.current;
    const chargeCanvas = chargeCanvasRef.current;
    if (
      !bottomCanvas ||
      !topCanvas ||
      !chargeCanvas ||
      size.width === 0 ||
      size.height === 0 ||
      !chargesAndLines
    )
      return;

    const dpr = window.devicePixelRatio || 1;
    const bottomCtx = configureCanvas(bottomCanvas, size.width, size.height, dpr);
    const topCtx = configureCanvas(topCanvas, size.width, size.height, dpr);
    const chargeCtx = configureCanvas(chargeCanvas, size.width, size.height, dpr);
    if (!bottomCtx || !topCtx || !chargeCtx) return;

    const { width, height } = size;

    // Charges are static (fixed fractions of size) and are never clipped by
    // the slider, so they only need to be drawn once per size change.
    drawChargesLayer(chargeCtx, width, height, chargesAndLines.charges);

    startTimeRef.current = performance.now();

    const draw = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const dots = dotsRef.current ?? [];
      const revealedFraction = (100 - positionRef.current) / 100;
      const showAnnotation = revealedFraction >= RING_THRESHOLD;

      drawEmptySpaceLayer(bottomCtx, width, height, dots, prefersReducedMotion);
      drawFieldLayer(
        topCtx,
        width,
        height,
        dots,
        chargesAndLines,
        elapsed,
        showAnnotation,
        prefersReducedMotion
      );

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [size, prefersReducedMotion, chargesAndLines]);

  const commitPosition = useCallback((value: number) => {
    setPosition(clamp(value, 0, 100));
  }, []);

  const positionFromClientX = useCallback((clientX: number) => {
    const frame = frameRef.current;
    if (!frame) return positionRef.current;
    const rect = frame.getBoundingClientRect();
    if (rect.width === 0) return positionRef.current;
    return clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
  }, []);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      draggingRef.current = true;
      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      commitPosition(positionFromClientX(e.clientX));
    },
    [commitPosition, positionFromClientX]
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      commitPosition(positionFromClientX(e.clientX));
    },
    [commitPosition, positionFromClientX]
  );

  const handlePointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const step = e.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          commitPosition(positionRef.current - step);
          break;
        case "ArrowRight":
          e.preventDefault();
          commitPosition(positionRef.current + step);
          break;
        case "Home":
          e.preventDefault();
          commitPosition(0);
          break;
        case "End":
          e.preventDefault();
          commitPosition(100);
          break;
        default:
          break;
      }
    },
    [commitPosition]
  );

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div
        ref={frameRef}
        className={`${styles.frame} ${isDragging ? styles.dragging : ""}`}
        style={{
          height: size.height ? `${size.height}px` : undefined,
          cursor: embed ? "default" : undefined,
        }}
        {...(embed
          ? {}
          : {
              onPointerDown: handlePointerDown,
              onPointerMove: handlePointerMove,
              onPointerUp: handlePointerUp,
              onPointerCancel: handlePointerUp,
            })}
      >
        <canvas ref={bottomCanvasRef} className={styles.canvasBase} aria-hidden="true" />
        <canvas
          ref={topCanvasRef}
          className={styles.canvasTop}
          style={{ clipPath: `inset(0 0 0 ${position}%)` }}
          aria-hidden="true"
        />
        <canvas ref={chargeCanvasRef} className={styles.canvasCharges} aria-hidden="true" />

        {!embed && (
          <>
            <span className={`${styles.cornerLabel} ${styles.cornerLabelLeft}`}>
              empty space
            </span>
            <span className={`${styles.cornerLabel} ${styles.cornerLabelRight}`}>
              the field
            </span>

            <div className={styles.divider} style={{ left: `${position}%` }} />
            <div
              className={styles.handle}
              style={{ left: `${position}%` }}
              role="slider"
              tabIndex={0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(position)}
              aria-label="Compare empty space and the electric field"
              onKeyDown={handleKeyDown}
            >
              <span className={styles.chevron} aria-hidden="true">
                ‹
              </span>
              <span className={styles.chevron} aria-hidden="true">
                ›
              </span>
            </div>
          </>
        )}
      </div>
      <p role="caption" className={styles.caption}>
        Two like charges repel &mdash; but both answer to the one
        opposite charge between them.
      </p>
    </div>
  );
}
