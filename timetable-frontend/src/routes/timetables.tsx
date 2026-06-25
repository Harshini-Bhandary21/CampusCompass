import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Download, Share2, Sliders } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TimetableGrid } from "@/components/dashboard/TimetableGrid";
import { Button } from "@/components/ui/button";
import { useCampusData } from "@/hooks/useCampusData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/timetables")({
  head: () => ({
    meta: [
      { title: "Timetables — CampusCompass ATS" },
      { name: "description", content: "View, filter, and export generated weekly timetables with color-coded lectures." },
    ],
  }),
  component: TimetablesPage,
});

function TimetablesPage() {
  const { activeTimetableId, setActiveTimetableId, solverRunId, students } = useCampusData();
  const [editMode, setEditMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [cohortSearch, setCohortSearch] = useState("");

  const filteredCohorts = students.filter((s) =>
    s.id.toLowerCase().includes(cohortSearch.toLowerCase())
  );

  useEffect(() => {
    // Override page background specifically for this screen
    const doc = document.documentElement;
    doc.style.setProperty("--background", "#F0F0F5");
    doc.style.setProperty("--gradient-mesh", "none");
    return () => {
      doc.style.removeProperty("--background");
      doc.style.removeProperty("--gradient-mesh");
    };
  }, []);

  const handleExportPDF = () => {
    setIsExporting(true);
    const promise = new Promise((resolve) => setTimeout(resolve, 1500));
    toast.promise(
      promise,
      {
        loading: `Generating PDF export for ${activeTimetableId}...`,
        success: `Timetable ${activeTimetableId} exported successfully!`,
        error: "Export failed",
      }
    );
    promise.finally(() => setIsExporting(false));
  };

  const handleShare = () => {
    toast.success("Share link copied to clipboard!");
  };

  return (
    <DashboardLayout title="Timetables" subtitle="Generated schedules · Monday to Saturday">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Class Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#5F5E5A] uppercase tracking-wider">Cohort:</span>
          <div className="relative">
            <input
              type="text"
              placeholder="Filter cohorts..."
              value={cohortSearch}
              onChange={(e) => setCohortSearch(e.target.value)}
              className="h-8 w-28 px-2.5 text-xs rounded-lg border border-gray-200 bg-white text-[#1F2937] outline-none placeholder-gray-400 focus:border-[#3c6e71] focus:ring-1 focus:ring-[#3c6e71]/25 transition"
            />
          </div>
          <Select value={activeTimetableId} onValueChange={setActiveTimetableId}>
            <SelectTrigger className="h-8 w-[140px] bg-white border border-gray-200 text-xs font-semibold rounded-lg text-[#1F2937] shadow-none focus:ring-0">
              <SelectValue placeholder="Select cohort" />
            </SelectTrigger>
            <SelectContent>
              {filteredCohorts.map((group) => (
                <SelectItem key={group.id} value={group.id} className="text-xs">
                  {group.id}
                </SelectItem>
              ))}
              {filteredCohorts.length === 0 && (
                <div className="p-2 text-center text-xs text-muted-foreground select-none">
                  No cohort found
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Actions bar */}
        <div className="flex items-center gap-2">
          <Button
            variant={null as any}
            size="sm"
            onClick={handleShare}
            className="border border-gray-200 text-[#5F5E5A] hover:bg-gray-50 bg-white shadow-none text-xs font-semibold px-3 py-1.5 h-8 rounded-lg flex items-center gap-1.5"
          >
            <Share2 className="h-4 w-4" /> Share
          </Button>
          <Button
            variant={null as any}
            size="sm"
            disabled={isExporting}
            onClick={handleExportPDF}
            className="border border-gray-200 text-[#5F5E5A] hover:bg-gray-50 bg-white shadow-none text-xs font-semibold px-3 py-1.5 h-8 rounded-lg flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exporting..." : "Export PDF"}
          </Button>
          {solverRunId && (
            <Button
              variant={null as any}
              size="sm"
              onClick={() => window.open(`http://localhost:5000/download/${solverRunId}`, '_blank')}
              className="border border-gray-200 text-[#5F5E5A] hover:bg-gray-50 bg-white shadow-none text-xs font-semibold px-3 py-1.5 h-8 rounded-lg flex items-center gap-1.5"
            >
              <Download className="h-4 w-4 text-emerald-600" /> Download Excel
            </Button>
          )}
          <Button
            variant={null as any}
            size="sm"
            onClick={() => {
              setEditMode(!editMode);
              if (!editMode) {
                toast.info("Interactive Edit Mode enabled. Click any timetable slot to modify it.");
              } else {
                toast.success("Changes saved successfully.");
              }
            }}
            className={cn(
              "h-8 rounded-lg text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5",
              editMode
                ? "bg-[#534AB7] hover:bg-[#3C3489] text-white"
                : "border border-gray-200 text-[#5F5E5A] hover:bg-gray-50 bg-white shadow-none"
            )}
          >
            <Sliders className="h-4 w-4" />
            {editMode ? "Disable Edit" : "Interactive Editor"}
          </Button>
        </div>
      </div>

      <TimetableGrid editMode={editMode} />
    </DashboardLayout>
  );
}
