"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardNav from "@/app/components/shared/DashboardNav";
import Sidebar from "@/app/components/shared/Sidebar";
import LoadingSpinner from "@/app/components/shared/LoadingSpinner";
import {
  getDepartmentTabs,
  createTabNavigator,
} from "@/app/components/dashboard/DepartmentSidebarConfig";
import RescheduleModal from "@/app/components/dashboard/RescheduleModal";
import TimetableGrid from "@/app/components/dashboard/TimetableGrid";
import IconBadge from "@/app/components/dashboard/IconBadge";
import { AcademicCapIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

export default function FacultyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const departmentName = "First Year";
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
        `/api/coordinators/get-department?department=${encodeURIComponent(departmentName)}`,
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

    return Object.keys(facultyMap).map((name) => ({
      name,
      schedule: facultyMap[name],
    }));
  };

  const parseFacultySchedules = (scheduleData) => {
    const facultyList = parseFacultySchedulesAndReturn(scheduleData);
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
    const fullSlot = {
      ...slot,
      day,
      time,
      faculty: slot.faculty || selectedFaculty.name,
    };
    setSelectedSlot(fullSlot);
    setShowRescheduleModal(true);
  };

  const handleReschedule = async (type, value, isPermanent = true) => {
    try {
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
        }

        if (matchesSlot) {
          matchCount++;
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

      const response = await fetch(`/api/coordinators/get-department`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: departmentName,
          updateScheduleData: updatedScheduleData,
        }),
      });

      const result = await response.json();

      if (result.success) {
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
      toast.error("Error updating schedule");
    }
  };

  if (loading || status === "loading") {
    return <LoadingSpinner message="Loading faculty schedules..." />;
  }

  if (selectedFaculty) {
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar
        activeTab="faculty"
        setActiveTab={createTabNavigator(router)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        tabs={getDepartmentTabs()}
      />

      <div className="flex-1 lg:ml-0 min-w-0">
        <DashboardNav
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          title={`${department?.name || departmentName} Department`}
          subtitle="Faculty Timetables"
        />
        <div className="p-4">
          {facultySchedules.length === 0 ? (
            <div className="dashboard-empty-state">
              <div className="flex justify-center mb-4">
                <IconBadge icon={AcademicCapIcon} size="lg" />
              </div>
              <h3 className="dashboard-empty-title">
                No Schedule Available
              </h3>
              <p className="dashboard-empty-text">
                Generate and select a schedule to view faculty timetables.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="dashboard-panel">
                <label className="dashboard-label">
                  <IconBadge icon={AcademicCapIcon} />
                  Select Faculty
                </label>
                <select
                  value={selectedFaculty?.name || ""}
                  onChange={(e) =>
                    setSelectedFaculty(
                      facultySchedules.find((f) => f.name === e.target.value),
                    )
                  }
                  className="dashboard-select focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {facultySchedules.map((faculty) => (
                    <option key={faculty.name} value={faculty.name}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedFaculty && (
                <div className="dashboard-panel dashboard-panel-scroll">
                  <h3 className="dashboard-panel-title">
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
