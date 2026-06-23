import SectionHeader from "@/components/SectionHeader";
import GalleryGrid from "@/components/GalleryGrid";
import galleryData from "@/data/gallery.json";
import { GalleryItem } from "@/lib/types";

export default function GalleryPage() {
  const items = galleryData as GalleryItem[];

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 flex flex-col gap-12">
      {/* Header */}
      <SectionHeader
        badge="Moments Gallery"
        title="Capturing Campus Life"
        subtitle="Step into the vibrant snapshots of student actions. Glimpses of art exhibitions, technical racing builds, live music jam sessions, and local hackathons."
        theme="blue"
      />

      {/* Interactive Photo Grid */}
      <GalleryGrid items={items} />
    </div>
  );
}
