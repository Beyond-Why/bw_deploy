import Image from "next/image";
import Link from "next/link";
import { getEpisode, getSeriesIndex } from "@/lib/content";
import { publicFileExists } from "@/lib/publicAsset";
import { DeepDiveIcon } from "@/components/icons";
import styles from "./DeepDiveLink.module.css";

/**
 * A compact link card out to a Deep Dive — thumbnail, "Deep Dive" kicker,
 * series title and, with `chapter`, that chapter's label. `chapter` is an
 * episode number or slug (3 or "episode_3"). Renders nothing if the series
 * doesn't exist; an unknown chapter falls back to the series itself.
 *
 *   <DeepDiveLink series="the-field-that-powers-the-world" chapter="2" />
 */
export default async function DeepDiveLink({
  series,
  chapter,
}: {
  series: string;
  chapter?: string | number;
}) {
  const seriesData = await getSeriesIndex("deep-dives", series);
  if (!seriesData || !seriesData.frontmatter.title) return null;

  const episodeSlug =
    chapter === undefined || chapter === ""
      ? null
      : /^\d+$/.test(String(chapter))
        ? `episode_${chapter}`
        : String(chapter);
  const episode = episodeSlug ? await getEpisode("deep-dives", series, episodeSlug) : null;

  const href = episode ? `/deep-dives/${series}/${episodeSlug}` : `/deep-dives/${series}`;
  // Same thumbnail choice the Deep Dive reader makes: the chapter's own,
  // falling back to the series', falling back to a gradient placeholder.
  const thumbnail = episode?.frontmatter.thumbnail || seriesData.frontmatter.thumbnail;
  const showThumbnail = !!thumbnail && (await publicFileExists(thumbnail));

  return (
    <Link href={href} className={styles.card}>
      <span className={styles.thumb}>
        {showThumbnail ? (
          <Image src={thumbnail} alt="" fill sizes="96px" className={styles.image} />
        ) : (
          <span className={styles.thumbPlaceholder} />
        )}
      </span>
      <span className={styles.text}>
        <span className={styles.kicker}>
          <DeepDiveIcon size={13} />
          Deep Dive
        </span>
        <span className={styles.title}>{seriesData.frontmatter.title}</span>
        {episode && (
          <span className={styles.chapter}>
            Chapter {episode.frontmatter.episode} · {episode.frontmatter.title}
          </span>
        )}
      </span>
    </Link>
  );
}
