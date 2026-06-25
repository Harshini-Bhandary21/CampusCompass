import { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSpreadsheet,
  CheckCircle2,
  Circle,
  ShieldCheck,
  Cpu,
  Dna,
  Wrench,
  CalendarCheck,
  UploadCloud,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Trophy,
  AlertTriangle,
  Timer,
  GitCompare,
  Database,
  ChevronRight,
  Clock,
  Footprints,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCampusData } from "@/hooks/useCampusData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export const Route = createFileRoute("/generate")({
  head: () => ({
    meta: [
      { title: "Generate Timetable — CampusCompass ATS" },
      { name: "description", content: "AI-powered timetable generation workflow: upload data, configure constraints, run the CP-SAT and genetic optimizer, and review optimized results." },
    ],
  }),
  component: GeneratePage,
});

const steps = ["Upload Data", "Configure Constraints", "AI Processing", "Results"];

const files = [
  { name: "Faculty.xlsx", type: "faculty", rows: 148, desc: "Faculty profiles & availability" },
  { name: "Student.xlsx", type: "students", rows: 4820, desc: "Student groups & enrollments" },
  { name: "Subject.xlsx", type: "subjects", rows: 212, desc: "Courses, credits & types" },
  { name: "Room.xlsx", type: "rooms", rows: 86, desc: "Rooms, capacity & buildings" },
  { name: "TimeSlot.xlsx", type: "timeslots", rows: 42, desc: "Periods & working hours" },
];

const pipeline = [
  { label: "Excel Upload", icon: UploadCloud },
  { label: "Validation", icon: ShieldCheck },
  { label: "CP-SAT Solver", icon: Cpu },
  { label: "Genetic Algorithm", icon: Dna },
  { label: "Conflict Resolution", icon: Wrench },
  { label: "Timetable Generation", icon: CalendarCheck },
];

function GeneratePage() {
  const { constraints, updateConstraints, activeTimetableId, importParsedData, importMasterTimetable, runSolver, isSolving, colorSchema } = useCampusData();
  const isTeal = colorSchema === "teal";
  const [step, setStep] = useState(0);
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [masterFile, setMasterFile] = useState<File | null>(null);
  const [hard, setHard] = useState<string[]>(constraints.hard);
  const [soft, setSoft] = useState<{ label: string; weight: number }[]>(constraints.soft);
  const [pipeStage, setPipeStage] = useState(0);

  // Hidden file input refs
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const toggleHard = (item: string) => {
    setHard((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleWeightChange = (index: number, val: number) => {
    setSoft((prev) =>
      prev.map((c, i) => (i === index ? { ...c, weight: val } : c))
    );
  };

  // Trigger file selection for a specific card
  const handleCardClick = (type: string, name: string) => {
    const input = fileRefs.current[type];
    if (input) {
      input.click();
    }
  };

  const handleMasterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMasterFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const ab = evt.target?.result;
        if (!ab) return;
        
        const wb = XLSX.read(ab, { type: "array" });
        if (wb.SheetNames.includes("Overview")) {
          const sheet = wb.Sheets["Overview"];
          const data = XLSX.utils.sheet_to_json(sheet);
          importMasterTimetable(data);
          toast.success("Pre-generated master timetable imported successfully.");
        } else {
          toast.success("Configuration workbook loaded. Ready to run solver.");
        }
        
        setUploaded(files.map((f) => f.name));
      } catch (err) {
        console.error(err);
        toast.error(`Error parsing Excel sheet: ${(err as Error).message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Parse file when selected
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: string, fileName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const ab = evt.target?.result;
        if (!ab) return;
        
        const wb = XLSX.read(ab, { type: "array" });
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        if (type !== "timeslots") {
          importParsedData(type as any, data);
        } else {
          toast.success("Time slots configuration loaded successfully.");
        }
        
        setUploaded((prev) => {
          if (prev.includes(fileName)) return prev;
          return [...prev, fileName];
        });
      } catch (err) {
        console.error(err);
        toast.error(`Error parsing Excel sheet: ${(err as Error).message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Trigger solver once when entering step 2 (AI Processing)
  useEffect(() => {
    if (step === 2) {
      runSolver(masterFile);
    }
  }, [step]);

  // Run pipeline animation
  useEffect(() => {
    if (step !== 2) return;
    setPipeStage(0);

    const iv = setInterval(() => {
      setPipeStage((s) => {
        // Pause at stage 4 (Conflict Resolution) if solver is still working
        if (s === 4 && isSolving) {
          return s;
        }
        if (s >= pipeline.length) {
          clearInterval(iv);
          return s;
        }
        return s + 1;
      });
    }, 900);
    return () => clearInterval(iv);
  }, [step, isSolving]);

  // Transition to Results step once animation is complete and solving has finished
  useEffect(() => {
    if (step === 2 && pipeStage >= pipeline.length && !isSolving) {
      updateConstraints(hard, soft);
      const t = setTimeout(() => setStep(3), 700);
      return () => clearTimeout(t);
    }
  }, [step, pipeStage, isSolving]);

  return (
    <DashboardLayout title="Generate Timetable" subtitle="AI-driven scheduling in four guided steps">
      {/* Stepper */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-card">
        <div className="flex items-center">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold transition border",
                    i < step && (isTeal ? "bg-[#e8f4f4] border-[#3c6e71] text-[#3c6e71]" : "bg-[#EEEDFE] border-[#534AB7] text-[#534AB7]"),
                    i === step && (isTeal ? "bg-[#3c6e71] border-[#3c6e71] text-white" : "bg-[#534AB7] border-[#534AB7] text-white"),
                    i > step && "bg-[#ffffff] border-[#e5e7eb] text-[#9ca3af]",
                  )}
                >
                  {i < step ? <CheckCircle2 className={cn("h-5 w-5", isTeal ? "text-[#3c6e71]" : "text-[#534AB7]")} /> : i + 1}
                </div>
                <span className={cn("hidden text-sm font-medium sm:block", i === step ? "text-[#1f2937] dark:text-foreground font-semibold" : "text-[#9ca3af] dark:text-muted-foreground")}>
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="mx-3 h-0.5 flex-1 rounded-full bg-[#e5e7eb]">
                  <div className={cn("h-full rounded-full transition-all duration-500", isTeal ? "bg-[#3c6e71]" : "bg-[#534AB7]", i < step ? "w-full" : "w-0")} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {step === 0 && (
              <SectionCard title="Step 1 · Upload Excel Files" subtitle="Select your spreadsheet templates to populate schedule data" icon={<Database className="h-4 w-4 text-primary" />}>
                {/* Unified Master Importer Dropzone */}
                <div className={cn(
                  "border-[1.5px] border-dashed rounded-2xl p-6 mb-6 flex flex-col items-center justify-center text-center gap-3 transition",
                  isTeal
                    ? "border-[#3c6e71] bg-[#f0f8f8] hover:bg-[#e8f4f4]"
                    : "border-[#534AB7] bg-[#EEEDFE]/30 hover:bg-[#EEEDFE]/50"
                )}>
                  <div className={cn(
                    "grid h-12 w-12 place-items-center rounded-xl border",
                    isTeal
                      ? "bg-[#e8f4f4] border-[#3c6e71]/20 text-[#3c6e71]"
                      : "bg-[#EEEDFE] border-[#534AB7]/20 text-[#534AB7]"
                  )}>
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-[#1f2937]">Upload Configuration Workbook (FY.xlsx)</h4>
                    <p className="text-xs text-[#6b7280] max-w-md mt-1">
                      Instantly load Faculty, Rooms, and Time configurations to initialize the AI scheduling run.
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    id="master-tt-upload"
                    className="hidden"
                    onChange={handleMasterFileChange}
                  />
                  <Button
                    variant={null as any}
                    size="sm"
                    className={cn(
                      "text-white shadow-none text-xs rounded-lg px-4 py-2 font-medium",
                      isTeal
                        ? "bg-[#3c6e71] hover:bg-[#2e5557]"
                        : "bg-[#534AB7] hover:bg-[#3C3489]"
                    )}
                    onClick={() => document.getElementById("master-tt-upload")?.click()}
                  >
                    <UploadCloud className="h-3.5 w-3.5 mr-2" />
                    Select FY.xlsx File
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {files.map((f) => {
                    const done = uploaded.includes(f.name);
                    return (
                      <div key={f.name}>
                        {/* Hidden File Input */}
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          ref={(el) => {
                            fileRefs.current[f.type] = el;
                          }}
                          onChange={(e) => handleFileChange(e, f.type, f.name)}
                          className="hidden"
                        />
                        <button
                          onClick={() => handleCardClick(f.type, f.name)}
                          className={cn(
                            "group flex w-full flex-col items-start gap-3 rounded-xl border border-[#e5e7eb] bg-white p-5 text-left transition shadow-none",
                            isTeal ? "hover:border-[#3c6e71]" : "hover:border-[#534AB7]",
                            done && (isTeal ? "border-[#3c6e71]" : "border-[#534AB7]")
                          )}
                        >
                          <div className="flex w-full items-center justify-between">
                            <div className={cn(
                              "grid h-11 w-11 place-items-center rounded-xl border",
                              isTeal
                                ? "bg-[#e8f4f4] border-[#3c6e71]/20 text-[#3c6e71]"
                                : "bg-[#EEEDFE] border-[#534AB7]/20 text-[#534AB7]"
                            )}>
                              <FileSpreadsheet className="h-5 w-5" />
                            </div>
                            {done ? (
                              <CheckCircle2 className={cn("h-5 w-5", isTeal ? "text-[#3c6e71]" : "text-[#534AB7]")} />
                            ) : (
                              <UploadCloud className={cn("h-5 w-5 text-muted-foreground", isTeal ? "group-hover:text-[#3c6e71]" : "group-hover:text-[#534AB7]")} />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-[#1f2937]">{f.name}</p>
                            <p className="text-xs text-[#6b7280]">{f.desc}</p>
                          </div>
                          <span className={cn(
                            "rounded-lg px-2.5 py-1 text-[11px] font-medium border transition-colors",
                            done 
                              ? (isTeal ? "bg-[#e8f4f4] border-[#3c6e71]/20 text-[#3c6e71]" : "bg-[#EEEDFE] border-[#534AB7]/20 text-[#534AB7]")
                              : (isTeal 
                                ? "bg-white border-[#e5e7eb] text-[#1f2937] group-hover:border-[#3c6e71] group-hover:bg-[#f9fafb]"
                                : "bg-white border-[#e5e7eb] text-[#1f2937] group-hover:border-[#534AB7] group-hover:bg-[#f9fafb]")
                          )}>
                            {done ? "Excel sheet validated" : "Click to upload"}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                  <button
                    onClick={() => {
                      setUploaded(files.map((f) => f.name));
                      toast.success("Sample data files loaded successfully.");
                    }}
                    className={cn(
                      "grid place-items-center rounded-xl border border-dashed border-[#e5e7eb] bg-white p-5 text-center text-sm font-medium text-[#1f2937] transition hover:bg-[#f9fafb]",
                      isTeal ? "hover:border-[#3c6e71]" : "hover:border-[#534AB7]"
                    )}
                  >
                    <UploadCloud className={cn("mb-2 h-6 w-6", isTeal ? "text-[#3c6e71]" : "text-[#534AB7]")} />
                    Load default sample files
                  </button>
                </div>
              </SectionCard>
            )}

            {step === 1 && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <SectionCard title="Hard Constraints" subtitle="Must never be violated" icon={<ShieldCheck className="h-4 w-4 text-destructive" />}>
                  <div className="space-y-2">
                    {["Faculty Conflict", "Room Conflict", "Student Conflict", "Room Capacity", "Faculty Availability"].map((c) => (
                      <ConstraintRow key={c} label={c} checked={hard.includes(c)} onToggle={() => toggleHard(c)} tone="hard" />
                    ))}
                  </div>
                </SectionCard>
                <SectionCard title="Soft Constraints" subtitle="Optimized as much as possible" icon={<Sparkles className="h-4 w-4 text-primary" />}>
                  <div className="space-y-4">
                    {soft.map((c, i) => (
                      <div key={c.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-[#1f2937]">{c.label}</span>
                          <span className={cn("font-bold", isTeal ? "text-[#3c6e71]" : "text-[#534AB7]")}>{c.weight}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={c.weight}
                          onChange={(e) => handleWeightChange(i, Number(e.target.value))}
                          className={cn(
                            "h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary",
                            isTeal ? "accent-[#3c6e71]" : "accent-[#534AB7]"
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}

            {step === 2 && (
              <SectionCard title="Step 3 · AI Processing" subtitle="Running the optimization pipeline" icon={<Cpu className="h-4 w-4 text-primary" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pipeline.map((p, i) => {
                    const status = pipeStage > i ? "done" : pipeStage === i ? "active" : "idle";
                    return (
                      <div
                        key={p.label}
                        className={cn(
                          "relative flex items-center gap-4 rounded-2xl border p-4.5 transition bg-white shadow-sm overflow-hidden",
                          status === "done" && (isTeal ? "border-[#3c6e71]/20 bg-[#e8f4f4]/40" : "border-[#534AB7]/20 bg-[#EEEDFE]/40"),
                          status === "active" && (isTeal ? "border-[#3c6e71]/50 bg-[#e8f4f4] ring-2 ring-[#3c6e71]/10 animate-pulse-ring" : "border-[#534AB7]/50 bg-[#EEEDFE] ring-2 ring-[#534AB7]/10 animate-pulse-ring"),
                          status === "idle" && "border-[#e5e7eb] bg-gray-50/30 opacity-60",
                        )}
                      >
                        {/* Step Number Badge */}
                        <div className="absolute top-2.5 right-3.5 text-[9px] font-bold tracking-wider text-muted-foreground/30 select-none">
                          STEP {i + 1}
                        </div>

                        {/* Status Icon */}
                        <div className={cn(
                          "grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition-colors",
                          status === "done" 
                            ? (isTeal ? "bg-[#e8f4f4] border-[#3c6e71]/20 text-[#3c6e71]" : "bg-[#EEEDFE] border-[#534AB7]/20 text-[#534AB7]") 
                            : status === "active" 
                            ? (isTeal ? "bg-[#3c6e71] border-transparent text-white" : "bg-[#534AB7] border-transparent text-white") 
                            : "bg-gray-50 border-gray-200 text-muted-foreground"
                        )}>
                          {status === "done" ? <CheckCircle2 className="h-5 w-5" /> : <p.icon className="h-5 w-5" />}
                        </div>

                        <div className="min-w-0 flex-1 pr-6 mt-1">
                          <p className="truncate text-sm font-semibold text-[#1f2937]">{p.label}</p>
                          <p className="truncate text-[11px] font-medium text-[#6b7280]">
                            {status === "done" ? (
                              <span className={isTeal ? "text-[#3c6e71]" : "text-[#534AB7]"}>Completed</span>
                            ) : status === "active" ? (
                              <span className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
                                Processing…
                              </span>
                            ) : (
                              "Queued"
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5">
                  <div className="mb-1 flex justify-between text-xs text-[#6b7280]">
                    <span>Overall progress</span>
                    <span>{Math.round((Math.min(pipeStage, pipeline.length) / pipeline.length) * 100)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className={cn(
                      "h-full rounded-full transition-all duration-700",
                      isTeal ? "bg-[#3c6e71]" : "bg-[#534AB7]"
                    )} style={{ width: `${(Math.min(pipeStage, pipeline.length) / pipeline.length) * 100}%` }} />
                  </div>
                </div>
              </SectionCard>
            )}

            {step === 3 && <ResultsStep activeGroup={activeTimetableId} resetFlow={() => setStep(0)} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer nav */}
      {step !== 2 && step !== 3 && (
        <div className="mt-5 flex items-center justify-between gap-3">
          <Button
            variant={null as any}
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className={cn(
              "border border-[#e5e7eb] text-[#1f2937] hover:bg-[#f9fafb] bg-white shadow-none px-4 py-2 h-9 rounded-lg flex items-center gap-2",
              isTeal ? "hover:border-[#3c6e71]" : "hover:border-[#534AB7]"
            )}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button
            size="lg"
            variant="default"
            className={cn(
              "rounded-lg text-white shadow-none font-semibold cursor-pointer",
              isTeal ? "bg-[#3c6e71] hover:bg-[#2e5557]" : "bg-[#534AB7] hover:bg-[#3C3489]"
            )}
            disabled={step === 0 && uploaded.length === 0}
            onClick={() => setStep((s) => s + 1)}
          >
            {step === 1 ? (
              <>
                <Sparkles className="h-5 w-5" /> Generate Timetable
              </>
            ) : (
              <>
                Continue <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}

function ConstraintRow({ label, checked, onToggle, tone }: { label: string; checked: boolean; onToggle: () => void; tone: "hard" | "soft" }) {
  const { colorSchema } = useCampusData();
  const isTeal = colorSchema === "teal";
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex w-full items-center justify-between rounded-xl border p-3 text-left transition",
        checked
          ? tone === "hard"
            ? "border-[#A32D2D]/30 bg-[#FCEBEB]"
            : (isTeal ? "border-[#3c6e71]/30 bg-[#e8f4f4]" : "border-[#534AB7]/30 bg-[#EEEDFE]")
          : "border-[#e5e7eb] hover:bg-gray-50/50 bg-white",
      )}
    >
      <span className="flex items-center gap-3">
        {checked ? <CheckCircle2 className={cn("h-5 w-5", tone === "hard" ? "text-[#A32D2D]" : (isTeal ? "text-[#3c6e71]" : "text-[#534AB7]"))} /> : <Circle className="h-5 w-5 text-muted-foreground" />}
        <span className="text-sm font-medium text-[#1f2937]">{label}</span>
      </span>
      <span className={cn("h-5 w-9 rounded-full p-0.5 transition", checked ? (isTeal ? "bg-[#3c6e71]" : "bg-[#534AB7]") : "bg-gray-200")}>
        <span className={cn("block h-4 w-4 rounded-full bg-card transition-transform", checked && "translate-x-4")} />
      </span>
    </button>
  );
}

function ResultsStep({ activeGroup, resetFlow }: { activeGroup: string; resetFlow: () => void }) {
  const { applyAlternative, colorSchema } = useCampusData();
  const isTeal = colorSchema === "teal";
  const [compareOpen, setCompareOpen] = useState(false);
  const [selectedAlt, setSelectedAlt] = useState<string | null>(null);

  const alternatives = [
    { name: "Timetable A", score: 95, conflicts: 0, idle: "1.2h", travel: "91%", note: "Best overall · recommended", best: true },
    { name: "Timetable B", score: 92, conflicts: 1, idle: "0.8h", travel: "88%", note: "Lowest faculty idle time" },
    { name: "Timetable C", score: 89, conflicts: 2, idle: "1.6h", travel: "94%", note: "Minimal campus travel" },
  ];

  const handleApply = (name: string) => {
    applyAlternative(name, activeGroup);
    setCompareOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ResultStat icon={Trophy} label="Optimization Score" value="95%" accent={isTeal ? "text-[#3c6e71] bg-[#e8f4f4]" : "text-[#534AB7] bg-[#EEEDFE]"} />
        <ResultStat icon={AlertTriangle} label="Conflicts" value="0" accent="text-[#0F6E56] bg-[#E1F5EE]" />
        <ResultStat icon={Timer} label="Generation Time" value="42s" accent="text-[#5f5e5a] bg-gray-100" />
      </div>

      <SectionCard
        title="3 Alternative Timetables"
        subtitle="Ranked by optimization quality"
        icon={<CalendarCheck className="h-4 w-4 text-primary" />}
        action={
          <Button variant={null as any} size="sm" className={cn("border border-[#e5e7eb] text-[#1f2937] hover:bg-[#f9fafb] bg-white shadow-none rounded-lg", isTeal ? "hover:border-[#3c6e71]" : "hover:border-[#534AB7]")} onClick={() => setCompareOpen(true)}>
            <GitCompare className="h-4 w-4" /> Compare Alternatives
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {alternatives.map((a) => (
            <div
              key={a.name}
              className={cn(
                "relative rounded-2xl border p-5 transition hover:shadow-elevated bg-white",
                a.best 
                  ? (isTeal ? "border-[#3c6e71]/40 bg-[#e8f4f4]/20" : "border-[#534AB7]/40 bg-[#EEEDFE]/20") 
                  : "border-[#e5e7eb]",
              )}
            >
              {a.best && (
                <span className={cn("absolute -top-2.5 left-5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white", isTeal ? "bg-[#3c6e71]" : "bg-[#534AB7]")}>
                  Recommended
                </span>
              )}
              <p className="font-display text-lg font-bold text-[#1f2937]">{a.name}</p>
              <p className="text-xs text-[#6b7280]">{a.note}</p>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className={cn("font-display text-3xl font-bold", isTeal ? "text-[#3c6e71]" : "text-[#534AB7]")}>{a.score}%</p>
                  <p className="text-[11px] text-[#6b7280]">optimization</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-bold text-[#1f2937]">{a.conflicts}</p>
                  <p className="text-[11px] text-[#6b7280]">conflicts</p>
                </div>
              </div>
              <Button
                variant={a.best ? "default" : null as any}
                size="sm"
                className={cn(
                  "mt-4 w-full font-semibold rounded-lg",
                  a.best
                    ? (isTeal ? "bg-[#3c6e71] hover:bg-[#2e5557] text-white shadow-none" : "bg-[#534AB7] hover:bg-[#3C3489] text-white shadow-none")
                    : (isTeal
                      ? "border border-[#e5e7eb] text-[#1f2937] hover:bg-[#f9fafb] hover:border-[#3c6e71] bg-white shadow-none"
                      : "border border-[#e5e7eb] text-[#1f2937] hover:bg-[#f9fafb] hover:border-[#534AB7] bg-white shadow-none")
                )}
                onClick={() => handleApply(a.name)}
              >
                Apply to {activeGroup}
              </Button>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="flex justify-between items-center mt-5">
        <Button
          variant={null as any}
          onClick={resetFlow}
          className={cn("border border-[#e5e7eb] text-[#1f2937] hover:bg-[#f9fafb] bg-white shadow-none px-4 py-2 h-9 rounded-lg flex items-center gap-2", isTeal ? "hover:border-[#3c6e71]" : "hover:border-[#534AB7]")}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Upload
        </Button>
        <Button
          size="lg"
          variant="default"
          onClick={resetFlow}
          className={cn(
            "rounded-lg text-white shadow-none font-semibold flex items-center gap-2 cursor-pointer",
            isTeal ? "bg-[#3c6e71] hover:bg-[#2e5557]" : "bg-[#534AB7] hover:bg-[#3C3489]"
          )}
        >
          <Sparkles className="h-5 w-5" /> Generate Again
        </Button>
      </div>

      {/* Comparison Modal */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="sm:max-w-[720px] bg-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1f2937]">
              <GitCompare className={cn("h-5 w-5", isTeal ? "text-[#3c6e71]" : "text-[#534AB7]")} />
              Compare Timetable Alternatives
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {/* KPI Table */}
            <div className="rounded-xl border border-[#e5e7eb] overflow-hidden bg-white">
              <table className="w-full text-left border-collapse text-sm text-[#1f2937]">
                <thead>
                  <tr className="bg-gray-50 border-b border-[#e5e7eb]">
                    <th className="p-3 font-semibold text-[#6b7280]">Metric</th>
                    {alternatives.map((alt) => (
                      <th key={alt.name} className="p-3 font-bold text-center">
                        {alt.name} {alt.best && "⭐"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#e5e7eb]/60">
                    <td className="p-3 font-medium flex items-center gap-1.5 text-[#1f2937]">
                      <Trophy className={cn("h-4 w-4", isTeal ? "text-[#3c6e71]" : "text-[#534AB7]")} /> Optimization Score
                    </td>
                    {alternatives.map((alt) => (
                      <td key={alt.name} className={cn("p-3 text-center font-bold text-base", isTeal ? "text-[#3c6e71]" : "text-[#534AB7]")}>
                        {alt.score}%
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-[#e5e7eb]/60">
                    <td className="p-3 font-medium flex items-center gap-1.5 text-[#1f2937]">
                      <AlertTriangle className="h-4 w-4 text-destructive" /> Active Conflicts
                    </td>
                    {alternatives.map((alt) => (
                      <td
                        key={alt.name}
                        className={cn(
                          "p-3 text-center font-semibold",
                          alt.conflicts > 0 ? "text-destructive" : "text-success"
                        )}
                      >
                        {alt.conflicts}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-[#e5e7eb]/60">
                    <td className="p-3 font-medium flex items-center gap-1.5 text-[#1f2937]">
                      <Clock className="h-4 w-4 text-warning" /> Avg Faculty Idle Time
                    </td>
                    {alternatives.map((alt) => (
                      <td key={alt.name} className="p-3 text-center">
                        {alt.idle}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-medium flex items-center gap-1.5 text-[#1f2937]">
                      <Footprints className="h-4 w-4 text-info" /> Campus Move Score
                    </td>
                    {alternatives.map((alt) => (
                      <td key={alt.name} className="p-3 text-center text-[#6b7280]">
                        {alt.travel}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Explanations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {alternatives.map((alt) => (
                <div key={alt.name} className="rounded-xl border border-[#e5e7eb] p-3 space-y-1 bg-gray-50/50">
                  <p className="font-semibold text-xs text-[#1f2937] uppercase tracking-wider">{alt.name}</p>
                  <p className="text-xs text-[#6b7280] leading-tight">
                    {alt.name === "Timetable A" && "Our primary optimizer run. 100% compliance with hard constraints. Best balanced schedules."}
                    {alt.name === "Timetable B" && "Optimizes specifically to keep teachers back-to-back. Slight room scheduling overlaps (1 conflict)."}
                    {alt.name === "Timetable C" && "Focuses on grouping classes within single blocks to reduce inter-building walking times."}
                  </p>
                  <Button
                    size="sm"
                    variant={alt.best ? "default" : null as any}
                    className={cn(
                      "w-full mt-3 h-8 font-semibold rounded-lg",
                      alt.best
                        ? (isTeal ? "bg-[#3c6e71] hover:bg-[#2e5557] text-white shadow-none" : "bg-[#534AB7] hover:bg-[#3C3489] text-white shadow-none")
                        : (isTeal
                          ? "border border-[#e5e7eb] text-[#1f2937] hover:bg-[#f9fafb] hover:border-[#3c6e71] bg-white shadow-none"
                          : "border border-[#e5e7eb] text-[#1f2937] hover:bg-[#f9fafb] hover:border-[#534AB7] bg-white shadow-none")
                    )}
                    onClick={() => handleApply(alt.name)}
                  >
                    Select & Apply
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResultStat({ icon: Icon, label, value, accent }: { icon: typeof Trophy; label: string; value: string; accent: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[#e5e7eb] dark:border-border/70 bg-white dark:bg-card p-5">
      <div className={cn("grid h-12 w-12 place-items-center rounded-xl", accent)}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="font-display text-2xl font-bold text-[#1f2937] dark:text-card-foreground">{value}</p>
        <p className="text-sm text-[#6b7280] dark:text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
