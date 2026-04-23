import { notFound } from "next/navigation";
import type { StationWithDJ } from "@ownradio/shared";
import { apiFetch } from "@/lib/api";
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
  const stations = await fetchStations();

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
