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
import TimetableGrid from "@/app/components/dashboard/TimetableGrid";
import IconBadge from "@/app/components/dashboard/IconBadge";
import { Squares2X2Icon } from "@heroicons/react/24/outline";

export default function DivisionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const departmentName = "First Year";
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [divisionSchedules, setDivisionSchedules] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState(null);
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
          parseDivisionSchedules(dept.selectedSchedule.scheduleData);
        }
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const parseDivisionSchedules = (scheduleData) => {
    const parentMap = {};

    scheduleData.forEach((row) => {
      if (!row.Division && !row.division) {
      }

      const batch =
        row["Div/Batch"] ||
        row["div/batch"] ||
        row.Batch ||
        row.batch ||
        row.Group ||
        row.group;

      const parent = row.Division || row.division || batch;

      if (!parentMap[parent]) {
        parentMap[parent] = [];
      }

      const rowType = row.Type || row.type || "";

      parentMap[parent].push({
        day: row.Day || row.day,
        time: row.Time || row.time,
        course: row.Course || row.course || row.Subject || row.subject,
        faculty: row.Faculty || row.faculty,
        room: row.Room || row.room,
        type: rowType,
        batch: batch,
      });
    });

    const divisionList = Object.keys(parentMap).map((name) => ({
      name,
      schedule: parentMap[name],
    }));

    setDivisionSchedules(divisionList);
    if (divisionList.length > 0) {
      setSelectedDivision(divisionList[0]);
    }
  };

  const getColorForSlot = (slot) => {
    const hash = (slot.course || "")
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (loading || status === "loading") {
    return <LoadingSpinner message="Loading division schedules..." />;
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar
        activeTab="division"
        setActiveTab={createTabNavigator(router)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        tabs={getDepartmentTabs()}
      />

      <div className="flex-1 lg:ml-0">
        <DashboardNav
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          title={`${department?.name || departmentName} Department`}
          subtitle="Division Timetables"
        />
        <div className="p-4">
          {divisionSchedules.length === 0 ? (
            <div className="dashboard-empty-state">
              <div className="flex justify-center mb-4">
                <IconBadge icon={Squares2X2Icon} size="lg" />
              </div>
              <h3 className="dashboard-empty-title">
                No Schedule Available
              </h3>
              <p className="dashboard-empty-text">
                Generate and select a schedule to view division timetables.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="dashboard-panel">
                <label className="dashboard-label">
                  <IconBadge icon={Squares2X2Icon} />
                  Select Division
                </label>
                <select
                  value={selectedDivision?.name || ""}
                  onChange={(e) =>
                    setSelectedDivision(
                      divisionSchedules.find((d) => d.name === e.target.value),
                    )
                  }
                  className="dashboard-select focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {divisionSchedules.map((division) => (
                    <option key={division.name} value={division.name}>
                      {division.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedDivision && (
                <div className="dashboard-panel dashboard-panel-scroll">
                  <h3 className="dashboard-panel-title">
                    {selectedDivision.name} ({selectedDivision.schedule.length}{" "}
                    classes)
                  </h3>
                  <TimetableGrid
                    schedule={selectedDivision.schedule}
                    timeSlots={timeSlots}
                    configuration={configuration}
                    getColorForSlot={getColorForSlot}
                    showLunchBreak={true}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
