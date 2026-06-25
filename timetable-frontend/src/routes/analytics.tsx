import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Gauge, Footprints, Clock, Users, DoorOpen, TrendingUp, HelpCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ScoreRing } from "@/components/dashboard/ScoreRing";
import {
  FacultyWorkloadChart,
  RoomUtilizationChart,
  OptimizationTrendChart,
} from "@/components/dashboard/Charts";
import { aiScores, days, periods } from "@/lib/mock-data";
import { useCampusData } from "@/hooks/useCampusData";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — CampusCompass ATS" },
      { name: "description", content: "AI-powered scheduling analytics: optimization trends, workload, utilization heatmaps, and convenience scores." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { rooms, timetables, checkConflicts, faculty } = useCampusData();
  const [selectedRoomState, setSelectedRoom] = useState("");
  const activeRoomId = selectedRoomState || rooms[0]?.id || "";

  // Determine what is scheduled in selectedRoom at a specific slot
  const getRoomSlotInfo = (day: string, periodIndex: number) => {
    let scheduledGroup = "";
    let scheduledSlot: any = null;

    Object.keys(timetables).forEach((gId) => {
      // Don't inspect alt schedules
      if (gId === "Timetable A" || gId === "Timetable B" || gId === "Timetable C") return;
      const slot = timetables[gId]?.[day]?.[periodIndex];
      if (slot && slot.room === activeRoomId) {
        scheduledGroup = gId;
        scheduledSlot = slot;
      }
    });

    return {
      occupied: !!scheduledSlot,
      group: scheduledGroup,
      slot: scheduledSlot,
      utilization: scheduledSlot ? 100 : 0,
    };
  };

  return (
    <DashboardLayout title="Analytics" subtitle="Deep insights into schedule quality & efficiency">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Optimization" value={`${aiScores.optimization}%`} icon={Gauge} accent="primary" index={0} />
        <MetricCard label="Room Use" value={`${aiScores.roomUtilization}%`} icon={DoorOpen} accent="info" index={1} />
        <MetricCard label="Student Idle" value={`${aiScores.studentIdleHours}h`} icon={Clock} accent="warning" index={2} />
        <MetricCard label="Campus Move" value={`${aiScores.campusMovement}%`} icon={Footprints} accent="success" index={3} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard title="Constraint Satisfaction" subtitle="Overall compliance" icon={<Gauge className="h-4 w-4 text-primary" />}>
          <div className="grid place-items-center py-4">
            <ScoreRing value={aiScores.constraintSatisfaction} sublabel="Satisfied" />
          </div>
        </SectionCard>
        <SectionCard title="Optimization Trend" subtitle="Genetic algorithm convergence" icon={<TrendingUp className="h-4 w-4 text-primary" />} className="xl:col-span-2">
          <OptimizationTrendChart />
        </SectionCard>
      </div>

      <div className="mt-4">
        <SectionCard
          title="Room Occupancy Heatmap"
          subtitle="Real-time occupancy intensity by day & period"
          icon={<BarChart3 className="h-4 w-4 text-info" />}
          action={
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Select Room:</span>
              <Select value={activeRoomId} onValueChange={setSelectedRoom}>
                <SelectTrigger className="h-8 w-32 rounded-lg text-xs bg-card border border-border">
                  <SelectValue placeholder="Room" />
                </SelectTrigger>
                <SelectContent className="glass">
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.id} ({r.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <div className="min-w-[620px] space-y-2">
              {/* Header Periods */}
              <div className="grid gap-2" style={{ gridTemplateColumns: `64px repeat(${periods.length}, 1fr)` }}>
                <div />
                {periods.map((p, idx) => (
                  <div key={idx} className="text-center text-[10px] font-semibold text-muted-foreground py-1 truncate">
                    {p}
                  </div>
                ))}
              </div>

              {/* Day Rows */}
              <TooltipProvider>
                {days.map((day) => (
                  <div key={day} className="grid gap-2" style={{ gridTemplateColumns: `64px repeat(${periods.length}, 1fr)` }}>
                    <div className="grid place-items-center text-xs font-bold text-muted-foreground bg-secondary/35 rounded-lg py-3">
                      {day}
                    </div>
                    {periods.map((_, pIdx) => {
                      const cell = getRoomSlotInfo(day, pIdx);

                      return (
                        <Tooltip key={pIdx}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "grid h-12 place-items-center rounded-lg text-xs font-bold transition select-none cursor-pointer border",
                                cell.occupied
                                  ? "bg-primary/20 border-primary/40 text-primary hover:bg-primary/30"
                                  : "bg-secondary/30 border-border/40 text-muted-foreground hover:bg-secondary/50"
                              )}
                            >
                              {cell.occupied ? cell.group : "Empty"}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="glass p-3 space-y-1 text-xs">
                            <p className="font-bold text-foreground">{cell.occupied ? "Occupied Slot" : "Free Slot"}</p>
                            <p className="text-muted-foreground">
                              Time: <span className="font-medium text-foreground">{day} {periods[pIdx]}</span>
                            </p>
                            {cell.occupied && cell.slot && (
                              <>
                                <p className="text-muted-foreground">
                                  Course: <span className="font-medium text-foreground">{cell.slot.subject} ({cell.slot.type})</span>
                                </p>
                                <p className="text-muted-foreground">
                                  Faculty: <span className="font-medium text-foreground">{cell.slot.faculty}</span>
                                </p>
                                <p className="text-muted-foreground">
                                  Cohort: <span className="font-medium text-foreground">{cell.group}</span>
                                </p>
                              </>
                            )}
                            <p className="text-muted-foreground">
                              Utilization: <span className="font-medium text-foreground">{cell.utilization}%</span>
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </TooltipProvider>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard title="Faculty Workload" subtitle={`Balance across staff (showing top 8 of ${faculty.length} faculty)`} icon={<Users className="h-4 w-4 text-primary" />}>
          <FacultyWorkloadChart />
        </SectionCard>
        <SectionCard title="Weekly Room Utilization" subtitle="Occupancy rate" icon={<DoorOpen className="h-4 w-4 text-info" />}>
          <RoomUtilizationChart />
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
