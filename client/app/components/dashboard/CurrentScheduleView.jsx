"use client";

import { useState, useEffect } from "react";
import {
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";
import TimetableGrid from "./TimetableGrid";
import ScheduleAnalysis from "./ScheduleAnalysis";
import PasswordModal from "../auth/PasswordModal";

export default function CurrentScheduleView({ department, departmentName }) {
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    fetchCurrentSchedule();
    const handleScheduleSelected = () =>
      setTimeout(() => fetchCurrentSchedule(), 2000);
    window.addEventListener("scheduleSelected", handleScheduleSelected);
    return () =>
      window.removeEventListener("scheduleSelected", handleScheduleSelected);
  }, [department]);

  const fetchCurrentSchedule = async () => {
    const deptName = departmentName || department?.name;
    if (!deptName) return;
    try {
      setLoading(true);
      const response = await fetch(
        `/api/coordinators/get-department?department=${deptName}`,
      );
      const data = await response.json();

      console.log("CURRENT SCHEDULE:", data.department?.selectedSchedule);

      console.log(
        "SCHEDULE DATA:",
        data.department?.selectedSchedule?.scheduleData,
      );

      console.log(
        "SCHEDULE ROW COUNT:",
        data.department?.selectedSchedule?.scheduleData?.length,
      );
      setCurrentSchedule(data.department?.selectedSchedule || null);
    } catch (error) {
      console.error("Error fetching current schedule:", error);
      setCurrentSchedule(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadClick = () => {
    setShowPasswordModal(true);
  };

  // In CurrentScheduleView.jsx — replace handleDownloadCurrent

  const handleDownloadCurrent = async () => {
    // If we have a runId, download the real Flask-generated Excel
    if (currentSchedule?.runId) {
      try {
        const res = await fetch(
          `/api/download-timetable/${currentSchedule.runId}`,
        );
        if (res.ok) {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = currentSchedule.filename || "generated_timetable.xlsx";
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          return;
        }
      } catch (e) {
        console.warn("Flask download failed, falling back to client-side:", e);
      }
    }

    // Fallback: rebuild from scheduleData (your existing logic)
    if (!currentSchedule?.scheduleData) return;
    const data = currentSchedule.scheduleData;
    const wb = XLSX.utils.book_new();
    const overviewWs = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, overviewWs, "Overview");
    XLSX.writeFile(wb, currentSchedule.filename || "schedule.xlsx");
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border p-8">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="relative">
            <div className="h-12 w-12 border-4 border-secondary rounded-full"></div>
            <div className="h-12 w-12 border-4 border-transparent border-t-primary rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-primary font-semibold mt-4">
            Loading current schedule...
          </p>
          <div className="flex items-center justify-center space-x-1 mt-2">
            <div
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentSchedule) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border p-8 text-center">
        <CalendarDaysIcon className="h-16 w-16 text-gray-300 mb-4 mx-auto" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          No Schedule Selected
        </h3>
        <p className="text-gray-600 mb-4">
          Generate and select a schedule to view it here.
        </p>
      </div>
    );
  }

  const getScheduleStats = () => {
    if (!currentSchedule?.scheduleData) return null;
    const data = currentSchedule.scheduleData;
    const uniqueFaculty = new Set(data.map((s) => s.Faculty || s.faculty)).size;
    const uniqueRooms = new Set(
      data
        .map((s) => s.Room || s.room)
        .filter((r) => r && r.toUpperCase() !== "ONLINE"),
    ).size;
    const labSessions = data.filter((s) => (s.Type || s.type) === "Lab").length;
    const theorySessions = data.filter(
      (s) => (s.Type || s.type) === "Theory",
    ).length;
    return {
      total: data.length,
      faculty: uniqueFaculty,
      rooms: uniqueRooms,
      labs: labSessions,
      theory: theorySessions,
    };
  };

  const stats = getScheduleStats();

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl border-2 border-primary/20 p-3 sm:p-6 relative overflow-hidden">
      <svg
        className="absolute top-0 right-0 w-64 h-64 text-primary opacity-5"
        viewBox="0 0 200 200"
      >
        <circle cx="100" cy="100" r="80" fill="currentColor" />
      </svg>
      <svg
        className="absolute top-10 right-20 w-40 h-40 text-primary opacity-10"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <svg
        className="absolute bottom-0 left-0 w-48 h-48 text-primary opacity-5"
        viewBox="0 0 200 200"
      >
        <circle cx="100" cy="100" r="80" fill="currentColor" />
      </svg>
      <svg
        className="absolute bottom-10 left-20 w-32 h-32 text-primary opacity-10"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <svg
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 text-primary opacity-3"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
      <svg
        className="absolute top-20 left-10 w-20 h-20 text-primary opacity-8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <svg
        className="absolute bottom-20 right-10 w-24 h-24 text-primary opacity-8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>

      <div className="flex items-center justify-between mb-4 sm:mb-6 relative z-10">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl shadow-lg">
              <CalendarDaysIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-primary">
                Current Schedule
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                {department?.name} Department
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <button
            onClick={fetchCurrentSchedule}
            className="bg-white text-gray-600 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm hover:bg-gray-50 transition-all shadow-md border border-gray-200 flex items-center gap-1"
          >
            <svg
              className="w-3 h-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
          <div className="bg-green-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Active
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 relative z-10">
          <div className="bg-primary rounded-xl p-3 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-90">Total Sessions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <svg
                className="w-8 h-8 opacity-80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
          </div>
          <div className="bg-cyan-600 rounded-xl p-3 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-90">Faculty</p>
                <p className="text-2xl font-bold">{stats.faculty}</p>
              </div>
              <svg
                className="w-8 h-8 opacity-80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
          <div className="bg-teal-600 rounded-xl p-3 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-90">Rooms</p>
                <p className="text-2xl font-bold">{stats.rooms}</p>
              </div>
              <svg
                className="w-8 h-8 opacity-80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>
          <div className="bg-teal-700 rounded-xl p-3 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-90">Theory</p>
                <p className="text-2xl font-bold">{stats.theory}</p>
              </div>
              <svg
                className="w-8 h-8 opacity-80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          </div>
          <div className="bg-emerald-600 rounded-xl p-3 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-90">Lab</p>
                <p className="text-2xl font-bold">{stats.labs}</p>
              </div>
              <svg
                className="w-8 h-8 opacity-80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 mb-4 border-2 border-primary/10 shadow-md relative z-10">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <div>
              <span className="text-gray-500 text-xs">Filename</span>
              <p className="font-semibold text-gray-800">
                {currentSchedule.filename}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div>
              <span className="text-gray-500 text-xs">Selected</span>
              <p className="font-semibold text-gray-800">
                {currentSchedule.selectedAt
                  ? new Date(currentSchedule.selectedAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-3 mb-4 relative z-10">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 font-semibold"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          {showPreview ? "Hide Preview" : "Preview Schedule"}
        </button>
        <button
          onClick={handleDownloadClick}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 font-semibold"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Download Excel
        </button>
      </div>

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onVerify={handleDownloadCurrent}
        departmentName={departmentName || department?.name}
      />

      {currentSchedule?.scheduleData && (
        <ScheduleAnalysis
          schedule={currentSchedule.scheduleData}
          departmentName={departmentName || department?.name}
        />
      )}

      {showPreview && currentSchedule?.scheduleData && (
        <div className="mt-6 relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <svg
              className="w-5 h-5 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h4 className="text-lg font-semibold text-gray-800">
              Schedule Preview
            </h4>
          </div>
          <div className="overflow-x-auto">
            <TimetableGrid
              schedule={currentSchedule.scheduleData}
              timeSlots={extractTimeSlots(currentSchedule.scheduleData)}
              configuration={currentSchedule.configuration || {}}
              showLunchBreak={true}
              getColorForSlot={(slot) => ({
                slot: "bg-blue-50 border-blue-200",
                tag: "bg-blue-100 text-blue-800",
              })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function extractTimeSlots(scheduleData) {
  if (!scheduleData || scheduleData.length === 0) return [];
  const slots = new Set();
  scheduleData.forEach((row) => {
    const time = row.Time || row.time;
    if (time) {
      const timeStr = String(time).trim();
      if (
        timeStr.includes("&") ||
        timeStr.includes(",") ||
        timeStr.includes("/")
      ) {
        timeStr.split(/[&,/]/).forEach((t) => {
          const cleaned = t.trim();
          if (cleaned && cleaned !== "null" && cleaned !== "undefined") {
            slots.add(cleaned);
          }
        });
      } else if (timeStr && timeStr !== "null" && timeStr !== "undefined") {
        slots.add(timeStr);
      }
    }
  });

  return Array.from(slots).sort((a, b) => {
    const timeA = a.match(/(\d{1,2}):(\d{2})/);
    const timeB = b.match(/(\d{1,2}):(\d{2})/);
    if (timeA && timeB) {
      const minutesA = parseInt(timeA[1]) * 60 + parseInt(timeA[2]);
      const minutesB = parseInt(timeB[1]) * 60 + parseInt(timeB[2]);
      return minutesA - minutesB;
    }
    return a.localeCompare(b);
  });
}
