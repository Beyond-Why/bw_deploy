// Pure topic-filter helpers, usable on the server and the client.

/** "all", a topic name from exploration frontmatter, or the "Has an experiment" filter. */
export type TopicValue = "all" | "has-experiment" | (string & {});

export const HAS_EXPERIMENT = "has-experiment";

/** Topic → ?topic= value ("Robotics" → "robotics"); null for "all". */
export function toTopicParam(value: TopicValue): string | null {
  return value === "all" ? null : value.toLowerCase().replace(/\s+/g, "-");
}

/** Resolve a ?topic= value back to a topic name (or "all"). Use on the server
 *  to pass `initial`, so the first render matches the URL. */
export function topicFromParam(param: string | undefined | null, topics: string[]): TopicValue {
  if (!param) return "all";
  if (param === HAS_EXPERIMENT) return HAS_EXPERIMENT;
  return topics.find((t) => toTopicParam(t) === param) ?? "all";
}
