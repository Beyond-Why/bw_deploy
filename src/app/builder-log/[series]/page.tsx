import { getSeriesIndex, getEpisodes } from "@/lib/content";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/mdx/MDXComponents";
import { mdxOptions } from "@/components/mdx/mdxOptions";
import { StatusPill } from "@/components/library";
import styles from "./page.module.css";
import Link from "next/link";

interface PageProps {
  params: Promise<{ series: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { series } = await params;
  const { frontmatter } = await getSeriesIndex("builder-log", series);
  return {
    title: `${frontmatter.title} — Builder Log — Beyond Why`,
    description: frontmatter.description,
  };
}

export default async function BuilderLogSeriesPage({ params }: PageProps) {
  const { series } = await params;
  const { frontmatter, content } = await getSeriesIndex("builder-log", series);
  const episodes = await getEpisodes("builder-log", series);

  const tags = Array.isArray(frontmatter.tags) ? (frontmatter.tags as string[]) : [];
  const milestonesHit = Number(frontmatter.milestonesHit) || 0;
  const milestonesTotal = Number(frontmatter.milestonesTotal) || 0;

  return (
    <article className={styles.seriesPage}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.label}>Builder Log</span>
        {frontmatter.category && (
          <span className={styles.category}>{frontmatter.category}</span>
        )}
        {frontmatter.status && <StatusPill status={frontmatter.status} kind="builderlog" />}
      </header>

      <h1 className={styles.title}>{frontmatter.title}</h1>

      {/* Tech stack — moved off the card */}
      {tags.length > 0 && (
        <div className={styles.techRow}>
          {tags.map((tag) => (
            <span key={tag} className={styles.techChip}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Series Content */}
      <div className="prose">
        <MDXRemote source={content} components={mdxComponents} options={mdxOptions} />
      </div>

      {/* Milestone breakdown — moved off the card */}
      {milestonesTotal > 0 && (
        <div className={styles.milestoneBlock}>
          <h2 className={styles.milestoneTitle}>Milestones</h2>
          <div className={styles.milestoneMeter}>
            <div className={styles.milestoneSegments} aria-hidden="true">
              {Array.from({ length: milestonesTotal }).map((_, i) => (
                <span
                  key={i}
                  className={i < milestonesHit ? styles.milestoneSegmentDone : styles.milestoneSegment}
                />
              ))}
            </div>
            <span className={styles.milestoneCount}>
              {milestonesHit} of {milestonesTotal} hit
            </span>
          </div>
        </div>
      )}

      {/* Episode Timeline — the full log, unabridged (the card only shows the 3 most recent) */}
      {episodes.length > 0 && (
        <nav className={styles.timeline}>
          <h2 className={styles.timelineTitle}>Build Timeline</h2>
          <ol className={styles.episodes}>
            {[...episodes].sort((a, b) => b.episode - a.episode).map((ep) => (
              <li key={ep.slug} className={styles.episodeItem}>
                <Link
                  href={`/builder-log/${series}/${ep.slug}`}
                  className={styles.episodeLink}
                >
                  <div className={styles.timelineDot} />
                  <div className={styles.episodeContent}>
                    <span className={styles.episodeNum}>
                      Log {String(ep.episode).padStart(2, "0")}
                    </span>
                    <span className={styles.episodeTitle}>
                      {ep.frontmatter.title}
                    </span>
                    {ep.frontmatter.description && (
                      <span className={styles.episodeDesc}>
                        {ep.frontmatter.description}
                      </span>
                    )}
                    {ep.frontmatter.date && (
                      <span className={styles.episodeDate}>
                        {ep.frontmatter.date}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </article>
  );
}
