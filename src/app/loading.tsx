import { Lottie } from "lottie-react";
import styles from "./loading.module.css";

export default function Loading() {
  return (
    <div className={styles.wrapper} role="status" aria-label="Loading">
      {/* Reduced-motion split is pure CSS (see loading.module.css) rather
          than a JS matchMedia check — this file can render server-side/
          pre-hydration (see the background-color note below), so picking
          the branch with client state would risk a hydration mismatch or
          a flash of the animated mark before swapping to the static one. */}
      <Lottie
        src="/logo/loading-animation.json"
        loop
        autoplay
        className={`${styles.mark} ${styles.animatedMark}`}
      />
      <img
        src="/logo/apertures-light.svg"
        alt=""
        className={`${styles.mark} ${styles.staticMark}`}
      />
    </div>
  );
}
