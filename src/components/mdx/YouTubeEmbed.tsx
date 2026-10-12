import styles from "./YouTubeEmbed.module.css";

interface YouTubeEmbedProps {
  id: string;
  title: string;
  start?: number;
}

export default function YouTubeEmbed({ id, title, start }: YouTubeEmbedProps) {
  const src = `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1${start ? `&start=${start}` : ""}`;
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
