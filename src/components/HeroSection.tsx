import Image from "next/image";
import Link from "next/link";
import type { NormalizedFeaturedContent } from "@/lib/content";
import styles from "./HeroSection.module.css";

interface HeroSectionProps {
  content: NormalizedFeaturedContent;
}

export function HeroSection({ content }: HeroSectionProps) {
  if (!content) return null;

  const ctaLabel = content.type === "series" ? "Read Series" : "Read the Latest";

  // Default to dark if thumbnailTone is not set — safest fallback
  const toneClass =
    content.thumbnailTone === "light" ? styles.toneLight : styles.toneDark;

  return (
    <section className={styles.heroSection}>
      {/* Canvas background + tone driven by content's thumbnailTone */}
      <div className={`${styles.canvas} ${toneClass}`}>

        {/* ── RIGHT: article image bleeding into the canvas ── */}
        {content.thumbnail && (
          <div className={styles.imageStage}>
            <Image
              src={content.thumbnail}
              alt={content.title}
              fill
              priority
              className={styles.image}
              sizes="60vw"
            />
            {/* These gradients reference --c-bg-rgb so they match the canvas color */}
            <div className={styles.imageFadeLeft} />
            <div className={styles.imageFadeBottom} />
          </div>
        )}

        {/* ── LEFT: text, vertically centered ── */}
        <div className={styles.content}>
          <h1 className={styles.title}>{content.title}</h1>

          {content.description && (
            <p className={styles.description}>{content.description}</p>
          )}

          <Link href={content.href} className={styles.cta}>
            <span className={styles.ctaCircle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </span>
            <span className={styles.ctaLabel}>{ctaLabel.toUpperCase()}</span>
          </Link>
        </div>

      </div>
    </section>
  );
}
