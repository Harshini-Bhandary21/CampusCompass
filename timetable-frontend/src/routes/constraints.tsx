import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SlidersHorizontal, ShieldCheck, Sparkles, Save, AlertTriangle, Info } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCampusData } from "@/hooks/useCampusData";
import { toast } from "sonner";

export const Route = createFileRoute("/constraints")({
  head: () => ({
    meta: [
      { title: "Constraints — CampusCompass ATS" },
      { name: "description", content: "Configure hard and soft scheduling constraints and their optimization weights." },
    ],
  }),
  component: ConstraintsPage,
});

const hardConstraintsList = [
  { id: "Faculty Conflict", label: "Faculty Conflict", desc: "No faculty double-booked in one slot" },
  { id: "Room Conflict", label: "Room Conflict", desc: "No room assigned to two classes at once" },
  { id: "Student Conflict", label: "Student Conflict", desc: "No group has overlapping lectures" },
  { id: "Room Capacity", label: "Room Capacity", desc: "Class size must fit room capacity" },
  { id: "Faculty Availability", label: "Faculty Availability", desc: "Respect declared unavailable hours" },
];

function ConstraintsPage() {
  const { constraints, updateConstraints } = useCampusData();

  // Local state for edits
  const [localHard, setLocalHard] = useState<string[]>([]);
  const [localSoft, setLocalSoft] = useState<{ label: string; weight: number }[]>([]);

  // Initialize local state from context
  useEffect(() => {
    if (constraints) {
      setLocalHard(constraints.hard);
      setLocalSoft(constraints.soft);
    }
  }, [constraints]);

  const toggleHard = (id: string) => {
    setLocalHard((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleWeightChange = (index: number, val: number) => {
    setLocalSoft((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, weight: val } : item))
    );
  };

  const handleSave = () => {
    updateConstraints(localHard, localSoft);
    
    // Check if any critical hard constraints are turned off
    const disabledCritical = hardConstraintsList.filter(c => !localHard.includes(c.id));
    if (disabledCritical.length > 0) {
      toast.warning(`Saved, but warning: disabling ${disabledCritical.map(c => c.label).join(", ")} may lead to scheduling overlaps!`);
    } else {
      toast.success("Constraint profile updated successfully.");
    }
  };

  return (
    <DashboardLayout title="Constraints" subtitle="Define how the AI optimizer balances trade-offs">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Hard Constraints" subtitle="Strictly enforced — never violated" icon={<ShieldCheck className="h-4 w-4 text-destructive" />}>
          <div className="space-y-2">
            {hardConstraintsList.map((c) => {
              const checked = localHard.includes(c.id);
              return (
                <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{c.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.desc}</p>
                  </div>
                  <button
                    onClick={() => toggleHard(c.id)}
                    className={cn("h-6 w-11 shrink-0 rounded-full p-0.5 transition", checked ? "bg-gradient-primary" : "bg-secondary")}
                  >
                    <span className={cn("block h-5 w-5 rounded-full bg-card shadow-soft transition-transform", checked && "translate-x-5")} />
                  </button>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Soft Constraints" subtitle="Weighted optimization objectives" icon={<Sparkles className="h-4 w-4 text-primary" />}>
          <div className="space-y-5">
            {localSoft.map((c, i) => (
              <div key={c.label}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">{c.label}</span>
                  <span className="font-display text-sm font-bold text-primary">{c.weight}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={c.weight}
                  onChange={(e) => handleWeightChange(i, Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
                  style={{ accentColor: "var(--primary)" }}
                />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Warning Alert if critical constraint disabled */}
      {localHard.length < hardConstraintsList.length && (
        <div className="mt-4 rounded-2xl border border-warning/20 bg-warning/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-warning-foreground leading-none">Warning: Softening Constraints</p>
            <p className="text-xs text-muted-foreground mt-1">
              Disabling hard constraints forces the CP-SAT solver to permit double-bookings in favor of completing schedules. Keep them enabled for absolute conflict prevention.
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Button size="lg" className="shadow-glow" onClick={handleSave}><Save className="h-4 w-4" /> Save Constraint Profile</Button>
      </div>
    </DashboardLayout>
  );
}
