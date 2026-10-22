"use client";

import { useCurrentLog } from "./logState";

/** The rail's day numeral — gets the accent stroke while its log is the
 *  one being read. On a series page that follows the scroll; elsewhere
 *  (the share page, no series state) the `current` prop decides. */
export default function RailNumeral({
  day,
  current,
  className,
  currentClassName,
}: {
  day: number;
  current: boolean;
  className: string;
  currentClassName: string;
}) {
  const { currentDay } = useCurrentLog();
  const isCurrent = currentDay === null ? current : currentDay === day;
  return <span className={`${className} ${isCurrent ? currentClassName : ""}`}>{day}</span>;
}
