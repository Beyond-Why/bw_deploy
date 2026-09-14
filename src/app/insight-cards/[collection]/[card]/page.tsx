import { getInsightCard } from "@/lib/content";

interface PageProps {
  params: Promise<{ collection: string; card: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { collection, card } = await params;
  const { frontmatter } = await getInsightCard(collection, card);
  return {
    title: `${frontmatter.title} — Insight Card — Beyond Why`,
    description: frontmatter.description,
  };
}

// Deliberately inert — see layout.tsx one level up for why the actual
// panel lives there instead of here.
export default function InsightCardPage() {
  return null;
}
