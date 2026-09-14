"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./PopularSection.module.css";
import type { NormalizedFeaturedContent } from "@/lib/content";

interface PopularSectionProps {
  content: NormalizedFeaturedContent[];
}

export function PopularSection({ content }: PopularSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [showArrows, setShowArrows] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const overflows = el.scrollWidth > el.clientWidth + 2;
    setShowArrows(overflows);
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [checkScroll, content?.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const firstCard = el.querySelector(`.${styles.card}`) as HTMLElement;
    // 24px is var(--space-md) roughly
    const itemWidth = firstCard ? firstCard.offsetWidth + 24 : 260;
    el.scrollBy({ left: dir * itemWidth, behavior: "smooth" });
  };

  if (!content || content.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Most Popular</h2>
        <div className={styles.carouselWrapper}>
          {showArrows && (
            <button
              className={`${styles.arrow} ${styles.arrowLeft} ${!canScrollLeft ? styles.arrowHidden : ""}`}
              onClick={() => scrollBy(-1)}
              aria-label="Scroll left"
            >
              ‹
            </button>
          )}

          <div className={styles.grid} ref={scrollRef}>
            {content.map((item, index) => (
              <Link key={index} href={item.href} className={styles.card}>
                <div className={styles.imageWrapper}>
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      className={styles.image}
                    />
                  ) : (
                    <div className={styles.imagePlaceholder} />
                  )}
                </div>
                <div className={styles.content}>
                  <h3 className={styles.title}>{item.title}</h3>
                  <p className={styles.meta}>{item.metadataLabel}</p>
                </div>
              </Link>
            ))}
          </div>

          {showArrows && (
            <button
              className={`${styles.arrow} ${styles.arrowRight} ${!canScrollRight ? styles.arrowHidden : ""}`}
              onClick={() => scrollBy(1)}
              aria-label="Scroll right"
            >
              ›
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
