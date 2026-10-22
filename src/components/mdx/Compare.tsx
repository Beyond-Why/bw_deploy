import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import Photo, { type PhotoProps } from "./Photo";
import styles from "./Compare.module.css";

/**
 * Two photos side by side — each one's caption becomes a small label in
 * its top-left corner — with an optional caption under both.
 *
 *   <Compare caption="Same tape, two rooms">
 *     <Photo src="/content/…/before.png" alt="…" caption="Before" />
 *     <Photo src="/content/…/after.png" alt="…" caption="After" />
 *   </Compare>
 */
export default function Compare({ children, caption }: { children: ReactNode; caption?: string }) {
  const photos = Children.map(children, (child) =>
    isValidElement<PhotoProps>(child) && child.type === Photo
      ? cloneElement(child, { variant: "compare" })
      : child
  );
  return (
    <figure className={styles.compare}>
      <div className={styles.pair}>{photos}</div>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}
