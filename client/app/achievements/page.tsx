import SectionHeader from "@/components/SectionHeader";
import TimelineItem from "@/components/TimelineItem";
import achievementsData from "@/data/achievements.json";
import { Achievement } from "@/lib/types";

export default function AchievementsPage() {
  const achievements = achievementsData as Achievement[];

  // Sort achievements by year descending (latest first)
  const sortedAchievements = [...achievements].sort((a, b) => {
    return b.year.localeCompare(a.year);
  });

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 flex flex-col gap-12">
      {/* Header */}
      <SectionHeader
        badge="Accolades"
        title="Engineering & Cultural Triumph"
        subtitle="A chronological timeline of awards, rankings, placements, and championships won by MITAOE student clubs at national and international levels."
        theme="multicolor"
      />

      {/* Timeline Grid */}
      <div className="relative w-full max-w-5xl mx-auto py-12">
        {sortedAchievements.map((achievement, idx) => (
          <TimelineItem
            key={achievement.id}
            item={achievement}
            index={idx}
          />
        ))}
      </div>
    </div>
  );
}
