import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search, Sparkles, Sun, Moon, CalendarCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useCampusData } from "@/hooks/useCampusData";

// Types
export interface TimetableEvent {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
  startTime: string; // "hh:mm" format (e.g. "08:00")
  endTime: string;   // "hh:mm" format (e.g. "08:50")
  courseCode?: string;
  courseName: string;
  professor?: string;
  room?: string;
  category: "theory" | "lab" | "elective";
}

// Helper to convert time string (e.g. "08:30") to minutes since 8:00 AM
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return (hours - 8) * 60 + minutes;
};

// Mock data matching the reference image and supporting multiple weeks
export const weeksEventData: Record<string, TimetableEvent[]> = {
  "Nov 1–6": [
    // Monday
    {
      day: "Monday",
      startTime: "08:30",
      endTime: "09:25",
      courseCode: "CSC401",
      courseName: "Data Structures",
      professor: "Prof. Smith",
      room: "R301",
      category: "theory",
    },
    {
      day: "Monday",
      startTime: "09:25",
      endTime: "10:20",
      courseName: "Theory Lab Lecture",
      category: "theory",
    },
    {
      day: "Monday",
      startTime: "10:30",
      endTime: "11:25",
      courseName: "Elective Lecture Lecture",
      category: "elective",
    },
    // Tuesday
    {
      day: "Tuesday",
      startTime: "08:30",
      endTime: "09:25",
      courseCode: "CSC401",
      courseName: "Data Structures",
      professor: "Prof. Smith",
      room: "R301",
      category: "theory",
    },
    {
      day: "Tuesday",
      startTime: "09:25",
      endTime: "10:20",
      courseCode: "BIO201",
      courseName: "Cell Biology Lab",
      professor: "Dr. Jones",
      room: "R405",
      category: "lab",
    },
    {
      day: "Tuesday",
      startTime: "10:30",
      endTime: "11:25",
      courseName: "Lab Lab Lecture",
      category: "lab",
    },
    {
      day: "Tuesday",
      startTime: "11:25",
      endTime: "12:20",
      courseName: "Theory Lab Lecture",
      category: "theory",
    },
    // Wednesday
    {
      day: "Wednesday",
      startTime: "08:30",
      endTime: "09:25",
      courseName: "Theory - Lab Biology",
      professor: "Prof. Smith",
      room: "R301",
      category: "elective",
    },
    {
      day: "Wednesday",
      startTime: "10:30",
      endTime: "11:25",
      courseName: "Thouny Lab Lecture",
      category: "theory",
    },
    // Thursday
    {
      day: "Thursday",
      startTime: "08:30",
      endTime: "09:25",
      courseName: "Lab Lab Lecture",
      professor: "Dr. Jones",
      room: "R405",
      category: "lab",
    },
    {
      day: "Thursday",
      startTime: "09:25",
      endTime: "10:20",
      courseName: "Theory Lab Lecture",
      category: "lab",
    },
    {
      day: "Thursday",
      startTime: "10:30",
      endTime: "11:25",
      courseCode: "HIS110",
      courseName: "World History",
      professor: "Dr. Evans",
      room: "R112",
      category: "elective",
    },
    {
      day: "Thursday",
      startTime: "11:25",
      endTime: "12:20",
      courseName: "Theory Lab Lecture",
      category: "lab",
    },
    // Friday
    {
      day: "Friday",
      startTime: "08:30",
      endTime: "09:25",
      courseName: "Theory - Lab Lecture",
      room: "R301",
      category: "theory",
    },
    {
      day: "Friday",
      startTime: "09:25",
      endTime: "10:20",
      courseName: "Elective Lecture Lecture",
      category: "theory",
    },
    {
      day: "Friday",
      startTime: "11:25",
      endTime: "12:20",
      courseCode: "ENG210",
      courseName: "Creative Writing",
      professor: "Prof. Davis",
      room: "R210",
      category: "theory",
    },
  ],
  "Nov 8–13": [
    // Monday
    {
      day: "Monday",
      startTime: "08:30",
      endTime: "09:25",
      courseCode: "CSC401",
      courseName: "Data Structures",
      professor: "Prof. Smith",
      room: "R301",
      category: "theory",
    },
    {
      day: "Monday",
      startTime: "09:25",
      endTime: "10:20",
      courseName: "Theory Lab Lecture",
      category: "theory",
    },
    // Tuesday
    {
      day: "Tuesday",
      startTime: "09:25",
      endTime: "10:20",
      courseCode: "BIO201",
      courseName: "Cell Biology Lab",
      professor: "Dr. Jones",
      room: "R405",
      category: "lab",
    },
    {
      day: "Tuesday",
      startTime: "10:30",
      endTime: "11:25",
      courseName: "Lab Lab Lecture",
      category: "lab",
    },
    // Wednesday
    {
      day: "Wednesday",
      startTime: "08:30",
      endTime: "09:25",
      courseName: "Theory - Lab Biology",
      professor: "Prof. Smith",
      room: "R301",
      category: "elective",
    },
    {
      day: "Wednesday",
      startTime: "11:25",
      endTime: "12:20",
      courseCode: "MTH301",
      courseName: "Advanced Calculus",
      professor: "Prof. Johnson",
      room: "R102",
      category: "theory",
    },
    // Thursday
    {
      day: "Thursday",
      startTime: "08:30",
      endTime: "09:25",
      courseName: "Lab Lab Lecture",
      professor: "Dr. Jones",
      room: "R405",
      category: "lab",
    },
    {
      day: "Thursday",
      startTime: "10:30",
      endTime: "11:25",
      courseCode: "HIS110",
      courseName: "World History",
      professor: "Dr. Evans",
      room: "R112",
      category: "elective",
    },
    // Friday
    {
      day: "Friday",
      startTime: "08:30",
      endTime: "09:25",
      courseName: "Theory - Lab Lecture",
      room: "R301",
      category: "theory",
    },
    {
      day: "Friday",
      startTime: "11:25",
      endTime: "12:20",
      courseCode: "ENG210",
      courseName: "Creative Writing",
      professor: "Prof. Davis",
      room: "R210",
      category: "theory",
    },
  ],
  "Nov 15–20": [
    // Monday
    {
      day: "Monday",
      startTime: "09:25",
      endTime: "10:20",
      courseName: "Theory Lab Lecture",
      category: "theory",
    },
    {
      day: "Monday",
      startTime: "10:30",
      endTime: "11:25",
      courseName: "Elective Lecture Lecture",
      category: "elective",
    },
    // Tuesday
    {
      day: "Tuesday",
      startTime: "08:30",
      endTime: "09:25",
      courseCode: "CSC401",
      courseName: "Data Structures",
      professor: "Prof. Smith",
      room: "R301",
      category: "theory",
    },
    // Wednesday
    {
      day: "Wednesday",
      startTime: "10:30",
      endTime: "11:25",
      courseName: "Thouny Lab Lecture",
      category: "theory",
    },
    // Thursday
    {
      day: "Thursday",
      startTime: "09:25",
      endTime: "10:20",
      courseName: "Theory Lab Lecture",
      category: "lab",
    },
    {
      day: "Thursday",
      startTime: "11:25",
      endTime: "12:20",
      courseName: "Theory Lab Lecture",
      category: "lab",
    },
    // Friday
    {
      day: "Friday",
      startTime: "09:25",
      endTime: "10:20",
      courseName: "Elective Lecture Lecture",
      category: "theory",
    },
  ],
};

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const timeLabels = ["8 AM", "10 AM", "12 PM", "2 PM", "4 PM", "6 PM", "7 PM"];

const colorPalettes = [
  // 1. Violet
  {
    card: "bg-[#ede9fe] border border-[#c4b5fd] text-[#5b21b6] hover:bg-[#ddd6fe] hover:border-[#a78bfa] dark:bg-[#ede9fe]/15 dark:border-[#c4b5fd]/40 dark:text-[#c4b5fd]",
    dot: "bg-[#7c3aed]",
    tag: "bg-[#7c3aed] text-white",
    sub: "text-[#5b21b6]/85 dark:text-[#d1d5db]",
  },
  // 2. Emerald
  {
    card: "bg-[#d1fae5] border border-[#6ee7b7] text-[#064e3b] hover:bg-[#a7f3d0] hover:border-[#34d399] dark:bg-[#d1fae5]/15 dark:border-[#6ee7b7]/40 dark:text-[#6ee7b7]",
    dot: "bg-[#059669]",
    tag: "bg-[#059669] text-white",
    sub: "text-[#064e3b]/80 dark:text-[#d1d5db]",
  },
  // 3. Amber
  {
    card: "bg-[#fef3c7] border border-[#fcd34d] text-[#78350f] hover:bg-[#fde68a] hover:border-[#fbbf24] dark:bg-[#fef3c7]/15 dark:border-[#fcd34d]/40 dark:text-[#fcd34d]",
    dot: "bg-[#d97706]",
    tag: "bg-[#d97706] text-white",
    sub: "text-[#78350f]/80 dark:text-[#d1d5db]",
  },
  // 4. Orange
  {
    card: "bg-[#ffedd5] border border-[#fdba74] text-[#7c2d12] hover:bg-[#fed7aa] hover:border-[#f97316] dark:bg-[#ffedd5]/15 dark:border-[#fdba74]/40 dark:text-[#fdba74]",
    dot: "bg-[#ea580c]",
    tag: "bg-[#ea580c] text-white",
    sub: "text-[#7c2d12]/80 dark:text-[#d1d5db]",
  },
  // 5. Teal
  {
    card: "bg-[#ccfbf1] border border-[#5eead4] text-[#134e4a] hover:bg-[#99f6e4] hover:border-[#14b8a6] dark:bg-[#ccfbf1]/15 dark:border-[#5eead4]/40 dark:text-[#5eead4]",
    dot: "bg-[#0d9488]",
    tag: "bg-[#0d9488] text-white",
    sub: "text-[#134e4a]/85 dark:text-[#d1d5db]",
  },
  // 6. Rose
  {
    card: "bg-[#ffe4e6] border border-[#fda4af] text-[#881337] hover:bg-[#fecdd3] hover:border-[#f43f5e] dark:bg-[#ffe4e6]/15 dark:border-[#fda4af]/40 dark:text-[#fda4af]",
    dot: "bg-[#e11d48]",
    tag: "bg-[#e11d48] text-white",
    sub: "text-[#881337]/80 dark:text-[#d1d5db]",
  },
  // 7. Cyan
  {
    card: "bg-[#cffafe] border border-[#67e8f9] text-[#164e63] hover:bg-[#a5f3fc] hover:border-[#22d3ee] dark:bg-[#cffafe]/15 dark:border-[#67e8f9]/40 dark:text-[#67e8f9]",
    dot: "bg-[#0891b2]",
    tag: "bg-[#0891b2] text-white",
    sub: "text-[#164e63]/80 dark:text-[#d1d5db]",
  },
  // 8. Pink
  {
    card: "bg-[#fce7f3] border border-[#f9a8d4] text-[#831843] hover:bg-[#fbcfe8] hover:border-[#ec4899] dark:bg-[#fce7f3]/15 dark:border-[#f9a8d4]/40 dark:text-[#f9a8d4]",
    dot: "bg-[#db2777]",
    tag: "bg-[#db2777] text-white",
    sub: "text-[#831843]/80 dark:text-[#d1d5db]",
  },
  // 9. Indigo
  {
    card: "bg-[#e0e7ff] border border-[#c7d2fe] text-[#3730a3] hover:bg-[#c7d2fe] hover:border-[#a5b4fc] dark:bg-[#e0e7ff]/15 dark:border-[#c7d2fe]/40 dark:text-[#c7d2fe]",
    dot: "bg-[#4f46e5]",
    tag: "bg-[#4f46e5] text-white",
    sub: "text-[#3730a3]/85 dark:text-[#d1d5db]",
  },
  // 10. Blue
  {
    card: "bg-[#dbeafe] border border-[#bfdbfe] text-[#1e3a8a] hover:bg-[#bfdbfe] hover:border-[#93c5fd] dark:bg-[#dbeafe]/15 dark:border-[#bfdbfe]/40 dark:text-[#bfdbfe]",
    dot: "bg-[#2563eb]",
    tag: "bg-[#2563eb] text-white",
    sub: "text-[#1e3a8a]/85 dark:text-[#d1d5db]",
  }
];

// Category styles mapping based on the course-differentiating colors
const getCategoryClasses = (event: TimetableEvent) => {
  const category = (event.category || "theory").toLowerCase();
  if (category === "lab") {
    return colorPalettes[1]; // Emerald (Lab)
  }
  if (category === "elective") {
    return colorPalettes[5]; // Rose (Elective)
  }
  return colorPalettes[0]; // Violet (Theory)
};

// Subcomponent: TimetableHeader
interface TimetableHeaderProps {
  currentWeek: string;
  availableWeeks: string[];
  onWeekChange: (week: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function TimetableHeader({
  currentWeek,
  availableWeeks,
  onWeekChange,
  searchQuery,
  onSearchChange,
  isDark,
  onToggleTheme,
}: TimetableHeaderProps) {
  const { colorSchema } = useCampusData();
  const isTeal = colorSchema === "teal";

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#e5e7eb] dark:border-[#4b5563]">
      <div className="flex flex-wrap items-baseline gap-1.5 select-none">
        <h2 className="font-sans text-[15px] font-bold uppercase tracking-wider text-[#1f2937] dark:text-white">
          TIMETABLE PREVIEW
        </h2>
        <span className="text-sm text-[#1f2937] dark:text-[#d1d5db] font-normal">
          – Week of {currentWeek}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 self-end md:self-auto relative">
        {/* Toggle button to switch theme */}
        <button
          onClick={onToggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="flex items-center justify-center h-9 w-9 rounded-lg border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-gray-50 dark:border-[#4b5563] dark:bg-[#111827] dark:text-[#d1d5db] dark:hover:text-white transition cursor-pointer select-none"
        >
          {isDark ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* Search input */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6b7280]" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              "h-9 w-40 md:w-44 rounded-lg border border-[#e5e7eb] bg-white text-[#1f2937] placeholder-[#6b7280] dark:border-[#4b5563] dark:bg-[#111827] dark:text-white dark:placeholder-[#d1d5db] pl-9 pr-3.5 text-xs outline-none transition-all focus:ring-1",
              isTeal
                ? "focus:border-[#3c6e71] focus:ring-[#3c6e71]/25 dark:focus:border-[#3c6e71] dark:focus:ring-[#3c6e71]/30"
                : "focus:border-[#534AB7] focus:ring-[#534AB7]/25 dark:focus:border-[#534AB7] dark:focus:ring-[#534AB7]/30"
            )}
          />
        </div>
      </div>
    </div>
  );
}

// Subcomponent: TimetableLegend
export function TimetableLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 py-4 border-b border-[#e5e7eb] dark:border-[#4b5563]">
      <div className="flex items-center gap-2 select-none">
        <span className="h-3 w-4 rounded border border-[#c4b5fd] bg-[#ede9fe]" />
        <span className="text-[11px] font-semibold text-[#6b7280] dark:text-[#d1d5db]">Theory</span>
      </div>
      <div className="flex items-center gap-2 select-none">
        <span className="h-3 w-4 rounded border border-[#6ee7b7] bg-[#d1fae5]" />
        <span className="text-[11px] font-semibold text-[#6b7280] dark:text-[#d1d5db]">Lab</span>
      </div>
      <div className="flex items-center gap-2 select-none">
        <span className="h-3 w-4 rounded border border-[#fda4af] bg-[#ffe4e6]" />
        <span className="text-[11px] font-semibold text-[#6b7280] dark:text-[#d1d5db]">Elective Lectures</span>
      </div>
    </div>
  );
}


// Subcomponent: EventCard
interface EventCardProps {
  event: TimetableEvent;
  matchesSearch: boolean;
  onClick?: () => void;
}

export function EventCard({ event, matchesSearch, onClick }: EventCardProps) {
  const classes = getCategoryClasses(event);
  const startMins = timeToMinutes(event.startTime);
  const endMins = timeToMinutes(event.endTime);

  // Total grid span is 11 hours = 660 mins (from 08:00 to 19:00)
  const topPercent = (startMins / 660) * 100;
  const heightPercent = ((endMins - startMins) / 660) * 100;

  const titleText = event.courseCode
    ? `${event.courseCode} – ${event.courseName}`
    : event.courseName;

  const timeText = `${event.startTime}–${event.endTime}`;
  const facultyRoomText = [event.professor, event.room].filter(Boolean).join(" · ");

  // Tooltip content showing complete details on hover
  const tooltipText = `${titleText}\nTime: ${timeText}${event.professor ? `\nFaculty: ${event.professor}` : ""}${event.room ? `\nRoom/Lab: ${event.room}` : ""}`;

  return (
    <div
      onClick={onClick}
      title={tooltipText}
      className={cn(
        "absolute rounded-[10px] py-[6px] px-[10px] flex flex-col justify-start gap-y-[2px] transition-all duration-300 text-left select-none cursor-pointer shadow-none overflow-hidden",
        classes.card,
        matchesSearch
          ? "opacity-100"
          : "opacity-20 blur-[0.5px] scale-[0.98] pointer-events-none"
      )}
      style={{
        top: `${topPercent}%`,
        height: `${heightPercent}%`,
        minHeight: "50px",
        left: "5px",
        right: "5px",
      }}
    >
      <div className="font-semibold text-[11px] leading-tight truncate w-full">
        {titleText}
      </div>
      <div className="text-[10px] font-medium leading-none opacity-85 mt-0.5 truncate w-full">
        {timeText}
      </div>
      {facultyRoomText && (
        <div className="text-[9px] font-normal leading-none opacity-75 mt-0.5 truncate w-full">
          {facultyRoomText}
        </div>
      )}
    </div>
  );
}

// Subcomponent: TimetableGrid
interface TimetableGridProps {
  events: TimetableEvent[];
  searchQuery: string;
  onEventClick: (event: TimetableEvent) => void;
}

export function TimetableGrid({ events, searchQuery, onEventClick }: TimetableGridProps) {
  // Check if an event matches the search query
  const checkEventMatches = (event: TimetableEvent) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchesCode = event.courseCode?.toLowerCase().includes(query) || false;
    const matchesName = event.courseName.toLowerCase().includes(query);
    const matchesProf = event.professor?.toLowerCase().includes(query) || false;
    return matchesCode || matchesName || matchesProf;
  };

  return (
    <div className="overflow-x-auto -mx-6 px-6 sm:-mx-8 sm:px-8 mt-5">
      <div className="min-w-[850px] select-none">
        
        {/* Day Column Headers */}
        <div className="grid grid-cols-[64px_repeat(6,1fr)] items-center border-b border-[#e5e7eb] dark:border-[#4b5563] pb-3">
          {/* Gutter space */}
          <div />
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="text-center font-medium text-[13px] text-[#6b7280] dark:text-[#d1d5db]"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid Body */}
        <div className="grid grid-cols-[64px_repeat(6,1fr)] relative h-[560px] mt-2.5">
          {/* Horizontal Period Lines (absolute background) */}
          {[
            { label: "08:30", top: (30 / 660) * 100, showLabel: true },
            { label: "09:25", top: (85 / 660) * 100, showLabel: true },
            { label: "10:20", top: (140 / 660) * 100, showLabel: false },
            { label: "10:30", top: (150 / 660) * 100, showLabel: true },
            { label: "11:25", top: (205 / 660) * 100, showLabel: true },
            { label: "12:20", top: (260 / 660) * 100, showLabel: true },
            { label: "13:15", top: (315 / 660) * 100, showLabel: true },
            { label: "14:10", top: (370 / 660) * 100, showLabel: true },
            { label: "15:05", top: (425 / 660) * 100, showLabel: false },
            { label: "15:10", top: (430 / 660) * 100, showLabel: true },
            { label: "16:00", top: (480 / 660) * 100, showLabel: true },
            { label: "16:50", top: (530 / 660) * 100, showLabel: false },
            { label: "16:55", top: (535 / 660) * 100, showLabel: true },
            { label: "17:45", top: (585 / 660) * 100, showLabel: true },
            { label: "18:35", top: (635 / 660) * 100, showLabel: true },
          ].map((pos) => (
            <div
              key={pos.label}
              className={cn(
                "absolute left-[64px] right-0 z-0",
                pos.showLabel
                  ? "border-t-[0.5px] border-[#e5e7eb] dark:border-[#4b5563]/40"
                  : "border-t-[0.5px] border-dashed border-[#e5e7eb]/60 dark:border-[#4b5563]/20"
              )}
              style={{ top: `${pos.top}%` }}
            />
          ))}

          {/* Time Labels (Gutter) */}
          <div className="relative h-full z-10">
            {[
              { label: "08:30", top: (30 / 660) * 100 },
              { label: "09:25", top: (85 / 660) * 100 },
              { label: "10:30", top: (150 / 660) * 100 },
              { label: "11:25", top: (205 / 660) * 100 },
              { label: "12:20", top: (260 / 660) * 100 },
              { label: "13:15", top: (315 / 660) * 100 },
              { label: "14:10", top: (370 / 660) * 100 },
              { label: "15:10", top: (430 / 660) * 100 },
              { label: "16:00", top: (480 / 660) * 100 },
              { label: "16:55", top: (535 / 660) * 100 },
              { label: "17:45", top: (585 / 660) * 100 },
              { label: "18:35", top: (635 / 660) * 100 },
            ].map((pos) => (
              <div
                key={pos.label}
                className="absolute right-4 text-[11px] font-semibold text-[#9ca3af] dark:text-[#d1d5db] select-none -translate-y-1/2 whitespace-nowrap"
                style={{ top: `${pos.top}%` }}
              >
                {pos.label}
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {daysOfWeek.map((day) => {
            const dayEvents = events.filter((e) => e.day === day);
            return (
              <div
                key={day}
                className="relative h-full z-10"
              >
                {dayEvents.map((event, eventIdx) => (
                  <EventCard
                    key={`${event.day}-${eventIdx}-${event.startTime}`}
                    event={event}
                    matchesSearch={checkEventMatches(event)}
                    onClick={() => onEventClick(event)}
                  />
                ))}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

// Parent component: TimetablePreview
export function TimetablePreview() {
  const { colorSchema, faculty, timetables, solverRunId } = useCampusData();
  const isTeal = colorSchema === "teal";

  // Check if a timetable has actually been generated
  const isTimetableGenerated = useMemo(() => {
    if (solverRunId) return true;
    
    return Object.values(timetables).some((groupSchedule) => {
      return Object.values(groupSchedule).some((daySlots) => {
        return daySlots && daySlots.some((slot) => slot !== null);
      });
    });
  }, [timetables, solverRunId]);

  const availableWeeks = Object.keys(weeksEventData);
  const [currentWeek, setCurrentWeek] = useState(availableWeeks[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<TimetableEvent | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Selector states
  const [viewType, setViewType] = useState<"class" | "faculty">("class");
  const classList = useMemo(() => {
    return Object.keys(timetables).filter(
      (gId) => gId !== "Timetable A" && gId !== "Timetable B" && gId !== "Timetable C"
    );
  }, [timetables]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");

  const activeClass = selectedClass || classList[0] || "CSE-3A";
  const activeFaculty = selectedFaculty || faculty[0]?.name || "Dr. Anil Mehra";

  // Auto-select first class when classList changes
  useEffect(() => {
    if (classList.length > 0 && !selectedClass) {
      setSelectedClass(classList[0]);
    }
  }, [classList]);

  // Auto-select first faculty when faculty list changes
  useEffect(() => {
    if (faculty.length > 0 && !selectedFaculty) {
      setSelectedFaculty(faculty[0].name);
    }
  }, [faculty]);

  // Sync state with HTML's class list
  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkDark();

    // Listen to documentElement class changes
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains("dark")) {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  };

  // Compile dynamic events from live database
  const dynamicEvents = useMemo(() => {
    const timeSlots = [
      { start: "08:30", end: "09:25" },
      { start: "09:25", end: "10:20" },
      { start: "10:30", end: "11:25" },
      { start: "11:25", end: "12:20" },
      { start: "13:15", end: "14:10" },
      { start: "14:10", end: "15:05" },
      { start: "15:10", end: "16:00" },
      { start: "16:00", end: "16:50" },
      { start: "16:55", end: "17:45" },
      { start: "17:45", end: "18:35" },
    ];

    const dayFullMap: Record<string, string> = {
      Mon: "Monday",
      Tue: "Tuesday",
      Wed: "Wednesday",
      Thu: "Thursday",
      Fri: "Friday",
      Sat: "Saturday",
    };

    const compiledEvents: TimetableEvent[] = [];

    if (viewType === "class") {
      const schedule = timetables[activeClass];
      if (schedule) {
        Object.keys(schedule).forEach((day) => {
          const dayName = dayFullMap[day];
          if (!dayName) return;
          const slots = schedule[day] || [];
          
          let currentMerged: TimetableEvent | null = null;

          for (let idx = 0; idx < slots.length; idx++) {
            if (idx >= timeSlots.length) break;
            const slot = slots[idx];

            if (slot) {
              if (currentMerged && 
                  currentMerged.courseName === slot.subject &&
                  currentMerged.professor === slot.faculty &&
                  currentMerged.room === slot.room &&
                  currentMerged.endTime === timeSlots[idx].start) {
                currentMerged.endTime = timeSlots[idx].end;
              } else {
                if (currentMerged) {
                  compiledEvents.push(currentMerged);
                }
                currentMerged = {
                  day: dayName as any,
                  startTime: timeSlots[idx].start,
                  endTime: timeSlots[idx].end,
                  courseCode: slot.subject.substring(0, 7).toUpperCase(),
                  courseName: slot.subject,
                  professor: slot.faculty,
                  room: slot.room,
                  category: slot.type === "lab" ? "lab" : slot.type === "elective" ? "elective" : "theory",
                };
              }
            } else {
              if (currentMerged) {
                compiledEvents.push(currentMerged);
                currentMerged = null;
              }
            }
          }

          if (currentMerged) {
            compiledEvents.push(currentMerged);
          }
        });
      }
    } else {
      // Faculty-wise
      const activeGroups = Object.keys(timetables).filter(
        (gId) => gId !== "Timetable A" && gId !== "Timetable B" && gId !== "Timetable C"
      );

      // Create a day-based slot grid for this faculty member
      interface FacultySlot {
        subject: string;
        faculty: string;
        room: string;
        type: string;
        cohort: string;
      }
      const facultyScheduleByDay: Record<string, (FacultySlot | null)[]> = {};
      Object.values(dayFullMap).forEach((dayName) => {
        facultyScheduleByDay[dayName] = Array(timeSlots.length).fill(null);
      });

      activeGroups.forEach((gId) => {
        const schedule = timetables[gId];
        if (!schedule) return;
        Object.keys(schedule).forEach((day) => {
          const dayName = dayFullMap[day];
          if (!dayName) return;
          const slots = schedule[day] || [];
          slots.forEach((slot, idx) => {
            if (slot && slot.faculty === activeFaculty && idx < timeSlots.length) {
              facultyScheduleByDay[dayName][idx] = {
                subject: slot.subject,
                faculty: slot.faculty,
                room: slot.room,
                type: slot.type,
                cohort: gId,
              };
            }
          });
        });
      });

      Object.keys(facultyScheduleByDay).forEach((dayName) => {
        const slots = facultyScheduleByDay[dayName];
        interface MergedFacultyEvent extends TimetableEvent {
          cohort: string;
        }
        let currentMerged: MergedFacultyEvent | null = null;

        for (let idx = 0; idx < slots.length; idx++) {
          const slot = slots[idx];
          if (slot) {
            if (currentMerged &&
                currentMerged.courseName === slot.subject &&
                currentMerged.room === slot.room &&
                currentMerged.cohort === slot.cohort &&
                currentMerged.endTime === timeSlots[idx].start) {
              currentMerged.endTime = timeSlots[idx].end;
            } else {
              if (currentMerged) {
                compiledEvents.push({
                  day: currentMerged.day,
                  startTime: currentMerged.startTime,
                  endTime: currentMerged.endTime,
                  courseCode: currentMerged.courseCode,
                  courseName: `${currentMerged.courseName} (${currentMerged.cohort})`,
                  professor: currentMerged.professor,
                  room: currentMerged.room,
                  category: currentMerged.category,
                });
              }
              currentMerged = {
                day: dayName as any,
                startTime: timeSlots[idx].start,
                endTime: timeSlots[idx].end,
                courseCode: slot.subject.substring(0, 7).toUpperCase(),
                courseName: slot.subject,
                professor: slot.faculty,
                room: slot.room,
                category: slot.type === "lab" ? "lab" : slot.type === "elective" ? "elective" : "theory",
                cohort: slot.cohort,
              };
            }
          } else {
            if (currentMerged) {
              compiledEvents.push({
                day: currentMerged.day,
                startTime: currentMerged.startTime,
                endTime: currentMerged.endTime,
                courseCode: currentMerged.courseCode,
                courseName: `${currentMerged.courseName} (${currentMerged.cohort})`,
                professor: currentMerged.professor,
                room: currentMerged.room,
                category: currentMerged.category,
              });
              currentMerged = null;
            }
          }
        }

        if (currentMerged) {
          compiledEvents.push({
            day: currentMerged.day,
            startTime: currentMerged.startTime,
            endTime: currentMerged.endTime,
            courseCode: currentMerged.courseCode,
            courseName: `${currentMerged.courseName} (${currentMerged.cohort})`,
            professor: currentMerged.professor,
            room: currentMerged.room,
            category: currentMerged.category,
          });
        }
      });
    }

    // If no events compiled yet (e.g. initial render with empty data), fall back to standard mock events only if generated
    if (compiledEvents.length === 0) {
      if (isTimetableGenerated) {
        return weeksEventData[currentWeek] || [];
      }
      return [];
    }

    return compiledEvents;
  }, [viewType, activeClass, activeFaculty, timetables, faculty, currentWeek, isTimetableGenerated]);

  if (!isTimetableGenerated) {
    return (
      <div className="w-full max-w-[1000px] bg-white border border-[#e5e7eb] dark:bg-[#1e293b] dark:border-[#334155] rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[400px] shadow-sm select-none animate-in fade-in duration-300">
        <div className={cn(
          "grid h-16 w-16 place-items-center rounded-2xl border mb-6",
          isTeal
            ? "bg-[#e8f4f4] border-[#3c6e71]/20 text-[#3c6e71]"
            : "bg-[#EEEDFE] border-[#534AB7]/20 text-[#534AB7]"
        )}>
          <CalendarCheck className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          No Timetable Generated Yet
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6 leading-relaxed">
          There are no scheduled lectures or cohorts to display. Please run the AI Schedule Generator to build your optimized college schedule.
        </p>
        <Link
          to="/generate"
          className={cn(
            "inline-flex items-center justify-center text-xs font-semibold px-4 py-2.5 rounded-xl text-white shadow-sm transition cursor-pointer border-0",
            isTeal ? "bg-[#3c6e71] hover:bg-[#2e5557]" : "bg-[#534AB7] hover:bg-[#3C3489]"
          )}
        >
          Go to AI Generator
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1000px] bg-white border border-[#e5e7eb] shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:bg-[#1e293b] dark:border-[#334155] dark:shadow-none rounded-2xl p-6 sm:p-8 animate-in fade-in duration-300 transition-all">
      <TimetableHeader
        currentWeek={viewType === "class" ? `Class ${activeClass}` : `Faculty ${activeFaculty}`}
        availableWeeks={availableWeeks}
        onWeekChange={setCurrentWeek}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* Filter Tabs & Target Select Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 py-3 border-b border-[#e5e7eb] dark:border-[#334155]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewType("class")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg transition select-none cursor-pointer border-0",
              viewType === "class"
                ? isTeal
                  ? "bg-[#3c6e71] text-white"
                  : "bg-[#534AB7] text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            )}
          >
            Class Schedules
          </button>
          <button
            onClick={() => setViewType("faculty")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg transition select-none cursor-pointer border-0",
              viewType === "faculty"
                ? isTeal
                  ? "bg-[#3c6e71] text-white"
                  : "bg-[#534AB7] text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            )}
          >
            Faculty Schedules
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Select:</span>
          {viewType === "class" ? (
            <select
              value={activeClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="h-8 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 px-3 outline-none cursor-pointer"
            >
              {classList.map((cls: string) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={activeFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="h-8 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 px-3 outline-none cursor-pointer"
            >
              {faculty.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <TimetableLegend />
      <TimetableGrid
        events={dynamicEvents}
        searchQuery={searchQuery}
        onEventClick={(event) => setSelectedEvent(event)}
      />

      {/* Detail Modal if clicked */}
      {selectedEvent && (
        <div
          onClick={() => setSelectedEvent(null)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white border border-gray-100 text-gray-900 dark:bg-[#374151] dark:border-[#4b5563] dark:text-white rounded-2xl shadow-xl p-5 select-none animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className={cn(
                  "h-3 w-3 rounded-full",
                  getCategoryClasses(selectedEvent).dot
                )}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#d1d5db]">
                {selectedEvent.category} lecture
              </span>
            </div>
            
            <h3 className="text-sm font-bold leading-snug">
              {selectedEvent.courseCode
                ? `${selectedEvent.courseCode} — ${selectedEvent.courseName}`
                : selectedEvent.courseName}
            </h3>

            <div className="mt-4 space-y-2.5 border-t border-gray-50 dark:border-[#4b5563] pt-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 dark:text-[#d1d5db]">Time:</span>
                <span className="font-semibold text-gray-700 dark:text-white">
                  {selectedEvent.day}, {selectedEvent.startTime} – {selectedEvent.endTime}
                </span>
              </div>
              {selectedEvent.professor && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 dark:text-[#d1d5db]">Professor:</span>
                  <span className="font-semibold text-gray-700 dark:text-white">{selectedEvent.professor}</span>
                </div>
              )}
              {selectedEvent.room && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 dark:text-[#d1d5db]">Room/Lab:</span>
                  <span className="font-semibold text-gray-700 dark:text-white">{selectedEvent.room}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedEvent(null)}
              className={cn(
                "mt-5 w-full bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 dark:text-white dark:border-0 text-xs font-semibold py-2 rounded-xl transition cursor-pointer",
                isTeal ? "dark:bg-[#3c6e71] dark:hover:bg-[#2e5557]" : "dark:bg-[#534AB7] dark:hover:bg-[#3C3489]"
              )}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
