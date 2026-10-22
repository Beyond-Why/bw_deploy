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
import { LogOrderProvider, type LogOrder } from "@/components/builder-log/logState";
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
        // Until the journey bar tracks scrolling, "being read" = the newest.
        current={entry === newest}
        priority={entry === firstInOrder}
        body={<MDXRemote source={entry.body} components={mdxComponents} options={mdxOptions} />}
      />
    ),
  }));

  return (
    <>
      <JsonLd data={structuredData} />
      <article className={styles.page}>
        <LogOrderProvider initialOrder={initialOrder}>
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
          <LogFeed logs={feedLogs} />
        </LogOrderProvider>
      </article>
    </>
  );
}
