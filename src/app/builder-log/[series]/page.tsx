import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getBuilderLog } from "@/lib/content";
import { formatDayLabel } from "@/lib/formatDate";
import { mdxComponents } from "@/components/mdx/MDXComponents";
import { mdxOptions } from "@/components/mdx/mdxOptions";
import "@/components/mdx/katex";
import LogEntry from "@/components/builder-log/LogEntry";
import LogFeed from "@/components/builder-log/LogFeed";
import SeriesHeader from "@/components/builder-log/SeriesHeader";
import JourneyBar from "@/components/builder-log/JourneyBar";
import BookmarkBuildButton from "@/components/builder-log/BookmarkBuildButton";
import { LogStateProvider, type LogMeta, type LogOrder } from "@/components/builder-log/logState";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getBookmarkState } from "@/lib/bookmarks";
import { publicFileExists } from "@/lib/publicAsset";
import { JsonLd } from "@/components/seo/JsonLd";
import { isPlaceholder, isUnreleased, metaDescription, pageMetadata, seriesJsonLd } from "@/lib/seo";
import styles from "./page.module.css";

interface PageProps {
  params: Promise<{ series: string }>;
  searchParams: Promise<{ order?: string }>;
}

export async function generateMetadata({ params }: { params: PageProps["params"] }) {
  const { series } = await params;
  const log = await getBuilderLog(series);
  if (!log || isPlaceholder(log.frontmatter)) notFound();
  // path has no query string, so ?order=oldest shares the clean canonical.
  return pageMetadata({
    title: log.frontmatter.title,
    description: metaDescription(log.frontmatter, log.intro),
    path: `/builder-log/${series}`,
    noindex: isUnreleased(log.frontmatter),
  });
}

export default async function BuilderLogSeriesPage({ params, searchParams }: PageProps) {
  const { series } = await params;
  const { order: orderParam } = await searchParams;
  const log = await getBuilderLog(series);
  if (!log || isPlaceholder(log.frontmatter)) notFound();

  const { frontmatter, logs } = log;
  const initialOrder: LogOrder = orderParam === "oldest" ? "oldest" : "newest";
  const newest = logs[logs.length - 1];
  const firstInOrder = initialOrder === "newest" ? newest : logs[0];

  const structuredData = seriesJsonLd({
    name: frontmatter.title,
    description: metaDescription(frontmatter, log.intro),
    path: `/builder-log/${series}`,
    image: frontmatter.thumbnail,
    parts: logs
      .filter((entry) => !isUnreleased(frontmatter, entry.frontmatter))
      .map((entry) => ({
        headline: entry.title,
        path: `/builder-log/${series}/${entry.slug}`,
        position: entry.day,
      })),
  });

  const feedLogs = logs.map((entry) => ({
    day: entry.day,
    node: (
      <LogEntry
        series={series}
        log={entry}
        isLatest={entry === newest}
        priority={entry === firstInOrder}
        body={<MDXRemote source={entry.body} components={mdxComponents} options={mdxOptions} />}
      />
    ),
  }));

  const logMeta: LogMeta[] = await Promise.all(
    logs.map(async (entry) => ({
      day: entry.day,
      slug: entry.slug,
      title: entry.title,
      dateLabel: entry.dateLabel,
      highlight: entry.highlight,
      thumbnail: entry.thumbnail,
      thumbnailAlt: entry.thumbnailAlt,
      hasThumbnail: entry.thumbnail ? await publicFileExists(entry.thumbnail) : false,
    }))
  );

  // "Bookmark this build" — the series bookmark the profile's Builder Logs
  // tab lists. A database hiccup shouldn't take the page down with it, so
  // it falls back to "not bookmarked".
  const user = await getCurrentUser();
  let bookmark = { count: 0, bookmarked: false };
  try {
    bookmark = await getBookmarkState(user?.id ?? null, `builder-log/${series}`, "builder-log");
  } catch (err) {
    console.error("Builder Log bookmark state failed; rendering as not bookmarked", err);
  }

  return (
    <>
      <JsonLd data={structuredData} />
      <article className={styles.page}>
        <LogStateProvider initialOrder={initialOrder} logs={logMeta}>
          <SeriesHeader
            title={frontmatter.title}
            premise={frontmatter.description}
            category={frontmatter.category}
            status={frontmatter.status}
            started={formatDayLabel(log.firstDate) || undefined}
            latest={formatDayLabel(log.lastDate) || undefined}
            count={log.count}
            lastDay={log.lastDay}
            intro={
              log.intro ? (
                <MDXRemote source={log.intro} components={mdxComponents} options={mdxOptions} />
              ) : null
            }
          />
          <LogFeed
            logs={feedLogs}
            oldestEndActions={
              <BookmarkBuildButton
                series={series}
                initialBookmarked={bookmark.bookmarked}
                initialCount={bookmark.count}
                isAuthenticated={!!user}
                metadata={{
                  contentTitle: frontmatter.title,
                  contentUrl: `/builder-log/${series}`,
                  thumbnailUrl: frontmatter.thumbnail ?? null,
                  contentCategory: frontmatter.category ?? null,
                }}
              />
            }
          />
          <JourneyBar />
        </LogStateProvider>
      </article>
    </>
  );
}
