import styles from "./YouTubeEmbed.module.css";

interface YouTubeEmbedProps {
  id: string;
  title: string;
  start?: number;
  /** Start playing on load — only for embeds that appear because the
   *  reader just clicked play (e.g. a Builder Log cover). */
  autoplay?: boolean;
}

export default function YouTubeEmbed({ id, title, start, autoplay }: YouTubeEmbedProps) {
  const src = `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1${start ? `&start=${start}` : ""}${autoplay ? "&autoplay=1" : ""}`;
  return (
    <div className={styles.wrapper}>
      <iframe
        className={styles.iframe}
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        loading="lazy"
      />
    </div>
  );
}
