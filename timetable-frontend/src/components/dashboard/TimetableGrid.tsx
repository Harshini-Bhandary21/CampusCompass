import { useState, useEffect } from "react";
import { days, periods, type SlotType, type Slot } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useCampusData } from "@/hooks/useCampusData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, AlertTriangle, Sparkles, Search } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

// Convert 24h format in mock data to AM/PM labels exactly as per specification
const timeLabels: Record<string, string> = {
  "08:30": "8 AM",
  "09:25": "9 AM",
  "10:30": "10 AM",
  "11:25": "11 AM",
  "13:15": "1 PM",
  "14:10": "2 PM",
  "15:10": "3 PM",
  "16:00": "4 PM",
  "16:55": "5 PM",
  "17:45": "6 PM",
};

// Pastel card styling based on class type exactly as per specification
const getSlotStyleByType = (type: SlotType) => {
  switch (type) {
    case "theory":
      return {
        bg: "bg-[#E8E4F8]",
        border: "border border-[#3C3489]/25",
        text: "text-[#3C3489]"
      };
    case "lab":
      return {
        bg: "bg-[#D6F0E8]",
        border: "border border-[#0F6E56]/25",
        text: "text-[#0F6E56]"
      };
    case "elective":
      return {
        bg: "bg-[#FAE0D4]",
        border: "border border-[#7B3A20]/25",
        text: "text-[#7B3A20]"
      };
    default:
      return {
        bg: "bg-[#E8E4F8]",
        border: "border border-[#3C3489]/25",
        text: "text-[#3C3489]"
      };
  }
};

export function TimetableGrid({ compact = false, editMode = false }: { compact?: boolean; editMode?: boolean }) {
  const {
    activeTimetableId,
    timetables,
    updateTimetableSlot,
    faculty,
    rooms,
    subjects,
    checkConflicts
  } = useCampusData();

  const currentSchedule = timetables[activeTimetableId] || {};

  // UI state
  const [searchQuery, setSearchQuery] = useState("");

  // Editor states
  const [selectedCell, setSelectedCell] = useState<{ day: string; index: number } | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  // Form states
  const [selectedSubjCode, setSelectedSubjCode] = useState("");
  const [selectedFacultyId, setSelectedFacultyId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedType, setSelectedType] = useState<Exclude<SlotType, "break" | "free">>("theory");

  // Load editor defaults when cell is selected
  useEffect(() => {
    if (selectedCell) {
      const slot = currentSchedule[selectedCell.day]?.[selectedCell.index];
      if (slot) {
        const sub = subjects.find((s) => s.name === slot.subject);
        setSelectedSubjCode(sub?.code || "");
        const fac = faculty.find((f) => f.name === slot.faculty);
        setSelectedFacultyId(fac?.id || "");
        setSelectedRoomId(slot.room);
        setSelectedType(slot.type as any);
      } else {
        setSelectedSubjCode(subjects[0]?.code || "");
        setSelectedFacultyId(faculty[0]?.id || "");
        setSelectedRoomId(rooms[0]?.id || "");
        setSelectedType("theory");
      }
    }
  }, [selectedCell, currentSchedule, subjects, faculty, rooms]);

  const handleCellClick = (day: string, index: number) => {
    if (index === 3) return; // Lunch break is uneditable
    if (!editMode) return;
    setSelectedCell({ day, index });
    setEditorOpen(true);
  };

  const getTransientSlot = (): Slot | null => {
    if (!selectedSubjCode) return null;
    const sub = subjects.find((s) => s.code === selectedSubjCode);
    const fac = faculty.find((f) => f.id === selectedFacultyId);
    if (!sub || !fac) return null;

    return {
      subject: sub.name,
      faculty: fac.name,
      room: selectedRoomId,
      type: selectedType,
    };
  };

  const transientSlot = getTransientSlot();
  const currentConflicts = selectedCell && transientSlot
    ? checkConflicts(activeTimetableId, selectedCell.day, selectedCell.index, transientSlot)
    : [];

  const handleSave = () => {
    if (!selectedCell || !transientSlot) return;
    updateTimetableSlot(activeTimetableId, selectedCell.day, selectedCell.index, transientSlot);
    setEditorOpen(false);
  };

  const handleClear = () => {
    if (!selectedCell) return;
    updateTimetableSlot(activeTimetableId, selectedCell.day, selectedCell.index, null);
    setEditorOpen(false);
  };

  // Compact Mode Render (Dashboard Home screen preview)
  if (compact) {
    return (
      <div className="overflow-x-auto">
        <div className="min-w-[800px] border border-[#e5e7eb] rounded-xl overflow-hidden bg-white">
          {/* Grid Headers */}
          <div className="grid grid-cols-[60px_repeat(6,minmax(0,1fr))] border-b border-[#e5e7eb] pb-2.5 pt-2.5 items-center">
            <div />
            {days.map((day) => (
              <div key={day} className="text-center text-[12px] font-medium text-[#6b7280] dark:text-muted-foreground">
                {day === "Mon" ? "Monday" :
                 day === "Tue" ? "Tuesday" :
                 day === "Wed" ? "Wednesday" :
                 day === "Thu" ? "Thursday" :
                 day === "Fri" ? "Friday" :
                 day === "Sat" ? "Saturday" : day}
              </div>
            ))}
          </div>

          {/* Grid Rows */}
          {periods.map((period, periodIdx) => {
            const periodRow = (
              <div
                key={period}
                className="grid grid-cols-[60px_repeat(6,minmax(0,1fr))] border-b-[0.5px] border-[#e5e7eb] last:border-b-0 min-h-[74px] items-stretch"
              >
                {/* Time Label */}
                <div className="text-[10px] text-[#9ca3af] font-normal text-right pr-2.5 pt-2 select-none whitespace-nowrap leading-tight">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">{period.split("–")[0]}</div>
                  <div className="text-[9px] opacity-75">{period.split("–")[1]}</div>
                </div>

                {/* Day Slots */}
                {days.map((day) => {
                  const slot = currentSchedule[day]?.[periodIdx];
                  const cellConflicts = slot ? checkConflicts(activeTimetableId, day, periodIdx, slot) : [];
                  const hasConflicts = cellConflicts.length > 0;
                  return (
                    <div
                      key={day}
                      className="p-1.5 bg-white flex flex-col justify-start items-stretch min-h-[66px] min-w-0 overflow-hidden"
                    >
                      {slot ? (
                        <div
                          title={`${subjects.find((s) => s.name === slot.subject)?.code || "SUBJ"} - ${slot.subject}\nFaculty: ${slot.faculty}\nRoom: ${slot.room}`}
                          className={cn(
                            "rounded-[10px] flex flex-col justify-between h-full select-none text-left shadow-none p-2",
                            getSlotStyleByType(slot.type).bg,
                            getSlotStyleByType(slot.type).text,
                            hasConflicts 
                              ? "border-2 border-dashed border-amber-500/80"
                              : getSlotStyleByType(slot.type).border
                          )}
                        >
                          <div className="min-w-0 flex items-center justify-between gap-1 w-full">
                            <p className="text-[11px] font-medium leading-tight truncate flex-1">
                              {subjects.find((s) => s.name === slot.subject)?.code || "SUBJ"}
                            </p>
                            {hasConflicts && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button 
                                    className="focus:outline-none p-0.5 rounded hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 fill-red-500/5" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent 
                                  className="z-50 w-64 rounded-xl border border-red-200 bg-red-50/95 p-3 text-xs text-red-950 shadow-md outline-none"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="space-y-1 font-sans text-left">
                                    <p className="font-semibold text-red-800 flex items-center gap-1.5 border-b border-red-200/60 pb-1 mb-1">
                                      <AlertTriangle className="h-4 w-4 text-red-600" />
                                      Scheduling Conflict
                                    </p>
                                    {cellConflicts.map((c, idx) => (
                                      <div key={idx} className="flex items-start gap-1">
                                        <span className="text-red-500 mt-0.5">•</span>
                                        <span className="leading-tight">{c.message}</span>
                                      </div>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                          <div className="mt-0.5 text-[9px] font-normal opacity-85 truncate">
                            {slot.room}
                          </div>
                        </div>
                      ) : (
                        <div className="h-full border border-dashed border-gray-100 rounded-[10px] flex items-center justify-center bg-gray-50/10 p-1 select-none min-h-[50px]">
                          <span className="text-[9px] text-gray-400 font-normal italic tracking-tight opacity-60">
                            —
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );

            // Lunch break rendering
            if (periodIdx === 3) {
              return (
                <div key={`group-${period}`} className="contents">
                  {periodRow}
                  <div className="grid grid-cols-[60px_repeat(6,minmax(0,1fr))] border-b-[0.5px] border-[#e5e7eb] items-center bg-gray-50/20">
                    <div className="text-[11px] text-[#9ca3af] font-normal text-right pr-2.5 select-none py-1">
                      12 PM
                    </div>
                    <div className="col-span-6 text-center text-[10px] font-medium tracking-widest uppercase text-[#9ca3af] select-none py-1">
                      Lunch Break
                    </div>
                  </div>
                </div>
              );
            }

            return periodRow;
          })}
        </div>
      </div>
    );
  }

  // Full Screen Specification Render
  return (
    <div className="bg-white rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6">
      {/* Top Bar controls inside the card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 border-b border-[#E8E8E8] pb-4">
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Search bar */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#999999]" />
            <input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[34px] w-48 rounded-lg border border-[#E5E5E5] bg-white pl-9 pr-3 text-xs text-[#1a1a1a] outline-none placeholder-[#999999] transition focus:border-[#534AB7] focus:ring-0"
            />
          </div>
        </div>
      </div>

      {/* Legend showing 3 class types */}
      <div className="flex flex-wrap items-center gap-6 text-xs py-3.5 border-b border-[#E8E8E8]/60">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-[3px] bg-[#E8E4F8] border border-[#3C3489]/25" />
          <span className="text-[#555555] font-medium">Theory</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-[3px] bg-[#D6F0E8] border border-[#0F6E56]/25" />
          <span className="text-[#555555] font-medium">Lab</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-[3px] bg-[#FAE0D4] border border-[#7B3A20]/25" />
          <span className="text-[#555555] font-medium">Elective Lectures</span>
        </div>
      </div>

      {/* Grid: Columns = Days, Rows = Hours */}
      <div className="overflow-x-auto mt-4">
        <div className="min-w-[900px] border border-[#e5e7eb] rounded-xl overflow-hidden bg-white">
          
          {/* Day Headers (Mon-Sat) */}
          <div className="grid grid-cols-[60px_repeat(6,minmax(0,1fr))] border-b border-[#e5e7eb] pb-3 pt-3 items-center">
            <div />
            {days.map((day) => (
              <div key={day} className="text-center text-[13px] font-medium text-[#6b7280]">
                {day === "Mon" ? "Monday" :
                 day === "Tue" ? "Tuesday" :
                 day === "Wed" ? "Wednesday" :
                 day === "Thu" ? "Thursday" :
                 day === "Fri" ? "Friday" :
                 day === "Sat" ? "Saturday" : day}
              </div>
            ))}
          </div>

          {/* Time Rows */}
          {periods.map((period, periodIdx) => {
            const periodRow = (
              <div
                key={period}
                className="grid grid-cols-[60px_repeat(6,minmax(0,1fr))] border-b-[0.5px] border-[#e5e7eb] last:border-b-0 min-h-[90px] items-stretch"
              >
                {/* Time Label (08:30-09:25...) */}
                <div className="text-[11px] text-[#9ca3af] font-normal text-right pr-3 pt-3.5 select-none whitespace-nowrap leading-tight">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">{period.split("–")[0]}</div>
                  <div className="text-[10px] opacity-75">{period.split("–")[1]}</div>
                </div>

                {/* Day Columns */}
                {days.map((day) => {
                  const slot = currentSchedule[day]?.[periodIdx];
                  const matchesSearch =
                    !searchQuery ||
                    (slot &&
                      (slot.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        slot.faculty.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        slot.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (subjects.find((s) => s.name === slot.subject)?.code || "").toLowerCase().includes(searchQuery.toLowerCase())));

                  const cellConflicts = slot ? checkConflicts(activeTimetableId, day, periodIdx, slot) : [];
                  const hasConflicts = cellConflicts.length > 0;

                  return (
                    <div
                      key={day}
                      onClick={() => handleCellClick(day, periodIdx)}
                      className={cn(
                        "p-2 bg-white flex flex-col justify-start items-stretch min-h-[82px] min-w-0 overflow-hidden transition-colors",
                        editMode ? "cursor-pointer hover:bg-gray-50/50" : ""
                      )}
                    >
                      {slot && matchesSearch ? (
                        <div
                          title={`${subjects.find((s) => s.name === slot.subject)?.code || "SUBJ"} - ${slot.subject}\nFaculty: ${slot.faculty}\nRoom: ${slot.room}`}
                          className={cn(
                            "rounded-[10px] py-[8px] flex flex-col justify-between h-full select-none text-left transition-transform duration-200 shadow-none pl-[9px] pr-[9px]",
                            getSlotStyleByType(slot.type).bg,
                            getSlotStyleByType(slot.type).text,
                            editMode && "hover:scale-[1.01]",
                            hasConflicts 
                              ? "border-2 border-dashed border-amber-500/80"
                              : getSlotStyleByType(slot.type).border
                          )}
                        >
                          <div className="min-w-0 flex items-center justify-between gap-2 w-full">
                            <p className="text-[12px] font-medium leading-snug tracking-tight truncate flex-1">
                              {(() => {
                                const code = subjects.find((s) => s.name === slot.subject)?.code || "SUBJ";
                                const subjectName = slot.subject;
                                return code.toLowerCase() === subjectName.toLowerCase()
                                  ? subjectName
                                  : `${code} - ${subjectName}`;
                              })()}
                            </p>
                            {hasConflicts && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button 
                                    className="focus:outline-none p-0.5 rounded hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 fill-red-500/5" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent 
                                  className="z-50 w-72 rounded-xl border border-red-200 bg-red-50/95 p-3 text-xs text-red-950 shadow-md outline-none"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="space-y-1 font-sans text-left">
                                    <p className="font-semibold text-red-800 flex items-center gap-1.5 border-b border-red-200/60 pb-1 mb-1">
                                      <AlertTriangle className="h-4 w-4 text-red-600" />
                                      Scheduling Conflict
                                    </p>
                                    {cellConflicts.map((c, idx) => (
                                      <div key={idx} className="flex items-start gap-1">
                                        <span className="text-red-500 mt-0.5">•</span>
                                        <span className="leading-tight">{c.message}</span>
                                      </div>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                          <div className="mt-1.5 text-[11px] font-normal opacity-80 leading-none truncate w-full">
                            ({slot.faculty}) - {slot.room}
                          </div>
                        </div>
                      ) : !slot ? (
                        <div className="h-full border border-dashed border-gray-100 rounded-[10px] flex flex-col items-center justify-center bg-gray-50/10 p-2 text-center select-none min-h-[66px]">
                          <span className="text-[10px] text-gray-400 font-normal italic tracking-tight opacity-60">
                            No class scheduled
                          </span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );

            // Lunch Break Row (between index 3 and 4)
            if (periodIdx === 3) {
              return (
                <div key={`group-${period}`} className="contents">
                  {periodRow}
                  <div className="grid grid-cols-[60px_repeat(6,minmax(0,1fr))] border-b-[0.5px] border-[#e5e7eb] items-center bg-gray-50/20">
                    <div className="text-[12px] text-[#9ca3af] font-normal text-right pr-3 select-none py-2">
                      12 PM
                    </div>
                    <div className="col-span-6 text-center text-[10px] font-medium tracking-widest uppercase text-[#9ca3af] select-none py-2">
                      Lunch Break
                    </div>
                  </div>
                </div>
              );
            }

            return periodRow;
          })}
        </div>
      </div>

      {/* Editor Modal */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="sm:max-w-[425px] glass">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-glow" />
              Schedule Lecture · {selectedCell?.day} {selectedCell && periods[selectedCell.index]}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="subj">Subject</Label>
              <Select value={selectedSubjCode} onValueChange={setSelectedSubjCode}>
                <SelectTrigger id="subj">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((sub) => (
                    <SelectItem key={sub.code} value={sub.code}>
                      {sub.code} — {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fac">Faculty Instructor</Label>
              <Select value={selectedFacultyId} onValueChange={setSelectedFacultyId}>
                <SelectTrigger id="fac">
                  <SelectValue placeholder="Select instructor" />
                </SelectTrigger>
                <SelectContent>
                  {faculty.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name} ({f.dept})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="rm">Classroom / Lab</Label>
                <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                  <SelectTrigger id="rm">
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.id} ({r.type} - cap: {r.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="typ">Lecture Type</Label>
                <Select value={selectedType} onValueChange={(v: any) => setSelectedType(v)}>
                  <SelectTrigger id="typ">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theory">Theory</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                    <SelectItem value="elective">Elective</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Live conflict warnings */}
            {currentConflicts.length > 0 && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive space-y-1.5 animate-pulse-ring">
                <p className="flex items-center gap-1.5 font-semibold leading-none">
                  <AlertTriangle className="h-4 w-4" />
                  Conflict Warning ({currentConflicts.length})
                </p>
                <ul className="list-inside list-disc pl-1 space-y-1">
                  {currentConflicts.map((c, idx) => (
                    <li key={idx} className="leading-tight">{c.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter className="flex sm:justify-between items-center gap-2">
            <Button
              type="button"
              variant={null as any}
              className="text-destructive border border-destructive/20 hover:bg-destructive/10 px-4 py-2 h-9 rounded-xl flex items-center gap-1.5 bg-white shadow-none"
              onClick={handleClear}
            >
              <Trash2 className="h-4 w-4" />
              Clear Slot
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant={null as any} onClick={() => setEditorOpen(false)} className="border border-gray-200 text-[#5F5E5A] hover:bg-gray-50 bg-white shadow-none px-4 py-2 h-9 rounded-xl">
                Cancel
              </Button>
              <Button type="button" variant="default" className="bg-[#534AB7] hover:bg-[#3C3489] text-white shadow-none rounded-xl px-4 py-2 h-9 font-semibold" onClick={handleSave}>
                Save Slot
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
