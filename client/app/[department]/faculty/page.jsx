"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import DashboardNav from "@/app/components/shared/DashboardNav";
import Sidebar from "@/app/components/shared/Sidebar";
import LoadingSpinner from "@/app/components/shared/LoadingSpinner";
import {
  getDepartmentTabs,
  createTabNavigator,
} from "@/app/components/dashboard/DepartmentSidebarConfig";
import RescheduleModal from "@/app/components/dashboard/RescheduleModal";
import TimetableGrid from "@/app/components/dashboard/TimetableGrid";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

export default function FacultyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const departmentName = params.department;
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [facultySchedules, setFacultySchedules] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [allScheduleData, setAllScheduleData] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [configuration, setConfiguration] = useState({});

  const colors = [
    { slot: "slot-rose", tag: "slot-tag-rose" },
    { slot: "slot-emerald", tag: "slot-tag-emerald" },
    { slot: "slot-amber", tag: "slot-tag-amber" },
    { slot: "slot-cyan", tag: "slot-tag-cyan" },
    { slot: "slot-violet", tag: "slot-tag-violet" },
    { slot: "slot-pink", tag: "slot-tag-pink" },
    { slot: "slot-teal", tag: "slot-tag-teal" },
    { slot: "slot-orange", tag: "slot-tag-orange" },
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated" && session.user.role !== "admin") {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user.role === "admin") {
      fetchDepartmentData();
    }
  }, [session]);

  const fetchDepartmentData = async () => {
    try {
      const response = await fetch(
        `/api/coordinators/get-department?department=${departmentName}`,
      );
      const data = await response.json();
      if (data.success) {
        const dept = data.department;
        setDepartment(dept);
        setTimeSlots(dept.timetableData?.timeSlots || []);
        setConfiguration(dept.configuration || {});

        if (dept?.selectedSchedule?.scheduleData) {
          setAllScheduleData(dept.selectedSchedule.scheduleData);
          parseFacultySchedules(dept.selectedSchedule.scheduleData);
        }
      }
    } catch (error) {
      console.error("Error fetching department data:", error);
    } finally {
      setLoading(false);
    }
  };

  const parseFacultySchedulesAndReturn = (scheduleData) => {
    const facultyMap = {};

    scheduleData.forEach((row) => {
      const faculty = row.Faculty || row.faculty;
      if (!faculty) return;

      if (!facultyMap[faculty]) {
        facultyMap[faculty] = [];
      }

      facultyMap[faculty].push({
        day: row.Day || row.day,
        time: row.Time || row.time,
        batch:
          row["Div/Batch"] || row.Batch || row.batch || row.Group || row.group,
        course: row.Course || row.course || row.Subject || row.subject,
        room: row.Room || row.room,
        type: row.Type || row.type,
      });
    });

    console.log("Original rows:", scheduleData.length);

    console.log(
      "Faculty rows:",
      Object.values(facultyMap).reduce((a, b) => a + b.length, 0),
    );

    console.log("Faculty count:", Object.keys(facultyMap).length);
    return Object.keys(facultyMap).map((name) => ({
      name,
      schedule: facultyMap[name],
    }));
  };

  const parseFacultySchedules = (scheduleData) => {
    const facultyList = parseFacultySchedulesAndReturn(scheduleData);
    console.log("FACULTY LIST SAMPLE:", facultyList[0]);
    setFacultySchedules(facultyList);
    if (facultyList.length > 0) {
      setSelectedFaculty(facultyList[0]);
    }
  };

  const getColorForSlot = (slot) => {
    const hash = (slot.batch + slot.course)
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const handleSlotClick = (slot, day, time) => {
    if (!slot) return;
    console.log("Faculty page - Slot clicked:", slot);
    console.log("Faculty page - Adding day/time:", day, time);
    const fullSlot = {
      ...slot,
      day,
      time,
      faculty: slot.faculty || selectedFaculty.name,
    };
    console.log("Faculty page - Full slot:", fullSlot);
    setSelectedSlot(fullSlot);
    setShowRescheduleModal(true);
  };

  const handleReschedule = async (type, value, isPermanent = true) => {
    try {
      console.log("=== RESCHEDULE DEBUG ===");
      console.log("Selected slot:", selectedSlot);
      console.log("Type:", type, "Value:", value);
      console.log("Total schedule data rows:", allScheduleData.length);

      let matchCount = 0;
      const updatedScheduleData = allScheduleData.map((row) => {
        const rowFaculty = row.Faculty || row.faculty;
        const rowDay = row.Day || row.day;
        const rowTime = row.Time || row.time;
        const rowBatch = row.Batch || row.batch;
        const rowCourse = row.Course || row.course;

        const matchesSlot =
          rowFaculty === selectedSlot.faculty &&
          rowDay === selectedSlot.day &&
          rowTime === selectedSlot.time &&
          rowBatch === selectedSlot.batch &&
          rowCourse === selectedSlot.course;

        if (matchCount === 0 && row.Faculty) {
          console.log("Sample row for comparison:", {
            rowFaculty,
            rowDay,
            rowTime,
            rowBatch,
            rowCourse,
            slotFaculty: selectedSlot.faculty,
            slotDay: selectedSlot.day,
            slotTime: selectedSlot.time,
            slotBatch: selectedSlot.batch,
            slotCourse: selectedSlot.course,
          });
        }

        if (matchesSlot) {
          matchCount++;
          console.log("MATCH FOUND! Row:", row);
          console.log("Match details:", {
            rowFaculty,
            rowDay,
            rowTime,
            rowBatch,
            rowCourse,
          });
          if (type === "room") {
            return { ...row, Room: value, room: value };
          } else if (type === "faculty") {
            const updated = { ...row, Faculty: value, faculty: value };
            if (!isPermanent) {
              const expiryDate = new Date();
              expiryDate.setDate(expiryDate.getDate() + 7);
              updated.temporaryUntil = expiryDate.toISOString();
            }
            return updated;
          }
          return row;
        }
        return row;
      });

      console.log("Total matches found:", matchCount);
      console.log("Sending update to API...");

      const response = await fetch(`/api/coordinators/get-department`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: departmentName,
          updateScheduleData: updatedScheduleData,
        }),
      });

      const result = await response.json();
      console.log("API Response:", result);

      if (result.success) {
        console.log("Update successful, refreshing data...");
        setAllScheduleData(updatedScheduleData);
        const newFacultySchedules =
          parseFacultySchedulesAndReturn(updatedScheduleData);
        setFacultySchedules(newFacultySchedules);

        const updatedSelectedFaculty = newFacultySchedules.find(
          (f) => f.name === selectedFaculty.name,
        );
        if (updatedSelectedFaculty) {
          setSelectedFaculty(updatedSelectedFaculty);
        }

        setShowRescheduleModal(false);
        setSelectedSlot(null);
        toast.success(
          type === "room"
            ? "Room updated successfully!"
            : `Faculty changed ${isPermanent ? "permanently" : "temporarily (7 days)"}!`,
        );

        // Force re-fetch to ensure data is synced
        await fetchDepartmentData();
      } else {
        toast.error("Failed to update schedule");
      }
    } catch (error) {
      console.error("Error rescheduling:", error);
      toast.error("Error updating schedule");
    }
  };

  if (loading || status === "loading") {
    return <LoadingSpinner message="Loading faculty schedules..." />;
  }

  if (selectedFaculty) {
    console.log("SELECTED FACULTY:", selectedFaculty);
    console.log("FACULTY SCHEDULE:", selectedFaculty.schedule);
    console.log("FACULTY ROWS:", selectedFaculty.schedule?.length);
  }

  return (
    <div className="min-h-screen content-bg flex">
      <Sidebar
        activeTab="faculty"
        setActiveTab={createTabNavigator(router, departmentName)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        tabs={getDepartmentTabs(departmentName)}
      />

      <div className="flex-1 lg:ml-0">
        <DashboardNav
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          title={`${department?.name || departmentName} Department`}
          subtitle="Faculty Timetables"
        />
        <div className="p-4">
          {facultySchedules.length === 0 ? (
            <div className="content-card rounded-2xl shadow-lg border content-border p-8 text-center">
              <svg
                className="h-16 w-16 text-gray-600 mb-4 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="text-xl font-bold dark-text mb-2">
                No Schedule Available
              </h3>
              <p className="dark-text-muted">
                Generate and select a schedule to view faculty timetables.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="content-card rounded-xl shadow-lg border content-border p-4">
                <label className="block text-sm font-medium dark-text mb-2">
                  Select Faculty
                </label>
                <select
                  value={selectedFaculty?.name || ""}
                  onChange={(e) =>
                    setSelectedFaculty(
                      facultySchedules.find((f) => f.name === e.target.value),
                    )
                  }
                  className="w-full p-3 border content-border rounded-lg dark-card dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {facultySchedules.map((faculty) => (
                    <option key={faculty.name} value={faculty.name}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedFaculty && (
                <div className="content-card rounded-xl shadow-lg border content-border p-4 overflow-x-auto">
                  <h3 className="text-lg font-bold dark-text mb-4">
                    {selectedFaculty.name}
                  </h3>
                  <TimetableGrid
                    schedule={selectedFaculty.schedule}
                    timeSlots={timeSlots}
                    configuration={configuration}
                    onSlotClick={handleSlotClick}
                    getColorForSlot={getColorForSlot}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showRescheduleModal && selectedSlot && (
        <RescheduleModal
          selectedSlot={selectedSlot}
          allScheduleData={allScheduleData}
          onClose={() => setShowRescheduleModal(false)}
          onReschedule={handleReschedule}
          viewType="faculty"
        />
      )}
    </div>
  );
}
