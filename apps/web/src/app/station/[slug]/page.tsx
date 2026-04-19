import { notFound, redirect } from "next/navigation";
import { MOCK_STATIONS } from "@/lib/mock-data";
import { StationCarousel } from "@/components/station/StationCarousel";

interface StationPageProps {
  params: Promise<{ slug: string }>;
}

export default async function StationPage({ params }: StationPageProps) {
  const { slug } = await params;

  const initialIndex = MOCK_STATIONS.findIndex((s) => s.slug === slug);

  if (initialIndex === -1) {
    const first = MOCK_STATIONS[0];
    if (first) {
      redirect(`/station/${first.slug}`);
    }
    notFound();
  }

  return (
    <div className="min-h-screen bg-brand-dark flex justify-center">
      <div className="w-full max-w-[430px]">
        <StationCarousel stations={MOCK_STATIONS} initialIndex={initialIndex} />
      </div>
    </div>
  );
}
