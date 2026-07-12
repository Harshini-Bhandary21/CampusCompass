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
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

export default function RoomsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const departmentName = "First Year";
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roomSchedules, setRoomSchedules] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
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
          parseRoomSchedules(dept.selectedSchedule.scheduleData);
        }
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const parseRoomSchedulesAndReturn = (scheduleData) => {
    const roomMap = {};

    scheduleData.forEach((row) => {
      const room = row.Room || row.room;
      if (!room) return;

      if (!roomMap[room]) {
        roomMap[room] = [];
      }

      roomMap[room].push({
        day: row.Day || row.day,
        time: row.Time || row.time,
        batch:
          row["Div/Batch"] || row.Batch || row.batch || row.Group || row.group,
        course: row.Course || row.course || row.Subject || row.subject,
        faculty: row.Faculty || row.faculty,
        type: row.Type || row.type,
      });
    });

    return Object.keys(roomMap).map((name) => ({
      name,
      schedule: roomMap[name],
    }));
  };

  const parseRoomSchedules = (scheduleData) => {
    const roomList = parseRoomSchedulesAndReturn(scheduleData);
    setRoomSchedules(roomList);
    if (roomList.length > 0) {
      setSelectedRoom(roomList[0]);
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
    setSelectedSlot({ ...slot, day, time, currentRoom: selectedRoom.name });
    setShowRescheduleModal(true);
  };

  const handleReschedule = async (type, value, isPermanent = true) => {
    try {
      let matchCount = 0;
      const updatedScheduleData = allScheduleData.map((row) => {
        const matchesSlot =
          (row.Room || row.room) === selectedSlot.currentRoom &&
          (row.Day || row.day) === selectedSlot.day &&
          (row.Time || row.time) === selectedSlot.time &&
          (row.Batch || row.batch) === selectedSlot.batch &&
          (row.Course || row.course) === selectedSlot.course;

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
        const newRoomSchedules =
          parseRoomSchedulesAndReturn(updatedScheduleData);
        setRoomSchedules(newRoomSchedules);

        const updatedSelectedRoom = newRoomSchedules.find(
          (r) => r.name === selectedRoom.name,
        );
        if (updatedSelectedRoom) {
          setSelectedRoom(updatedSelectedRoom);
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
    return <LoadingSpinner message="Loading room schedules..." />;
  }

  if (selectedRoom) {
  }

  return (
    <div className="min-h-screen content-bg flex">
      <Sidebar
        activeTab="rooms"
        setActiveTab={createTabNavigator(router)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        tabs={getDepartmentTabs()}
      />

      <div className="flex-1 lg:ml-0">
        <DashboardNav
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          title={`${department?.name || departmentName} Department`}
          subtitle="Room Timetables"
        />
        <div className="p-4">
          {roomSchedules.length === 0 ? (
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <h3 className="text-xl font-bold dark-text mb-2">
                No Schedule Available
              </h3>
              <p className="dark-text-muted">
                Generate and select a schedule to view room timetables.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="content-card rounded-xl shadow-lg border content-border p-4">
                <label className="block text-sm font-medium dark-text mb-2">
                  Select Room
                </label>
                <select
                  value={selectedRoom?.name || ""}
                  onChange={(e) =>
                    setSelectedRoom(
                      roomSchedules.find((r) => r.name === e.target.value),
                    )
                  }
                  className="w-full p-3 border content-border rounded-lg dark-card dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {roomSchedules.map((room) => (
                    <option key={room.name} value={room.name}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedRoom && (
                <div className="content-card rounded-xl shadow-lg border content-border p-4 overflow-x-auto">
                  <h3 className="text-lg font-bold dark-text mb-4">
                    {selectedRoom.name}
                  </h3>
                  <TimetableGrid
                    schedule={selectedRoom.schedule}
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
          viewType="room"
        />
      )}
    </div>
  );
}
