"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CommentSection, type CurrentUser } from "@/components/comments/CommentSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import styles from "./LogDiscussion.module.css";

/**
 * One log's comment thread, on its share page at #discussion — where the
 * series page's "Discuss this log" points. A thin client wrapper (like
 * HubDiscussion) because sending a signed-out reader to /signin needs a
 * router.
 *
 * Comments use the shared comments table: contentId
 * "builder-log/<series>/<episode_N>", contentType "episode", and a
 * seriesId prefixed with "builder-log/" so a log thread can never be
 * folded into a Deep Dive hub that happens to share the series slug.
 */
export default function LogDiscussion({
  series,
  slug,
  day,
  title,
  user,
}: {
  series: string;
  slug: string;
  day: number;
  title: string;
  user: CurrentUser | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  // Same belt-and-suspenders as HubDiscussion: the browser's own #discussion
  // jump can fire before this client tree has mounted.
  useEffect(() => {
    if (window.location.hash === "#discussion") ref.current?.scrollIntoView({ block: "start" });
  }, []);

  return (
    <div id="discussion" ref={ref} className={styles.discussion}>
      <SectionHeading label="Discussion" className={styles.heading} />
      <CommentSection
        contentId={`builder-log/${series}/${slug}`}
        seriesId={`builder-log/${series}`}
        contentType="episode"
        episodeNumber={String(day)}
        episodeTitle={title}
        user={user}
        onRequestAuth={() => router.push(`/signin?next=${encodeURIComponent(`${pathname}#discussion`)}`)}
      />
    </div>
  );
}
