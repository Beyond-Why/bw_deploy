import { redirect } from "next/navigation";
import { getCollection } from "@/lib/content";

interface PageProps {
  params: Promise<{ collection: string }>;
}

export default async function InsightCollectionPage({ params }: PageProps) {
  const { collection } = await params;
  const { cards } = await getCollection(collection);
  redirect(`/insight-cards/${collection}/${cards[0].slug}`);
}
