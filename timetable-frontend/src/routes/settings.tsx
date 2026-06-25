import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon, Building2, Bell, Cpu, Save } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Button } from "@/components/ui/button";
import { useCampusData } from "@/hooks/useCampusData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — CampusCompass ATS" },
      { name: "description", content: "Institution profile, solver preferences, and notification settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, updateSettings } = useCampusData();

  // Local state for edits
  const [universityName, setUniversityName] = useState(settings.universityName);
  const [academicYear, setAcademicYear] = useState(settings.academicYear);
  const [workingDays, setWorkingDays] = useState(settings.workingDays);
  const [solverTimeout, setSolverTimeout] = useState(settings.solverTimeout);
  const [gaPopulationSize, setGaPopulationSize] = useState(settings.gaPopulationSize);
  const [gaGenerations, setGaGenerations] = useState(settings.gaGenerations);

  const [notifyConflict, setNotifyConflict] = useState(settings.notifyConflict);
  const [notifyPreference, setNotifyPreference] = useState(settings.notifyPreference);
  const [notifyRoom, setNotifyRoom] = useState(settings.notifyRoom);
  const [notifyCompleted, setNotifyCompleted] = useState(settings.notifyCompleted);

  // Sync state if settings update externally
  useEffect(() => {
    setUniversityName(settings.universityName);
    setAcademicYear(settings.academicYear);
    setWorkingDays(settings.workingDays);
    setSolverTimeout(settings.solverTimeout);
    setGaPopulationSize(settings.gaPopulationSize);
    setGaGenerations(settings.gaGenerations);
    setNotifyConflict(settings.notifyConflict);
    setNotifyPreference(settings.notifyPreference);
    setNotifyRoom(settings.notifyRoom);
    setNotifyCompleted(settings.notifyCompleted);
  }, [settings]);

  const handleSave = () => {
    updateSettings({
      universityName,
      academicYear,
      workingDays,
      solverTimeout,
      gaPopulationSize,
      gaGenerations,
      notifyConflict,
      notifyPreference,
      notifyRoom,
      notifyCompleted,
    });
    toast.success("Settings saved successfully!");
  };

  return (
    <DashboardLayout title="Settings" subtitle="Manage your institution & generation preferences">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Institution Profile" subtitle="Basic details" icon={<Building2 className="h-4 w-4 text-primary" />}>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">University Name</span>
              <input
                value={universityName}
                onChange={(e) => setUniversityName(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Academic Year</span>
              <input
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Working Days</span>
              <input
                value={workingDays}
                onChange={(e) => setWorkingDays(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </label>
          </div>
        </SectionCard>

        <SectionCard title="Solver Preferences" subtitle="AI optimization engine" icon={<Cpu className="h-4 w-4 text-primary" />}>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Solver Timeout (seconds)</span>
              <input
                type="number"
                value={solverTimeout}
                onChange={(e) => setSolverTimeout(Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">GA Population Size</span>
              <input
                type="number"
                value={gaPopulationSize}
                onChange={(e) => setGaPopulationSize(Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">GA Generations</span>
              <input
                type="number"
                value={gaGenerations}
                onChange={(e) => setGaGenerations(Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </label>
          </div>
        </SectionCard>

        <SectionCard title="Notifications" subtitle="Alert preferences" icon={<Bell className="h-4 w-4 text-primary" />} className="lg:col-span-2">
          <div className="space-y-3">
            {[
              { label: "Conflict alerts", val: notifyConflict, set: setNotifyConflict },
              { label: "Faculty preference violations", val: notifyPreference, set: setNotifyPreference },
              { label: "Room capacity issues", val: notifyRoom, set: setNotifyRoom },
              { label: "Generation completed", val: notifyCompleted, set: setNotifyCompleted },
            ].map((n, i) => (
              <div key={n.label} className="flex items-center justify-between rounded-xl border border-border/60 p-3">
                <span className="text-sm font-medium">{n.label}</span>
                <button
                  onClick={() => n.set(!n.val)}
                  className={cn("h-6 w-11 shrink-0 rounded-full p-0.5 transition", n.val ? "bg-gradient-primary" : "bg-secondary")}
                >
                  <span className={cn("block h-5 w-5 rounded-full bg-card shadow-soft transition-transform", n.val && "translate-x-5")} />
                </button>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 flex justify-end">
        <Button size="lg" className="shadow-glow" onClick={handleSave}><Save className="h-4 w-4" /> Save Changes</Button>
      </div>
    </DashboardLayout>
  );
}
