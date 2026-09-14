import {
  getSeriesIndex,
  getEpisode,
  getEpisodes,
} from "@/lib/content";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/mdx/MDXComponents";
import { mdxOptions } from "@/components/mdx/mdxOptions";
import styles from "./page.module.css";
import Link from "next/link";

interface PageProps {
  params: Promise<{ series: string; episode: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { series, episode } = await params;
  try {
    const { frontmatter } = await getEpisode("builder-log", series, episode);
    const seriesData = await getSeriesIndex("builder-log", series);
    return {
      title: `${frontmatter.title} — ${seriesData.frontmatter.title} — Beyond Why`,
      description: frontmatter.description,
    };
  } catch {
    return {};
  }
}

export default async function BuilderLogEpisodePage({ params }: PageProps) {
  const { series, episode } = await params;
  let frontmatter: Awaited<ReturnType<typeof getEpisode>>["frontmatter"];
  let content: Awaited<ReturnType<typeof getEpisode>>["content"];
  let seriesData: Awaited<ReturnType<typeof getSeriesIndex>>;
  let episodes: Awaited<ReturnType<typeof getEpisodes>>;
  try {
    ({ frontmatter, content } = await getEpisode("builder-log", series, episode));
    seriesData = await getSeriesIndex("builder-log", series);
    episodes = await getEpisodes("builder-log", series);
  } catch {
    notFound();
  }

  const currentIndex = episodes.findIndex((ep) => ep.slug === episode);
  const prevEpisode = currentIndex > 0 ? episodes[currentIndex - 1] : null;
  const nextEpisode =
    currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;

  return (
    <article className={styles.episodePage}>
      {/* Header */}
      <header className={styles.header}>
        <Link href={`/builder-log/${series}`} className={styles.seriesLink}>
          ← {seriesData.frontmatter.title}
        </Link>
        <div className={styles.meta}>
          <span className={styles.label}>Builder Log</span>
          <span className={styles.episodeNum}>
            Episode {frontmatter.episode}
          </span>
          {frontmatter.date && (
            <span className={styles.date}>{frontmatter.date}</span>
          )}
        </div>
        <h1 className={styles.title}>{frontmatter.title}</h1>
        {frontmatter.description && (
          <p className={styles.description}>{frontmatter.description}</p>
        )}
      </header>

      {/* Content */}
      <div className="prose">
        <MDXRemote source={content} components={mdxComponents} options={mdxOptions} />
      </div>

      {/* Episode Navigation */}
      <nav className={styles.navigation}>
        {prevEpisode ? (
          <Link
            href={`/builder-log/${series}/${prevEpisode.slug}`}
            className={styles.navLink}
          >
            <span className={styles.navDirection}>← Previous</span>
            <span className={styles.navTitle}>
              {prevEpisode.frontmatter.title}
            </span>
          </Link>
        ) : (
          <Link
            href={`/builder-log/${series}`}
            className={styles.navLink}
          >
            <span className={styles.navDirection}>← Back</span>
            <span className={styles.navTitle}>Project Overview</span>
          </Link>
        )}

        {nextEpisode ? (
          <Link
            href={`/builder-log/${series}/${nextEpisode.slug}`}
            className={`${styles.navLink} ${styles.navLinkNext}`}
          >
            <span className={styles.navDirection}>Next →</span>
            <span className={styles.navTitle}>
              {nextEpisode.frontmatter.title}
            </span>
          </Link>
        ) : (
          <div
            className={`${styles.navLink} ${styles.navLinkNext} ${styles.navLinkDisabled}`}
          >
            <span className={styles.navDirection}>Latest</span>
            <span className={styles.navTitle}>You&apos;re caught up</span>
          </div>
        )}
      </nav>
    </article>
  );
}
