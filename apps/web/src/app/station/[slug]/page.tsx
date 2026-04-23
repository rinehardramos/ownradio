import { notFound } from "next/navigation";
import type { StationWithDJ } from "@ownradio/shared";
import { apiFetch } from "@/lib/api";
import { mergeWithMocks } from "@/lib/mock-stations";
import { StationCarousel } from "@/components/station/StationCarousel";

interface StationPageProps {
  params: Promise<{ slug: string }>;
}

async function fetchStations(): Promise<StationWithDJ[]> {
  try {
    return await apiFetch<StationWithDJ[]>("/stations");
  } catch {
    return [];
  }
}

export default async function StationPage({ params }: StationPageProps) {
  const { slug } = await params;

  // Merge API stations with mock fallbacks so station pages survive API outages
  const apiStations = await fetchStations();
  const stations = mergeWithMocks(apiStations);

  const initialIndex = stations.findIndex((s) => s.slug === slug);

  if (initialIndex === -1) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <StationCarousel stations={stations} initialIndex={initialIndex} />
    </div>
  );
}
