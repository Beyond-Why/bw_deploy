import { getBuilderLog } from "@/lib/content";
import { notFound } from "next/navigation";
import LogEntry from "@/components/builder-log/LogEntry";
import LogDiscussion from "@/components/builder-log/LogDiscussion";
import { BuilderLogIcon } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getProfileById } from "@/lib/profile";
import type { CurrentUser } from "@/components/comments/CommentSection";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/mdx/MDXComponents";
import { mdxOptions } from "@/components/mdx/mdxOptions";
import "@/components/mdx/katex";
import styles from "./page.module.css";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  isPlaceholder,
  isUnreleased,
  metaDescription,
  modifiedDate,
  pageMetadata,
  publishedDate,
} from "@/lib/seo";

interface PageProps {
  params: Promise<{ series: string; episode: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { series, episode } = await params;
  const log = await getBuilderLog(series);
  const entry = log?.logs.find((item) => item.slug === episode);
  if (!log || !entry || isPlaceholder(log.frontmatter)) notFound();
  const seriesTitle = log.frontmatter.title;
  // og:image / twitter:image come from ./opengraph-image — the log's cover
  // stamped with "Day N" and the series title.
  return pageMetadata({
    title: `Day ${entry.day}: ${entry.title}, ${seriesTitle}`,
    description: entry.excerpt || metaDescription(entry.frontmatter, entry.body),
    path: `/builder-log/${series}/${episode}`,
    type: "article",
    publishedTime: publishedDate(entry.frontmatter),
    modifiedTime: modifiedDate(entry.frontmatter),
    section: seriesTitle,
    noindex: isUnreleased(log.frontmatter, entry.frontmatter),
  });
}

export default async function BuilderLogEpisodePage({ params }: PageProps) {
  const { series, episode } = await params;
  const log = await getBuilderLog(series);
  // Only slugs the series actually lists — never index.mdx or an arbitrary file.
  const index = log ? log.logs.findIndex((entry) => entry.slug === episode) : -1;
  if (!log || index === -1 || isPlaceholder(log.frontmatter)) notFound();

  const entry = log.logs[index];
  const prev = log.logs[index - 1] ?? null;
  const next = log.logs[index + 1] ?? null;
  const seriesTitle = log.frontmatter.title;

  const user = await getCurrentUser();
  const profile = user ? await getProfileById(user.id) : null;
  const currentUser: CurrentUser | null = profile
    ? {
        id: profile.id,
        handle: profile.username,
        displayName: profile.displayName || profile.username,
        avatarUrl: profile.avatarUrl,
      }
    : null;

  const episodePath = `/builder-log/${series}/${episode}`;
  const seriesPath = `/builder-log/${series}`;
  const structuredData = [
    articleJsonLd({
      headline: entry.title,
      description: metaDescription(entry.frontmatter, entry.body),
      path: episodePath,
      images: [`${episodePath}/opengraph-image`, entry.thumbnail || log.frontmatter.thumbnail],
      datePublished: publishedDate(entry.frontmatter),
      dateModified: modifiedDate(entry.frontmatter),
      position: entry.day,
      partOf: { name: seriesTitle, path: seriesPath },
    }),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: seriesTitle, path: seriesPath },
      { name: entry.title, path: episodePath },
    ]),
  ];

  return (
    <>
      <JsonLd data={structuredData} />
      <article className={styles.page}>
        <Link href={seriesPath} className={styles.seriesLink}>
          <BuilderLogIcon size={14} />
          {seriesTitle}
        </Link>

        <LogEntry
          series={series}
          log={entry}
          isLatest={!next}
          current
          priority
          headingLevel={1}
          body={<MDXRemote source={entry.body} components={mdxComponents} options={mdxOptions} />}
        />

        <nav className={styles.nav} aria-label="Other logs">
          {prev ? (
            <Link href={`${seriesPath}/${prev.slug}`} className={styles.navLink}>
              <span className={styles.navDirection}>← Day {prev.day}</span>
              <span className={styles.navTitle}>{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          <Link href={`${seriesPath}#day-${entry.day}`} className={styles.journey}>
            See it in the journey
          </Link>
          {next ? (
            <Link href={`${seriesPath}/${next.slug}`} className={`${styles.navLink} ${styles.navNext}`}>
              <span className={styles.navDirection}>Day {next.day} →</span>
              <span className={styles.navTitle}>{next.title}</span>
            </Link>
          ) : (
            <span />
          )}
        </nav>

        <div className={styles.discussion}>
          <LogDiscussion
            series={series}
            slug={entry.slug}
            day={entry.day}
            title={entry.title}
            user={currentUser}
          />
        </div>
      </article>
    </>
  );
}
