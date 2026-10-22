import Image from "next/image";
import { publicFileExists } from "@/lib/publicAsset";
import MediaPlaceholder from "./MediaPlaceholder";
import styles from "./Photo.module.css";

/**
 * One photo with its caption. On its own it spans the log column; inside
 * <Gallery> or <Compare> those set `variant` (never set it by hand).
 *
 *   <Photo src="/content/builder-log/line-follower/photo-32-curve.png"
 *          alt="The robot holding the tight curve." caption="Holding the tight curve" />
 *
 * Shown in a 16:9 frame and never cropped. A file that doesn't exist yet
 * renders a placeholder box with the alt text instead of a broken image.
 */

export type PhotoVariant = "single" | "gallery" | "compare";

export interface PhotoProps {
  src: string;
  alt: string;
  caption?: string;
  variant?: PhotoVariant;
}

const SIZES: Record<PhotoVariant, string> = {
  single: "(max-width: 700px) 100vw, 680px",
  gallery: "(max-width: 700px) 78vw, 220px",
  compare: "(max-width: 700px) 50vw, 340px",
};

export default async function Photo({ src, alt, caption, variant = "single" }: PhotoProps) {
  const exists = await publicFileExists(src);

  return (
    <figure className={`${styles.photo} ${styles[variant]}`}>
      <div className={styles.frame}>
        {exists ? (
          <Image src={src} alt={alt} fill sizes={SIZES[variant]} className={styles.image} />
        ) : (
          <MediaPlaceholder label={alt} />
        )}
      </div>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}
