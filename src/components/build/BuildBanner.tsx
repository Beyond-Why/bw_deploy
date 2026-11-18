import Link from "next/link";
import { TrailCounts } from "@/components/explore/TrailCounts";
import { StatusPill } from "@/components/library/StatusPill";
import { ButtonLink } from "@/components/ui/Button";
import { buildNumber, nextMilestone, type BuildData } from "@/lib/build";
import { formatDayMonth } from "@/lib/dates";
import { Countdown } from "./Countdown";
import { ExpectedHappened } from "./ExpectedHappened";
import { Timeline, milestonesToEntries } from "./Timeline";
import styles from "./BuildBanner.module.css";

/** One build as a full-width band (not a card) that fades in and out of
 *  the page background. Desktop: text left, timeline and latest log right.
 *  Phone: one column, the timeline runs down (newest first), no description. */
export function BuildBanner({ build }: { build: BuildData }) {
  const num = buildNumber(build.number);
  const next = nextMilestone(build.milestones);
  const entries = milestonesToEntries(build.milestones);
  const log = build.latestLog;
  const headingId = `build-${build.slug}-title`;

  return (
    <section className={styles.band} aria-labelledby={headingId}>
      <div className={styles.inner}>
        <div className={styles.text}>
          <span className={styles.number} aria-hidden="true">
            {num}
          </span>
          <div className={styles.kickerRow}>
            <span className={styles.kicker}>Build · {build.topic}</span>
            <StatusPill status={build.status} kind="build" />
          </div>
          <h2 id={headingId} className={styles.title}>
            <span className="visually-hidden">Build {num}: </span>
            {build.title}
          </h2>
          <p className={styles.description}>{build.description}</p>
          {next && (
            <div className={styles.count}>
              <Countdown target={next.date} />
              <div className={styles.countText}>
                <span className={styles.label}>To the next milestone</span>
                <span className={styles.countName}>{next.title}</span>
                <span className={styles.countDate}>Target {formatDayMonth(next.date)}</span>
              </div>
            </div>
          )}
          <div className={styles.actions}>
            <ButtonLink href={`/builds/${build.slug}`} variant="solid">
              Follow the build
            </ButtonLink>
            <ButtonLink href={`/builds/${build.slug}#kit`} variant="line">
              Kit · get notified
            </ButtonLink>
          </div>
        </div>

        <div className={styles.side}>
          <div className={styles.across}>
            <Timeline entries={entries} direction="across" />
          </div>
          <div className={styles.downward}>
            <Timeline entries={entries} direction="down" compact />
          </div>

          <div className={styles.group}>
            <span className={styles.label}>
              Log {buildNumber(log.n)} · {formatDayMonth(log.date)} · Latest
            </span>
            <ExpectedHappened expected={log.expected} happened={log.happened} note={log.note} />
          </div>

          {build.explorations.length > 0 && (
            <div className={styles.group}>
              <span className={styles.label}>Explorations behind this build</span>
              <ul className={styles.chips}>
                {build.explorations.map((e) => (
                  <li key={e.slug}>
                    <Link href={`/explore/${e.slug}`} className={styles.chip}>
                      <span className={styles.chipTitle}>{e.title}</span>
                      {e.summary && e.summary.experiments > 0 && (
                        <TrailCounts summary={e.summary} only={["experiments"]} size="sm" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
