import Link from "next/link";
import { Countdown } from "@/components/build/Countdown";
import { Icon } from "@/components/icons/Icon";
import { buildNumber } from "@/lib/build";
import { daysBetween, relativeDay } from "@/lib/dates";
import styles from "./NowStrip.module.css";

export type NowTile =
  | { kind: "build"; build: number; title: string; href: string; date: string }
  | { kind: "milestone"; title: string; href: string; target: string }
  | { kind: "trail"; title: string; href: string; date: string }
  | { kind: "vote"; openQuestions: number; href?: string }
  | { kind: "video"; title: string; href: string; date: string };

/** Tiles with a dated item hide once it's older than this. */
const FRESH_DAYS = 14;

function isFresh(tile: NowTile, today: string): boolean {
  switch (tile.kind) {
    case "milestone":
      return true;
    case "vote":
      return tile.openQuestions > 0;
    default:
      return daysBetween(tile.date, today) <= FRESH_DAYS;
  }
}

function Tile({ tile, today }: { tile: NowTile; today: string }) {
  let icon: React.ReactNode;
  let label: React.ReactNode;
  let title: string;
  let sub: React.ReactNode = null;
  let href: string;

  switch (tile.kind) {
    case "build":
      icon = <span className={styles.dot} aria-hidden="true" />;
      label = (
        <span className={styles.green}>
          Build {buildNumber(tile.build)}
          <span className={styles.long}> · Latest log</span>
        </span>
      );
      title = tile.title;
      sub = relativeDay(tile.date, today);
      href = tile.href;
      break;
    case "milestone":
      icon = <Icon name="build-time" size={18} />;
      label = "Next milestone";
      title = tile.title;
      sub = <Countdown target={tile.target} variant="inline" />;
      href = tile.href;
      break;
    case "trail":
      icon = <Icon name="step-source" size={16} />;
      label = "New trail";
      title = tile.title;
      sub = relativeDay(tile.date, today);
      href = tile.href;
      break;
    case "vote":
      icon = <Icon name="step-open" size={16} className={styles.accentIcon} />;
      label = "Your vote";
      title = "Pick what I explore next";
      sub = `${tile.openQuestions} open ${tile.openQuestions === 1 ? "question" : "questions"}`;
      href = tile.href ?? "#edge";
      break;
    case "video":
      icon = <Icon name="src-video" size={16} />;
      label = "Video";
      title = tile.title;
      sub = relativeDay(tile.date, today);
      href = tile.href;
      break;
  }

  return (
    <li className={styles.item}>
      <Link href={href} className={styles.tile}>
        <span className={styles.top}>
          {icon}
          <span className={styles.label}>{label}</span>
        </span>
        <span>
          <span className={styles.title}>{title}</span>
          {sub && <span className={styles.sub}>{sub}</span>}
        </span>
      </Link>
    </li>
  );
}

/** The "right now" tiles under the hero. Up to 5; dated tiles older than
 *  14 days hide themselves (the countdown doesn't); fewer than 3 left and
 *  the whole strip hides. `today` is the request date (YYYY-MM-DD), passed
 *  in so the server and client agree. */
export function NowStrip({ tiles, today }: { tiles: NowTile[]; today: string }) {
  const shown = tiles.filter((t) => isFresh(t, today)).slice(0, 5);
  if (shown.length < 3) return null;
  return (
    <ul className={styles.strip} aria-label="Right now">
      {shown.map((tile, i) => (
        <Tile key={`${tile.kind}-${i}`} tile={tile} today={today} />
      ))}
    </ul>
  );
}
