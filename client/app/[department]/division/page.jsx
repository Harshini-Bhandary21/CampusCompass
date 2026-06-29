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
import TimetableGrid from "@/app/components/dashboard/TimetableGrid";

export default function DivisionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const departmentName = params.department;
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
        `/api/coordinators/get-department?department=${departmentName}`,
      );
      const data = await response.json();
      if (data.success) {
        const dept = data.department;
        setDepartment(dept);
        setTimeSlots(dept.timetableData?.timeSlots || []);
        setConfiguration(dept.configuration || {});

        if (dept?.selectedSchedule?.scheduleData) {
          parseDivisionSchedules(dept.selectedSchedule.scheduleData, dept);
        }
      }
    } catch (error) {
      console.error("Error fetching department data:", error);
    } finally {
      setLoading(false);
    }
  };

  const parseDivisionSchedules = (scheduleData, dept) => {
    const parentMap = {};
    const mdmCfg =
      dept?.configuration?.extractedData?.mdmSlots ||
      dept?.configuration?.mdmSlots ||
      {};

    const isMdmSlotForDivision = (divKey, day, time) => {
      if (!mdmCfg) return false;
      const def =
        mdmCfg[divKey] ||
        mdmCfg[divKey?.toUpperCase()] ||
        mdmCfg[divKey?.toLowerCase()];
      if (!def) return false;
      if (Array.isArray(def)) return def.includes(time);
      if (typeof def === "string") return def === time;
      if (typeof def === "object") {
        if (def[day] && def[day] === time) return true;
        const vals = Object.values(def).flat();
        return vals.includes(time);
      }
      return false;
    };

    scheduleData.forEach((row) => {
      const batch =
        row["Div/Batch"] ||
        row["div/batch"] ||
        row.Batch ||
        row.batch ||
        row.Group ||
        row.group;

      console.log("Division/Batch:", batch, "Row:", row);
      if (!batch) return;

      const parts = batch.split(/[-_]/);
      let parent = batch;
      if (parts.length === 2) {
        const suffix = parts[1];
        if (/\d/.test(suffix)) {
          parent = `${parts[0]}_${suffix.replace(/\d+$/, "")}`;
        } else if (suffix.length === 1 && /^[A-Z]$/.test(suffix)) {
          parent = parts[0];
        }
      }

      if (!parentMap[parent]) {
        parentMap[parent] = [];
      } else if (parent === batch && parts.length === 1) {
        return;
      }

      let rowType = row.Type || row.type || "";
      const divKey = parent.split(/[-_]/)[0];
      if (
        isMdmSlotForDivision(divKey, row.Day || row.day, row.Time || row.time)
      ) {
        if ((rowType || "").toLowerCase().includes("lab")) rowType = "MDM-LAB";
        else rowType = "MDM-TH";
      }

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

    console.log("Original rows:", scheduleData.length);

    console.log(
      "Division rows:",
      Object.values(parentMap).reduce((a, b) => a + b.length, 0),
    );
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
    <div className="min-h-screen content-bg flex">
      <Sidebar
        activeTab="division"
        setActiveTab={createTabNavigator(router, departmentName)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        tabs={getDepartmentTabs(departmentName)}
      />

      <div className="flex-1 lg:ml-0">
        <DashboardNav
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          title={`${department?.name || departmentName} Department`}
          subtitle="Division Timetables"
        />
        <div className="p-4">
          {divisionSchedules.length === 0 ? (
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              <h3 className="text-xl font-bold dark-text mb-2">
                No Schedule Available
              </h3>
              <p className="dark-text-muted">
                Generate and select a schedule to view division timetables.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="content-card rounded-xl shadow-lg border content-border p-4">
                <label className="block text-sm font-medium dark-text mb-2">
                  Select Division
                </label>
                <select
                  value={selectedDivision?.name || ""}
                  onChange={(e) =>
                    setSelectedDivision(
                      divisionSchedules.find((d) => d.name === e.target.value),
                    )
                  }
                  className="w-full p-3 border content-border rounded-lg dark-card dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {divisionSchedules.map((division) => (
                    <option key={division.name} value={division.name}>
                      {division.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedDivision && (
                <div className="content-card rounded-xl shadow-lg border content-border p-4 overflow-x-auto">
                  <h3 className="text-lg font-bold dark-text mb-4">
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
