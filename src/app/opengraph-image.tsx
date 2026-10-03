import { renderOgImage, ogImageContentType, ogImageSize } from "@/lib/og";

export const alt = "Beyond Why";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return renderOgImage({
    kind: "Deep Dives · Insight Cards · Builder Logs",
    title: "Exploring ideas beyond the surface.",
  });
}
