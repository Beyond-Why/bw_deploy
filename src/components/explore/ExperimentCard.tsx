import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import type { ExperimentCardData } from "@/lib/explore";
import { MotifArt } from "./MotifArt";
import styles from "./ExperimentCard.module.css";
import tones from "./tones.module.css";

/** "Tried it myself": a portrait card that opens the trail at the experiment's step. */
export function ExperimentCard({ data }: { data: ExperimentCardData }) {
  return (
    <Link href={`/explore/${data.slug}#step-${data.step}`} className={`${styles.card} ${tones[data.tone]}`}>
      {data.poster ? (
        <Image src={data.poster} alt="" fill sizes="(min-width: 1000px) 20vw, 170px" className={styles.image} />
      ) : (
        <MotifArt motif={data.motif} shape="tall" />
      )}
      {data.duration && (
        <span className={styles.duration}>
          <Icon name="src-video" size={12} />
          {data.duration}
          <span className="visually-hidden"> video</span>
        </span>
      )}
      <span className={styles.bottom}>
        <span className={styles.title}>{data.title}</span>
        <span className={styles.from}>
          Step {data.step} · {data.explorationTitle}
        </span>
      </span>
    </Link>
  );
}

/** The row the cards sit in: 5 across on desktop, 3 under 1000px, a side-scrolling row on phones. */
export function ExperimentRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}
