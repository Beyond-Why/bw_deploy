import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BuildBanner } from "@/components/build/BuildBanner";
import { ExpectedHappened } from "@/components/build/ExpectedHappened";
import { Timeline, logsToEntries, milestonesToEntries } from "@/components/build/Timeline";
import { ExperimentCard, ExperimentRow } from "@/components/explore/ExperimentCard";
import { CardGrid, ExplorationCard } from "@/components/explore/ExplorationCard";
import { QuickQuestions } from "@/components/explore/QuickQuestions";
import { SourceCard, SourceRow } from "@/components/explore/SourceCard";
import {
  TopicFilterProvider,
  TopicPicker,
  TopicPills,
  TopicScope,
} from "@/components/explore/TopicFilter";
import { topicFromParam } from "@/components/explore/topics";
import { TrailCounts } from "@/components/explore/TrailCounts";
import { EdgeOfMap } from "@/components/home/EdgeOfMap";
import { NowStrip } from "@/components/home/NowStrip";
import { Icon } from "@/components/icons/Icon";
import { ICONS, type IconName } from "@/components/icons/iconPaths";
import { StatusPill } from "@/components/library/StatusPill";
import { PhoneTabBar } from "@/components/ui/PhoneTabBar";
import { Poll } from "@/components/ui/Poll";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  BUILD,
  BUILD_LOGS,
  EXPERIMENTS,
  GUESS,
  NEW_THIS_WEEK,
  NOW_TILES,
  NOW_TILES_STALE,
  OPEN_THREADS,
  POPULAR,
  PREDICTION,
  QUICK,
  SAMPLE_TRAIL,
  SOURCES,
  START_ANYWHERE,
  TODAY,
  TOPICS,
} from "./sample";
import { ThemeSwitch } from "./ThemeSwitch";
import styles from "./page.module.css";

// Dev only. next.config.ts rewrites /dev/* to a 404 in production builds;
// this guard and noindex are a second line.
export const metadata: Metadata = {
  title: "UI kit",
  robots: { index: false, follow: false },
};

const SECTIONS = [
  ["tokens", "Tokens"],
  ["icons", "Icon"],
  ["trail-counts", "TrailCounts"],
  ["cards", "ExplorationCard"],
  ["heading", "SectionHeading"],
  ["now", "NowStrip"],
  ["topics", "TopicPills and the topic picker"],
  ["banner", "BuildBanner"],
  ["timeline", "Timeline"],
  ["expected", "ExpectedHappened"],
  ["quick", "QuickQuestions"],
  ["experiments", "ExperimentCard"],
  ["sources", "SourceCard"],
  ["poll", "Poll"],
  ["edge", "EdgeOfMap"],
  ["tabbar", "Phone tab bar"],
] as const;

function KitSection({ id, title, note, children }: { id: string; title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className={styles.section} aria-labelledby={`kit-${id}`}>
      <header className={styles.sectionHead}>
        <h2 id={`kit-${id}`} className={styles.kitTitle}>
          {title}
        </h2>
        {note && <p className={styles.kitNote}>{note}</p>}
      </header>
      {children}
    </section>
  );
}

const TOKEN_SWATCHES = [
  "--bg-primary", "--bg-surface", "--bg-elevated", "--bg-band",
  "--tone-peri", "--tone-sand", "--tone-sage", "--tone-clay",
  "--text-primary", "--text-secondary", "--text-muted",
  "--border-subtle", "--border-medium",
  "--accent", "--accent-strong", "--accent-light", "--status-complete",
];

export default async function KitPage({ searchParams }: { searchParams: Promise<{ topic?: string; theme?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { topic, theme } = await searchParams;
  const all = [...POPULAR, ...START_ANYWHERE];

  return (
    <TopicFilterProvider topics={TOPICS} initial={topicFromParam(topic, TOPICS)}>
      <div className={styles.page}>
        <div className={styles.wrap}>
          <header className={styles.top}>
            <div>
              <p className={styles.kitNote}>Dev only · sample data · docs/design/v2/README.md</p>
              <h1 className={styles.h1}>UI kit</h1>
            </div>
            <ThemeSwitch initial={theme === "light" ? "light" : "dark"} />
          </header>
          <nav className={styles.toc} aria-label="Kit sections">
            {SECTIONS.map(([id, label]) => (
              <a key={id} href={`#kit-${id}`}>
                {label}
              </a>
            ))}
          </nav>

          <KitSection id="tokens" title="Tokens" note="New: --bg-band and --tone-*. Everything else maps to existing tokens.">
            <ul className={styles.swatches}>
              {TOKEN_SWATCHES.map((t) => (
                <li key={t}>
                  <span className={styles.swatch} style={{ background: `var(${t})` }} />
                  <code>{t}</code>
                </li>
              ))}
            </ul>
          </KitSection>

          <KitSection id="icons" title="Icon" note="36 icons and the timeline star, one <Icon> component. 1.75 stroke; 1.4 at 40px and up.">
            <ul className={styles.icons}>
              {(Object.keys(ICONS) as IconName[]).map((name) => (
                <li key={name}>
                  <Icon name={name} size={28} />
                  <span>{ICONS[name].label}</span>
                  <code>{name}</code>
                </li>
              ))}
            </ul>
            <div className={styles.sizes}>
              {[16, 20, 24, 32, 48].map((s) => (
                <span key={s}>
                  <Icon name="step-experiment" size={s} />
                  <code>{s}</code>
                </span>
              ))}
            </div>
          </KitSection>

          <KitSection id="trail-counts" title="TrailCounts" note="Card: words for screen readers only. Header: words visible. Chip: experiments only.">
            <div className={styles.stack}>
              <TrailCounts summary={SAMPLE_TRAIL.summary} />
              <TrailCounts summary={{ sources: 4, deadEnds: 0, experiments: 0, openThreads: 0 }} />
              <TrailCounts summary={SAMPLE_TRAIL.summary} variant="header" />
              <TrailCounts summary={SAMPLE_TRAIL.summary} only={["experiments"]} size="sm" />
            </div>
          </KitSection>

          <KitSection id="cards" title="ExplorationCard" note="Hover a card (pointer devices) or tab into it: the hover card opens after 350ms. The fourth card has a full trail behind it.">
            <SectionHeading level="display" label="Most popular" subtitle="The trails people walk the most" action={{ href: "/explore", label: "See all" }} id="kit-popular" />
            <CardGrid>
              {POPULAR.map((c) => (
                <ExplorationCard key={c.slug} data={c} />
              ))}
            </CardGrid>
          </KitSection>

          <KitSection id="heading" title="SectionHeading" note="level='display' is new; the existing levels are unchanged.">
            <SectionHeading level="display" label="Start anywhere" subtitle="One question each. No order needed." action={{ href: "/explore", label: "See all" }} />
            <SectionHeading level="display" label="Quick questions" subtitle="Short trails, one line each" />
            <SectionHeading label="Existing 'section' level" meta="4" />
          </KitSection>

          <KitSection id="now" title="NowStrip" note={`Request date ${TODAY}. The countdown tile uses the reader's own date. Below it, a stale set: fewer than 3 tiles survive, so nothing renders.`}>
            <NowStrip tiles={NOW_TILES} today={TODAY} />
            <div className={styles.empty}>
              <NowStrip tiles={NOW_TILES_STALE} today={TODAY} />
              <span>(stale strip: hidden)</span>
            </div>
          </KitSection>

          <KitSection id="topics" title="TopicPills and the topic picker" note="Both share one state and set ?topic=. The pills stick under the nav while this section scrolls.">
            <div className={styles.fakeNav}>
              <span className={styles.fakeLogo}>Beyond Why</span>
              <TopicPicker />
            </div>
            <TopicPills />
            <div className={styles.afterPills}>
              <CardGrid>
                {all.map((c) => (
                  <TopicScope key={c.slug} topic={c.topic} hasExperiment={c.summary.experiments > 0}>
                    <ExplorationCard data={c} />
                  </TopicScope>
                ))}
              </CardGrid>
            </div>
          </KitSection>
        </div>

        <div className={styles.wrap}>
          <header className={styles.sectionHead} id="kit-banner-head">
            <h2 id="kit-banner" className={styles.kitTitle}>
              BuildBanner
            </h2>
            <p className={styles.kitNote}>Full width. Under 640px: one column, timeline down, no description.</p>
          </header>
        </div>
        <BuildBanner build={BUILD} />

        <div className={styles.wrap}>
          <KitSection id="timeline" title="Timeline" note="Across (banner, build header) and down (build logs, newest first). Star only with highlight:.">
            <div className={styles.surface}>
              <Timeline entries={milestonesToEntries(BUILD.milestones)} direction="across" />
            </div>
            <div className={styles.surface}>
              <Timeline entries={logsToEntries(BUILD_LOGS)} direction="down" label="Build logs" />
            </div>
          </KitSection>

          <KitSection id="expected" title="ExpectedHappened">
            <ExpectedHappened expected={BUILD.latestLog.expected} happened={BUILD.latestLog.happened} note={BUILD.latestLog.note} />
            <div className={styles.pills}>
              <StatusPill status="in-progress" kind="build" />
              <StatusPill status="complete" kind="build" />
              <StatusPill status="planned" kind="build" />
              <StatusPill status="paused" kind="build" />
            </div>
          </KitSection>

          <KitSection id="quick" title="QuickQuestions" note="With the 'New this week' card (ExplorationCard variant='feature').">
            <div className={styles.duo}>
              <div>
                <SectionHeading level="display" label="Quick questions" subtitle="Short trails, one line each" />
                <QuickQuestions items={QUICK} />
              </div>
              <div>
                <SectionHeading level="display" label="New this week" subtitle="Published 3 days ago" />
                <ExplorationCard data={NEW_THIS_WEEK} variant="feature" />
              </div>
            </div>
          </KitSection>

          <KitSection id="experiments" title="ExperimentCard" note="The last one has no video, so no duration chip.">
            <SectionHeading level="display" label="Tried it myself" subtitle="Experiments from inside the trails. Each one opens at its step." />
            <ExperimentRow>
              {EXPERIMENTS.map((e) => (
                <ExperimentCard key={`${e.slug}-${e.step}`} data={e} />
              ))}
            </ExperimentRow>
          </KitSection>

          <KitSection id="sources" title="SourceCard" note="Five in the data; the one used in a single trail doesn't render.">
            <SectionHeading level="display" label="Sources worth your time" subtitle="Each one turned up in more than one trail" action={{ href: "/resources", label: "All sources" }} />
            <SourceRow>
              {SOURCES.map((s) => (
                <SourceCard key={s.id} data={s} />
              ))}
            </SourceRow>
          </KitSection>

          <KitSection id="poll" title="Poll" note="Visual states only. Left: before voting. Right: after (sample numbers). Tap to switch.">
            <div className={styles.duoEven}>
              <Poll {...PREDICTION} />
              <Poll {...GUESS} initialChoice="light" />
            </div>
          </KitSection>
        </div>

        <div className={styles.wrap}>
          <header className={styles.sectionHead}>
            <h2 id="kit-edge" className={styles.kitTitle}>
              EdgeOfMap
            </h2>
          </header>
          <EdgeOfMap threads={OPEN_THREADS} />

          <KitSection id="tabbar" title="Phone tab bar" note="Shown here at every width. The real one is fixed to the bottom under 768px (narrow this window to see it).">
            <PhoneTabBar demo current="/" />
            <PhoneTabBar />
          </KitSection>
        </div>
      </div>
    </TopicFilterProvider>
  );
}
