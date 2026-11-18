import Image from "next/image";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons/Icon";
import { SOURCE_ICON, STEP_ICON } from "@/components/icons/iconPaths";
import { ButtonLink, IconButton } from "@/components/ui/Button";
import type { ExplorationCardData, TrailPreviewStep } from "@/lib/explore";
import { MotifArt } from "./MotifArt";
import { TrailCounts } from "./TrailCounts";
import styles from "./ExplorationCard.module.css";
import tones from "./tones.module.css";

function stepIcon(step: TrailPreviewStep): IconName {
  if (step.kind === "source" && step.sourceType) return SOURCE_ICON[step.sourceType];
  return STEP_ICON[step.kind];
}

export function explorationHref(slug: string, view?: "trail") {
  return view ? `/explore/${slug}?view=${view}` : `/explore/${slug}`;
}

/** 16:9 thumbnail: the image if there is one, else motif art on its tone. */
export function Thumbnail({
  data,
  sizes = "(min-width: 1400px) 25vw, (min-width: 900px) 33vw, (min-width: 560px) 50vw, 100vw",
}: {
  data: Pick<ExplorationCardData, "thumbnail" | "tone" | "motif" | "minutes">;
  sizes?: string;
}) {
  return (
    <div className={`${styles.thumb} ${tones[data.tone]}`}>
      {data.thumbnail ? (
        <Image src={data.thumbnail} alt="" fill sizes={sizes} className={styles.image} />
      ) : (
        <MotifArt motif={data.motif} />
      )}
      <span className={styles.badge}>{data.minutes} min</span>
    </div>
  );
}

interface ExplorationCardProps {
  data: ExplorationCardData;
  /** "grid": the standard card with the hover card. "feature": the larger
   *  "New this week" card with its teaser, no hover card. */
  variant?: "grid" | "feature";
  /** Heading level for the title; cards sit under an h2 by default. */
  headingLevel?: "h3" | "h4";
}

/** Content card: no box, a 16:9 thumbnail, topic, serif title and trail counts.
 *  On pointer devices a hover card opens after 350ms (pure CSS: transition-delay),
 *  and also when focus moves inside the card. */
export function ExplorationCard({ data, variant = "grid", headingLevel: H = "h3" }: ExplorationCardProps) {
  const href = explorationHref(data.slug);

  if (variant === "feature") {
    return (
      <Link href={href} className={`${styles.link} ${styles.feature}`}>
        <Thumbnail data={data} sizes="(min-width: 900px) 40vw, 100vw" />
        <span className={styles.topic}>{data.topic}</span>
        <H className={styles.featureTitle}>
          <span className={styles.u}>{data.title}</span>
        </H>
        <p className={styles.featureTeaser}>{data.teaser}</p>
      </Link>
    );
  }

  return (
    <article className={styles.card}>
      <Link href={href} className={styles.link}>
        <Thumbnail data={data} />
        <span className={styles.topic}>{data.topic}</span>
        <H className={styles.title}>
          <span className={styles.u}>{data.title}</span>
        </H>
        <TrailCounts summary={data.summary} />
      </Link>

      <div className={styles.pop} role="group" aria-label={`Preview: ${data.title}`}>
        {data.trailStart.length > 0 && (
          <div className={styles.trail}>
            <span className={styles.label}>How the trail starts</span>
            {data.trailStart.map((step, i) => (
              <div key={i} className={styles.step}>
                <Icon name={stepIcon(step)} size={14} className={styles.stepIcon} />
                <span>{step.text}</span>
              </div>
            ))}
            {data.moreSteps > 0 && (
              <span className={styles.more}>
                + {data.moreSteps} more {data.moreSteps === 1 ? "step" : "steps"}
              </span>
            )}
          </div>
        )}
        <span className={styles.topic}>
          {data.topic} · {data.minutes} min
        </span>
        <span className={styles.popTitle}>{data.title}</span>
        <p className={styles.teaser}>{data.teaser}</p>
        {data.leadsTo.length > 0 && (
          <>
            <span className={styles.label}>Leads to</span>
            <div className={styles.leads}>
              {data.leadsTo.map((text) => (
                <span key={text} className={styles.lead}>
                  {text}
                </span>
              ))}
            </div>
          </>
        )}
        <div className={styles.actions}>
          <ButtonLink href={href} variant="solid">
            Read the story
          </ButtonLink>
          <ButtonLink href={explorationHref(data.slug, "trail")} variant="line">
            Walk the trail
          </ButtonLink>
          <IconButton aria-label={`Save ${data.title} for later`} className={styles.save}>
            <Icon name="act-save" size={18} />
          </IconButton>
        </div>
      </div>
    </article>
  );
}

/** The card grid: 4 per row from 1400px, 3 from 900px, 2 from 560px, 1 on phones. */
export function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}
