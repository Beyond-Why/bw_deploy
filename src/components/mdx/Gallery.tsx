import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import Photo, { type PhotoProps } from "./Photo";
import styles from "./Gallery.module.css";

/**
 * A row of photos — three columns with captions under each, and a
 * sideways-scrolling strip under 700px.
 *
 *   <Gallery>
 *     <Photo src="/content/…/a.png" alt="…" caption="On the straight" />
 *     <Photo src="/content/…/b.png" alt="…" caption="On the curve" />
 *     <Photo src="/content/…/c.png" alt="…" caption="Tuning" />
 *   </Gallery>
 */
export default function Gallery({ children }: { children: ReactNode }) {
  const photos = Children.map(children, (child) =>
    isValidElement<PhotoProps>(child) && child.type === Photo
      ? cloneElement(child, { variant: "gallery" })
      : child
  );
  return <div className={styles.gallery}>{photos}</div>;
}
