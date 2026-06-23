"use client";

import React from "react";
import { DAYS } from "../../../lib/constants";

export default function TimetableGrid({
  schedule = [],
  timeSlots = [],
  configuration = {},
  onSlotClick,
  getColorForSlot,
  showLunchBreak = false,
}) {
  // Monday-Friday scheduler (no Saturday)
  const days = DAYS;

  const slotTimes = {};
  const timeToSlot = {};
  timeSlots.forEach((t, idx) => {
    const slotIndex = idx + 1;
    slotTimes[slotIndex] = t;
    timeToSlot[t] = slotIndex;
  });

  const grid = {};
  days.forEach((day) => {
    grid[day] = {};
    for (let i = 1; i <= timeSlots.length; i++) {
      grid[day][i] = null;
    }
  });

  let lunchBreakSlot = null;
  const cfg = configuration || {};
  if (cfg.lunchSlots) {
    if (Array.isArray(cfg.lunchSlots)) {
      const found = cfg.lunchSlots.find(
        (x) => typeof x === "string" && timeToSlot[x],
      );
      if (found) lunchBreakSlot = timeToSlot[found];
    } else if (typeof cfg.lunchSlots === "string") {
      if (timeToSlot[cfg.lunchSlots])
        lunchBreakSlot = timeToSlot[cfg.lunchSlots];
    } else if (typeof cfg.lunchSlots === "object") {
      const values = Object.values(cfg.lunchSlots);
      for (const v of values) {
        if (typeof v === "string" && timeToSlot[v]) {
          lunchBreakSlot = timeToSlot[v];
          break;
        }
        if (
          Array.isArray(v) &&
          v.length > 0 &&
          typeof v[0] === "string" &&
          timeToSlot[v[0]]
        ) {
          lunchBreakSlot = timeToSlot[v[0]];
          break;
        }
      }
    }
  } else if (cfg.lunchSlot) {
    if (typeof cfg.lunchSlot === "number") lunchBreakSlot = cfg.lunchSlot;
    if (typeof cfg.lunchSlot === "string" && timeToSlot[cfg.lunchSlot])
      lunchBreakSlot = timeToSlot[cfg.lunchSlot];
  }

  const isLabType = (type = "") => {
    if (!type) return false;
    const t = String(type).toLowerCase();
    return t.includes("lab") || t.includes("practical");
  };

  // Normalize day names to full format
  const dayMap = {
    Mon: "Monday",
    Monday: "Monday",
    Tue: "Tuesday",
    Tuesday: "Tuesday",
    Wed: "Wednesday",
    Wednesday: "Wednesday",
    Thu: "Thursday",
    Thursday: "Thursday",
    Fri: "Friday",
    Friday: "Friday",
    Sat: "Saturday",
    Saturday: "Saturday",
  };

  // In TimetableGrid.jsx — update the normalized mapping (around line 105)
  const normalized = schedule.map((row) => {
    const rawDay = row.Day || row.day;
    const normalizedDay = dayMap[rawDay] || rawDay;

    return {
      day: normalizedDay,
      time: row.Time || row.time,
      // ↓ Add 'Div/Batch' here — this is what Flask returns
      batch:
        row["Div/Batch"] || row.Batch || row.batch || row.Group || row.group,
      course: row.Course || row.course || row.Subject || row.subject,
      faculty: row.Faculty || row.faculty,
      room: row.Room || row.room || "",
      type: row.Type || row.type,
    };
  });

  console.log("TimetableGrid - Schedule items:", schedule.length);
  console.log("TimetableGrid - Normalized items:", normalized.length);
  console.log("TimetableGrid - Sample normalized:", normalized[0]);

  normalized.forEach((slot) => {
    if (!slot || !slot.day || !slot.time) return;

    if (
      (slot.type || "").toLowerCase().includes("lunch") ||
      (slot.type || "").toLowerCase().includes("break")
    ) {
      const idx = timeToSlot[slot.time];
      if (idx) lunchBreakSlot = idx;
      return;
    }

    let times = [];
    if (
      typeof slot.time === "string" &&
      (slot.time.includes("&") ||
        slot.time.includes(",") ||
        slot.time.includes("/"))
    ) {
      times = slot.time
        .split(/[&,/]/)
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      times = [slot.time];
    }

    const primaryTime = times[0];
    const slotIndex = timeToSlot[primaryTime];

    if (!slotIndex || !grid[slot.day]) return;

    const labFlag = isLabType(slot.type) && times.length > 1;
    const rowSpan = times.length;
    if (!grid[slot.day][slotIndex]) grid[slot.day][slotIndex] = [];
    grid[slot.day][slotIndex].push({
      ...slot,
      isLab: labFlag,
      spanStart: true,
      rowSpan,
    });

    if (labFlag) {
      for (let i = 1; i < rowSpan; i++) {
        const next = slotIndex + i;
        if (next <= timeSlots.length) {
          if (!grid[slot.day][next]) grid[slot.day][next] = [];
          grid[slot.day][next].push({
            ...slot,
            isLab: labFlag,
            spanStart: false,
            rowSpan,
          });
        }
      }
    }
  });

  return (
    <table className="w-full border-collapse min-w-[800px] timetable-grid">
      <thead>
        <tr className="bg-gradient-primary">
          <th className="border timetable-border p-2 text-white font-semibold text-sm w-24">
            Time
          </th>
          {days.map((day) => (
            <th
              key={day}
              className="border timetable-border p-2 text-white font-semibold text-sm"
              style={{ width: `${100 / 6}%` }}
            >
              {day}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: timeSlots.length }, (_, i) => i + 1).map(
          (index) => {
            if (index === lunchBreakSlot && showLunchBreak) {
              return (
                <tr key={`lunch-${index}`} className="h-16 bg-amber-50">
                  <td className="border timetable-border p-2 timetable-header font-medium text-xs timetable-text w-24">
                    {slotTimes[index]}
                  </td>
                  <td
                    colSpan={6}
                    className="border timetable-border p-2 text-center"
                  >
                    <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg p-2 font-semibold text-amber-800 shadow-sm">
                      🍽️ LUNCH BREAK
                    </div>
                  </td>
                </tr>
              );
            }

            return (
              <tr key={index} className="h-16">
                <td className="border timetable-border p-2 timetable-header font-medium text-xs timetable-text w-24">
                  {slotTimes[index]}
                </td>
                {days.map((day) => {
                  const cells = grid[day]?.[index];
                  if (!cells || cells.length === 0) {
                    return (
                      <td
                        key={`${day}-${index}`}
                        className="border timetable-border p-2 timetable-cell h-16"
                      >
                        <div className="text-center text-gray-500 text-xs h-full flex items-center justify-center">
                          -
                        </div>
                      </td>
                    );
                  }

                  const starters = cells.filter((s) => s.spanStart);
                  if (starters.length === 0) {
                    return null;
                  }

                  const first = starters[0];
                  const lab = first.isLab;
                  const span = first.rowSpan || 1;

                  return (
                    <td
                      key={`${day}-${index}`}
                      className="border timetable-border p-2 timetable-cell h-16"
                      rowSpan={span}
                    >
                      <div
                        className="grid gap-1 h-full"
                        style={{
                          gridTemplateColumns: `repeat(${Math.min(starters.length, 2)}, 1fr)`,
                        }}
                      >
                        {starters.map((slot, idx) => {
                          const colorScheme = getColorForSlot
                            ? getColorForSlot(slot)
                            : { slot: "slot-amber", tag: "slot-tag-amber" };
                          return (
                            <div
                              key={idx}
                              onClick={() =>
                                onSlotClick?.(slot, day, slot.time)
                              }
                              className={`text-xs p-1 rounded border ${colorScheme.slot} ${onSlotClick ? "cursor-pointer hover:opacity-80" : ""} transition-opacity flex flex-col justify-center`}
                            >
                              {slot.batch && (
                                <div className="font-semibold text-[10px]">
                                  {slot.batch}
                                </div>
                              )}
                              <div
                                className={
                                  slot.batch
                                    ? "mt-0.5 text-[10px]"
                                    : "font-semibold text-[10px]"
                                }
                              >
                                {slot.course}
                              </div>
                              {slot.faculty && (
                                <div className="mt-0.5 text-[9px]">
                                  {slot.faculty}
                                </div>
                              )}
                              {slot.room && (
                                <div className="mt-0.5 text-[9px]">
                                  {slot.room}
                                </div>
                              )}
                              <span
                                className={`px-1 py-0.5 rounded text-[8px] font-medium ${colorScheme.tag} mt-0.5`}
                              >
                                {slot.type}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          },
        )}
      </tbody>
    </table>
  );
}
