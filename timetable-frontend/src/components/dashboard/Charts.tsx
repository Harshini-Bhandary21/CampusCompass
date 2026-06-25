import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  facultyWorkload as mockFacultyWorkload,
  roomUtilization as mockRoomUtilization,
  lectureTypeSplit as mockLectureTypeSplit,
} from "@/lib/mock-data";
import { useCampusData } from "@/hooks/useCampusData";

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--card)",
  color: "var(--card-foreground)",
  fontSize: 12,
  boxShadow: "var(--shadow-card)",
};

export function FacultyWorkloadChart() {
  const { faculty } = useCampusData();

  const chartData = useMemo(() => {
    const activeFaculty = faculty
      .filter((f) => f.load > 0)
      .sort((a, b) => b.load - a.load);

    if (activeFaculty.length === 0) {
      return mockFacultyWorkload;
    }

    // Limit to top 8 loaded faculty members for rendering clarity
    return activeFaculty.slice(0, 8).map((f) => ({
      name: f.name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.)\s+/i, ""),
      load: f.load,
      ideal: 16,
    }));
  }, [faculty]);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f9fafb" }} />
        <Legend verticalAlign="top" align="right" height={36} iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#9ca3af", paddingBottom: 15 }} />
        <Bar dataKey="ideal" fill="#a3e2d9" radius={[6, 6, 0, 0]} name="Ideal" />
        <Bar dataKey="load" fill="#1e6b65" radius={[6, 6, 0, 0]} name="Assigned" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RoomUtilizationChart() {
  const { rooms, timetables } = useCampusData();

  const chartData = useMemo(() => {
    const activeGroups = Object.keys(timetables).filter(
      (gId) => gId !== "Timetable A" && gId !== "Timetable B" && gId !== "Timetable C"
    );

    if (activeGroups.length === 0) {
      return mockRoomUtilization;
    }

    const daysList = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return daysList.map((day) => {
      let occupiedRoomSlotsCount = 0;
      for (let periodIdx = 0; periodIdx < 10; periodIdx++) {
        const occupiedRoomsInPeriod = new Set<string>();
        activeGroups.forEach((gId) => {
          const slot = timetables[gId]?.[day]?.[periodIdx];
          if (slot && slot.room) {
            occupiedRoomsInPeriod.add(slot.room);
          }
        });
        occupiedRoomSlotsCount += occupiedRoomsInPeriod.size;
      }
      const totalAvailableSlots = (rooms.length || 86) * 10;
      const utilization = Math.min(100, Math.round((occupiedRoomSlotsCount / totalAvailableSlots) * 100));
      return { day, utilization };
    });
  }, [rooms, timetables]);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--info)" stopOpacity={0.5} />
            <stop offset="100%" stopColor="var(--info)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#888888" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#888888" }} axisLine={false} tickLine={false} unit="%" />
        <Tooltip contentStyle={tooltipStyle} />
        <Area
          type="monotone"
          dataKey="utilization"
          stroke="var(--info)"
          strokeWidth={2.5}
          fill="url(#areaGrad)"
          name="Utilization"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function OptimizationTrendChart() {
  const { aiScores } = useCampusData();

  const chartData = useMemo(() => {
    const finalScore = aiScores.optimization || 95;
    return [
      { gen: "Pass 1", score: Math.round(finalScore * 0.65) },
      { gen: "Pass 2", score: Math.round(finalScore * 0.75) },
      { gen: "Pass 3", score: Math.round(finalScore * 0.85) },
      { gen: "Pass 4", score: Math.round(finalScore * 0.92) },
      { gen: "Pass 5", score: finalScore },
    ];
  }, [aiScores.optimization]);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="gen" tick={{ fontSize: 11, fill: "#888888" }} axisLine={false} tickLine={false} />
        <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: "#888888" }} axisLine={false} tickLine={false} unit="%" />
        <Tooltip contentStyle={tooltipStyle} />
        <Line
          type="monotone"
          dataKey="score"
          stroke="var(--primary)"
          strokeWidth={3}
          dot={{ r: 4, fill: "var(--primary)" }}
          activeDot={{ r: 6 }}
          name="Score"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function LectureSplitChart() {
  const { timetables } = useCampusData();

  const chartData = useMemo(() => {
    const activeGroups = Object.keys(timetables).filter(
      (gId) => gId !== "Timetable A" && gId !== "Timetable B" && gId !== "Timetable C"
    );

    if (activeGroups.length === 0) {
      return mockLectureTypeSplit;
    }

    let theoryCount = 0;
    let labCount = 0;
    let electiveCount = 0;

    activeGroups.forEach((gId) => {
      const schedule = timetables[gId];
      if (!schedule) return;
      Object.keys(schedule).forEach((day) => {
        (schedule[day] || []).forEach((slot) => {
          if (slot) {
            const typeStr = String(slot.type || "").toLowerCase();
            if (typeStr.includes("theory")) {
              theoryCount++;
            } else if (typeStr.includes("lab") || typeStr.includes("pr") || typeStr.includes("tu")) {
              labCount++;
            } else {
              electiveCount++;
            }
          }
        });
      });
    });

    const total = theoryCount + labCount + electiveCount;
    if (total === 0) {
      return mockLectureTypeSplit;
    }

    return [
      { name: "Theory", value: theoryCount, color: "var(--chart-1)" },
      { name: "Lab", value: labCount, color: "var(--chart-3)" },
      { name: "Tutorial/Other", value: electiveCount, color: "var(--chart-5)" },
    ].filter((item) => item.value > 0);
  }, [timetables]);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={56}
          outerRadius={84}
          paddingAngle={3}
          stroke="none"
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}
