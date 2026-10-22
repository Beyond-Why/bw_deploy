import Image from "next/image";
import { publicFileExists } from "@/lib/publicAsset";
import MediaPlaceholder from "@/components/mdx/MediaPlaceholder";
import CoverPlayer from "./CoverPlayer";
import styles from "./LogCover.module.css";

/** A YouTube id is the bare 11-character token — no slashes or dots. */
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * A log's 16:9 cover, never cropped. With a video it becomes the poster
 * for CoverPlayer; a video file that doesn't exist yet leaves the plain
 * cover (no play button), and a missing cover image shows the quiet
 * MediaPlaceholder.
 */
export default async function LogCover({
  thumbnail,
  thumbnailAlt,
  video,
  videoLength,
  title,
  priority = false,
}: {
  thumbnail?: string;
  thumbnailAlt?: string;
  video?: string;
  videoLength?: string;
  title: string;
  /** The first cover on the page — loaded eagerly as the LCP image. */
  priority?: boolean;
}) {
  const [hasImage, videoKind] = await Promise.all([
    thumbnail ? publicFileExists(thumbnail) : Promise.resolve(false),
    resolveVideo(video),
  ]);

  if (!thumbnail && !videoKind) return null;

  const cover =
    thumbnail && hasImage ? (
      <Image
        src={thumbnail}
        alt={thumbnailAlt ?? ""}
        fill
        priority={priority}
        sizes="(max-width: 700px) 100vw, 680px"
        className={styles.image}
      />
    ) : (
      <MediaPlaceholder label={thumbnailAlt || title} />
    );

  if (videoKind === "youtube") {
    return <CoverPlayer cover={cover} youtubeId={video} length={videoLength} title={title} />;
  }
  if (videoKind === "file") {
    return <CoverPlayer cover={cover} video={video} length={videoLength} title={title} />;
  }
  return <div className={styles.frame}>{cover}</div>;
}

async function resolveVideo(video?: string): Promise<"youtube" | "file" | null> {
  if (!video) return null;
  if (YOUTUBE_ID.test(video)) return "youtube";
  return (await publicFileExists(video)) ? "file" : null;
}
