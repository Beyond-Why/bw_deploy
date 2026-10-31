import { renderOgImage, ogImageContentType, ogImageSize } from "@/lib/og";

export const alt = "Beyond Why — Deep Dives, Insight Cards and Builder Logs: exploring ideas beyond the surface.";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return renderOgImage({
    kind: "Deep Dives · Insight Cards · Builder Logs",
    title: "Exploring ideas beyond the surface.",
  });
}
