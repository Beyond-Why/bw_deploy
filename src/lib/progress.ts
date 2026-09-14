export function getLastOpenedEpisode(seriesSlug: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`bw_last_opened:${seriesSlug}`);
}

export function setLastOpenedEpisode(seriesSlug: string, episodeSlug: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`bw_last_opened:${seriesSlug}`, episodeSlug);
}
