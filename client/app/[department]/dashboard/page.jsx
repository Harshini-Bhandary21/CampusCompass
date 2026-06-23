"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import DashboardNav from "@/app/components/shared/DashboardNav";
import Sidebar from "@/app/components/shared/Sidebar";
import FileUploadSection from "@/app/components/dashboard/FileUploadSection";
import TimetableAnalytics from "@/app/components/dashboard/TimetableAnalytics";
import PECSlotConfig from "@/app/components/scheduler/PECSlotConfig";
import ScheduleComparison from "@/app/components/dashboard/ScheduleComparison";
import LoadingSpinner from "@/app/components/shared/LoadingSpinner";
import WaitingRoom from "@/app/components/auth/WaitingRoom";
import OnlineConfigModal from "@/app/components/dashboard/OnlineConfigModal";
import FacultyAvailability from "@/app/components/dashboard/FacultyAvailability";
import ConfigTimeline from "@/app/components/dashboard/ConfigTimeline";
import ConfigReview from "@/app/components/dashboard/ConfigReview";
import VirtualExcelEditor from "@/app/components/dashboard/VirtualExcelEditor";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { DAYS } from "@/lib/constants";
import { isFYDepartment } from "@/lib/departmentUtils";
import {
  getDepartmentTabs,
  createTabNavigator,
} from "@/app/components/dashboard/DepartmentSidebarConfig";

export default function CoordinatorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const departmentName = params.department;
  const actualDepartment = decodeURIComponent(departmentName);
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [consoleOutput, setConsoleOutput] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingSteps, setProcessingSteps] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [analytics, setAnalytics] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [configStep, setConfigStep] = useState(1);
  const [facultyAvailability, setFacultyAvailability] = useState({});
  const [isStandardDept, setIsStandardDept] = useState(true);
  const [tyPecTheorySlots, setTyPecTheorySlots] = useState({});
  const [tyPecLabSlots, setTyPecLabSlots] = useState({});
  const [btechPecTheorySlots, setBtechPecTheorySlots] = useState({});
  const [btechPecLabSlots, setBtechPecLabSlots] = useState({});
  const [instituteConfig, setInstituteConfig] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [rawScheduleData, setRawScheduleData] = useState(null);
  const [onlineConfig, setOnlineConfig] = useState({});
  const [showExcelEditor, setShowExcelEditor] = useState(false);
  const [excelSheetData, setExcelSheetData] = useState(null);

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
        `/api/coordinators/get-department?department=${actualDepartment}`,
      );
      const data = await response.json();
      if (data.success) {
        setDepartment(data.department);

        // Load saved timetable data if exists
        if (data.department.timetableData) {
          setAnalytics(data.department.timetableData.analytics);
          setTimeSlots(data.department.timetableData.timeSlots);

          // Reconstruct file from base64 and extract sheets
          if (data.department.timetableData.fileData) {
            const byteCharacters = atob(data.department.timetableData.fileData);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const file = new File(
              [byteArray],
              data.department.timetableData.fileName,
              {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              },
            );
            setUploadedFile(file);

            // Extract sheets for editor
            const workbook = XLSX.read(byteArray, { type: "array" });
            const allSheets = {};
            workbook.SheetNames.forEach((sheetName) => {
              const sheet = workbook.Sheets[sheetName];
              allSheets[sheetName] = XLSX.utils.sheet_to_json(sheet, {
                defval: "",
                raw: false,
              });
            });
            setExcelSheetData(allSheets);
          }
        }

        // Load saved PEC configuration if exists
        if (data.department.pecConfig) {
          setTyPecTheorySlots(data.department.pecConfig.TY?.theory || {});
          setTyPecLabSlots(data.department.pecConfig.TY?.lab || {});
          setBtechPecTheorySlots(data.department.pecConfig.BTech?.theory || {});
          setBtechPecLabSlots(data.department.pecConfig.BTech?.lab || {});
        }

        // Load saved online configuration if exists
        if (data.department.onlineConfig) {
          setOnlineConfig(data.department.onlineConfig);
        }

        // Load saved faculty availability if exists
        if (data.department.facultyAvailability) {
          setFacultyAvailability(data.department.facultyAvailability);
        }
      }

      // Fetch institute configuration
      const configRes = await fetch("/api/admin/get-university", {
        credentials: "include",
      });
      const configData = await configRes.json();
      if (configData.success && configData.university) {
        const config =
          configData.university.configuration || configData.university;
        setInstituteConfig(config);
      }
    } catch (error) {
      console.error("Error fetching department data:", error);
    } finally {
      setLoading(false);
    }
  };

  const parseExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });

          const facultySheet = workbook.Sheets["Faculty"];
          const batchSheet = workbook.Sheets["Student"];
          const roomSheet = workbook.Sheets["Rooms"];

          const facultyData = XLSX.utils.sheet_to_json(facultySheet, {
            defval: "",
          });
          const batchData = XLSX.utils.sheet_to_json(batchSheet, {
            defval: "",
          });
          const roomData = XLSX.utils.sheet_to_json(roomSheet, { defval: "" });

          console.log("Raw batch data:", batchData.slice(0, 3)); // Debug first 3 rows

          const facultyMap = {};
          facultyData.forEach((row) => {
            const name = row["Name of Faculty"];
            const hours = parseFloat(row["Hours"]) || 0;
            if (name && name.trim()) {
              if (!facultyMap[name]) {
                facultyMap[name] = 0;
              }
              facultyMap[name] += hours;
            }
          });

          const faculty = Object.entries(facultyMap).map(([name, hours]) => ({
            name,
            hours: hours.toFixed(1),
          }));

          const batches = batchData
            .map((row) => {
              // Find batch column dynamically (handles 'Batch', 'batch', 'BATCH', etc.)
              const batchKey = Object.keys(row).find((key) =>
                key.toLowerCase().trim().includes("batch"),
              );
              const typeKey = Object.keys(row).find((key) =>
                key.toLowerCase().trim().includes("type"),
              );

              let batchName = batchKey ? row[batchKey] : null;
              let batchType = typeKey ? row[typeKey] : null;

              if (batchName && typeof batchName === "string") {
                batchName = batchName
                  .trim()
                  .replace(/\s+/g, "_")
                  .replace(/-/g, "_")
                  .replace(/[^a-zA-Z0-9_]/g, "")
                  .toUpperCase();
              }

              return {
                name: batchName,
                type: batchType,
              };
            })
            .filter((b) => b.name && b.name.length > 0);

          console.log("Parsed batches:", batches.length, batches.slice(0, 5));

          const rooms = roomData
            .map((row) => {
              const roomKey = Object.keys(row).find((key) =>
                key.toLowerCase().trim().includes("room"),
              );
              const typeKey = Object.keys(row).find((key) =>
                key.toLowerCase().trim().includes("type"),
              );
              return {
                name: roomKey ? row[roomKey] : null,
                type: typeKey ? row[typeKey] : null,
              };
            })
            .filter((r) => r.name);

          resolve({
            faculty,
            batches,
            rooms,
            totalClasses: facultyData.length,
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (uploadedFile) => {
    setUploading(true);
    setConsoleOutput("");
    setResults(null);
    setUploadProgress(0);
    setProcessingSteps([]);
    setAnalytics(null);

    const toastId = toast.loading(`Uploading ${uploadedFile.name}...`);

    try {
      // ── [unchanged] Extract all sheets for editor ──────────────────────
      const extractAllSheets = () => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const allSheets = {};
            workbook.SheetNames.forEach((sheetName) => {
              const sheet = workbook.Sheets[sheetName];
              XLSX.utils.decode_range(sheet["!ref"]);
              const jsonData = XLSX.utils.sheet_to_json(sheet, {
                defval: "",
                raw: false,
              });

              if (jsonData.length > 0) {
                const columns = Object.keys(jsonData[0]);
                columns.forEach((col) => {
                  let lastValue = null;
                  jsonData.forEach((row) => {
                    const cellValue = row[col];
                    const isEmpty =
                      cellValue === null ||
                      cellValue === undefined ||
                      cellValue === "" ||
                      (typeof cellValue === "string" &&
                        cellValue.trim() === "");
                    if (!isEmpty) lastValue = cellValue;
                    else if (lastValue !== null) row[col] = lastValue;
                  });
                });
              }
              allSheets[sheetName] = jsonData;
            });
            resolve(allSheets);
          };
          reader.readAsArrayBuffer(uploadedFile);
        });
      };

      const sheetsData = await extractAllSheets();
      setExcelSheetData(sheetsData);

      const analyticsData = await parseExcelFile(uploadedFile);
      const extractedSlots = await extractTimeSlotsFromExcel(uploadedFile);

      const fileBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(uploadedFile);
      });

      // ── [unchanged] Save raw Excel to department ───────────────────────
      const saveResponse = await fetch("/api/coordinators/get-department", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: actualDepartment,
          fileName: uploadedFile.name,
          fileData: fileBase64,
          analytics: analyticsData,
          timeSlots: extractedSlots,
        }),
      });

      const saveData = await saveResponse.json().catch(() => ({}));
      if (!saveResponse.ok || !saveData.success) {
        const msg =
          saveData?.error || saveData?.message || `HTTP ${saveResponse.status}`;
        throw new Error(msg);
      }

      setAnalytics(analyticsData);
      setTimeSlots(extractedSlots);
      setUploadedFile(uploadedFile);
      toast.success(`Uploaded & saved: ${uploadedFile.name}`, { id: toastId });
    } catch (error) {
      console.error("Upload error:", error);
      setConsoleOutput(`Error: ${error.message}`);
      toast.error(`Upload failed: ${error.message}`, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const extractTimeSlotsFromExcel = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });

          const timeSheet = workbook.Sheets["Time"];
          if (!timeSheet) {
            reject(new Error("Time sheet not found in Excel file"));
            return;
          }

          const jsonData = XLSX.utils.sheet_to_json(timeSheet, { header: 1 });

          let extractedSlots = [];
          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row && Array.isArray(row) && row.length >= 2) {
              const indexCol = row[0];
              const slotCol = row[1];

              if (
                typeof indexCol === "string" &&
                indexCol.toLowerCase().includes("index")
              )
                continue;
              if (
                typeof slotCol === "string" &&
                /\d{1,2}:\d{2}/.test(slotCol)
              ) {
                extractedSlots.push(slotCol);
              }
            }
          }

          resolve(extractedSlots);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleGenerateTimetable = () => {
    const isStandard = !isFYDepartment(actualDepartment);
    setIsStandardDept(isStandard);
    setShowConfig(true);
    setConfigStep(1);
  };

  const handleOnlineConfigSubmit = async (config) => {
    setOnlineConfig(config);
    // Save online config to database
    await fetch("/api/coordinators/get-department", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        department: actualDepartment,
        onlineConfig: config,
      }),
    });
    setConfigStep(2);
  };

  const getTYLockedSlotsByDay = () => {
    if (!instituteConfig) return {};

    const lockedByDay = {};
    const days = DAYS;

    const lunchSlots =
      instituteConfig.lunchSlots?.TY &&
      Array.isArray(instituteConfig.lunchSlots.TY)
        ? instituteConfig.lunchSlots.TY.map((slot) => slot - 1)
        : [];

    days.forEach((day) => {
      lockedByDay[day] = [...lunchSlots];
    });

    const tyMdmData = instituteConfig.mdmSlots?.TY?.mdmData?.mdmData;
    if (tyMdmData) {
      Object.keys(tyMdmData).forEach((day) => {
        const dayData = tyMdmData[day];
        if (dayData && lockedByDay[day]) {
          if (Array.isArray(dayData.lab) && dayData.lab.length > 0) {
            dayData.lab.forEach((labIndex) => {
              const idx = labIndex - 1;
              lockedByDay[day].push(idx, idx + 1);
            });
          }
          if (Array.isArray(dayData.theory) && dayData.theory.length > 0) {
            dayData.theory.forEach((theoryIndex) => {
              lockedByDay[day].push(theoryIndex - 1);
            });
          }
          lockedByDay[day] = [...new Set(lockedByDay[day])];
        }
      });
    }

    return lockedByDay;
  };

  const getBTechLockedSlotsByDay = () => {
    if (!instituteConfig) return {};

    const lockedByDay = {};
    const days = DAYS;

    const lunchSlots =
      instituteConfig.lunchSlots?.BTech &&
      Array.isArray(instituteConfig.lunchSlots.BTech)
        ? instituteConfig.lunchSlots.BTech.map((slot) => slot - 1)
        : [];

    days.forEach((day) => {
      lockedByDay[day] = [...lunchSlots];
    });

    const btechMdmData = instituteConfig.mdmSlots?.BTech?.mdmData?.mdmData;
    if (btechMdmData) {
      Object.keys(btechMdmData).forEach((day) => {
        const dayData = btechMdmData[day];
        if (dayData && lockedByDay[day]) {
          if (Array.isArray(dayData.lab) && dayData.lab.length > 0) {
            dayData.lab.forEach((labIndex) => {
              const idx = labIndex - 1;
              lockedByDay[day].push(idx, idx + 1);
            });
          }
          if (Array.isArray(dayData.theory) && dayData.theory.length > 0) {
            dayData.theory.forEach((theoryIndex) => {
              lockedByDay[day].push(theoryIndex - 1);
            });
          }
          lockedByDay[day] = [...new Set(lockedByDay[day])];
        }
      });
    }

    return lockedByDay;
  };

  const handleTYPECNext = (theoryData, labData) => {
    setTyPecTheorySlots(theoryData);
    setTyPecLabSlots(labData);
    setConfigStep(4);
  };

  const handleBTechPECNext = (theoryData, labData) => {
    setBtechPecTheorySlots(theoryData);
    setBtechPecLabSlots(labData);
    setConfigStep(5);
  };

  const handleFacultyAvailabilityNext = async (data) => {
    setFacultyAvailability(data);
    await fetch("/api/coordinators/get-department", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        department: actualDepartment,
        facultyAvailability: data,
      }),
    });
    if (isFYDepartment(actualDepartment)) {
      setConfigStep(5);
    } else {
      setConfigStep(3);
    }
  };

  const decodeResultsFromAPI = (resultsObj) => {
    const processedResults = {};

    for (const [key, value] of Object.entries(resultsObj || {})) {
      try {
        const base64Data = typeof value === "string" ? value : value?.data;

        if (!base64Data) {
          console.warn(`No base64 data for ${key}`);
          continue;
        }

        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const workbook = XLSX.read(bytes, { type: "array" });

        if (!workbook?.SheetNames?.length) {
          console.warn(`No sheets for ${key}`);
          continue;
        }

        // Try to find Overview or Complete Schedule sheet first, otherwise use first sheet
        let sheetName = workbook.SheetNames[0];
        if (workbook.SheetNames.includes("Overview")) {
          sheetName = "Overview";
        } else if (workbook.SheetNames.includes("Complete Schedule")) {
          sheetName = "Complete Schedule";
        } else if (workbook.SheetNames.includes("Full Timetable")) {
          sheetName = "Full Timetable";
        }

        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
          console.warn(`Worksheet missing for ${key}`);
          continue;
        }

        let excelData = XLSX.utils.sheet_to_json(worksheet, { defval: null });

        if (!Array.isArray(excelData)) {
          excelData =
            excelData && typeof excelData === "object" ? [excelData] : [];
        }

        if (excelData.length > 0) {
          processedResults[key] = excelData;
        }
      } catch (err) {
        console.error(`Error processing ${key}:`, err);
      }
    }

    return processedResults;
  };

  const handlePECConfirm = async () => {
    console.log("🚀 handlePECConfirm called!");
    console.log("🚀 Department:", actualDepartment);
    console.log("🚀 Uploaded file:", uploadedFile?.name);

    if (!uploadedFile) {
      alert("No file uploaded!");
      return;
    }

    setUploading(true);
    setShowConfig(false);

    try {
      await fetch("/api/coordinators/get-department", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: actualDepartment,
          tyPecTheorySlots,
          tyPecLabSlots,
          btechPecTheorySlots,
          btechPecLabSlots,
        }),
      });

      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("department", actualDepartment);

      // For standard departments (SY/TY), pass lunch and MDM slots
      if (instituteConfig?.lunchSlots) {
        formData.append(
          "lunchSlots",
          JSON.stringify(instituteConfig.lunchSlots),
        );
      }
      if (instituteConfig?.mdmSlots) {
        formData.append("mdmSlots", JSON.stringify(instituteConfig.mdmSlots));
      }
      formData.append("tyPecTheorySlots", JSON.stringify(tyPecTheorySlots));
      formData.append("tyPecLabSlots", JSON.stringify(tyPecLabSlots));
      formData.append(
        "btechPecTheorySlots",
        JSON.stringify(btechPecTheorySlots),
      );
      formData.append("btechPecLabSlots", JSON.stringify(btechPecLabSlots));
      formData.append("onlineConfig", JSON.stringify(onlineConfig));
      formData.append(
        "facultyAvailability",
        JSON.stringify(facultyAvailability),
      );

      setConsoleOutput("[INFO] Starting timetable generation...\n");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schedule`,
        {
          method: "POST",
          body: formData,
          mode: "cors",
        },
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(
          `HTTP ${response.status}: ${errorText || "Server Error"}`,
        );
      }

      const data = await response.json();

      if (!data.rows || data.rows.length === 0) {
        throw new Error("Flask returned success but no timetable rows.");
      }

      console.log("FULL FLASK RESPONSE:", data);
      console.log("ROWS:", data.rows);
      console.log("ROWS LENGTH:", data.rows?.length);

      if (data.success) {
        console.log("FULL FLASK RESPONSE:", data);
        console.log("ROWS LENGTH BEFORE SAVE:", data.rows?.length);

        if (data.success) {
          const selectedSchedule = {
            filename: `Generated_${Date.now()}.xlsx`,
            scheduleData: data.rows,
            runId: data.run_id,
            selectedAt: new Date().toISOString(),
          };

          const saveResponse = await fetch("/api/coordinators/get-department", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              department: actualDepartment,
              selectedSchedule,
            }),
          });

          const saveResult = await saveResponse.json();

          console.log("SAVE RESPONSE:", saveResult);

          if (!saveResult.success) {
            throw new Error(saveResult.error);
          }

          setResults({
            rows: data.rows,
            scheduled: data.scheduled,
            total: data.total,
            runId: data.run_id,
          });

          await fetchDepartmentData();
        }

        const saveResult = await saveResponse.json();

        console.log("SAVE RESPONSE:", saveResult);
        console.log("SAVE STATUS:", saveResponse.status);

        if (!saveResult.success) {
          throw new Error(
            saveResult.error || "Failed to save generated timetable",
          );
        }

        setResults({
          rows: data.rows,
          scheduled: data.scheduled,
          total: data.total,
          runId: data.run_id,
        });

        setConsoleOutput(`Generated ${data.scheduled}/${data.total} sessions`);

        setShowAnalyticsModal(true);

        await fetchDepartmentData();
      } else {
        setConsoleOutput(`Error: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      setConsoleOutput(`Error: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setProcessingSteps([]);
    }
  };

  const handleDownload = async (scheduleId) => {
    const scheduleKey = `schedule${scheduleId}`;
    const scheduleData = results[scheduleKey];
    if (!scheduleData) return;

    const ws = XLSX.utils.json_to_sheet(scheduleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Schedule");
    XLSX.writeFile(wb, `schedule_${scheduleId}.xlsx`);
  };

  const handleSelectSchedule = async (scheduleId) => {
    const scheduleKey = `schedule${scheduleId}`;
    const scheduleData = results?.[scheduleKey];

    if (!scheduleData) {
      toast.error("Schedule data not found. Please regenerate.");
      throw new Error("Schedule data not found");
    }

    // Only persist the parsed rows — NOT the raw base64 Excel (which can be
    // 5-15MB and blow past body / MongoDB document limits). The schedules page
    // reconstructs a downloadable Excel from the JSON data when needed.
    const toastId = toast.loading("Saving & deploying schedule...");
    try {
      const response = await fetch("/api/coordinators/get-department", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: actualDepartment,
          selectedSchedule: {
            scheduleData,
            filename: `schedule_${scheduleId}_${Date.now()}.xlsx`,
            selectedAt: new Date().toISOString(),
          },
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        const msg = data?.error || data?.message || `HTTP ${response.status}`;
        toast.error(`Deploy failed: ${msg}`, { id: toastId });
        throw new Error(msg);
      }

      toast.success("Schedule deployed!", { id: toastId });
      setResults(null);
      setConsoleOutput("");
      router.push(`/${actualDepartment}/schedules`);
    } catch (error) {
      if (error.message && !error.message.startsWith("HTTP")) {
        toast.error(`Deploy failed: ${error.message}`, { id: toastId });
      }
      console.error("Error selecting schedule:", error);
      throw error;
    }
  };

  const convertResultsToScheduleData = () => {
    if (!results) return [];
    return Object.keys(results)
      .filter((key) => Array.isArray(results[key]))
      .map((key, idx) => ({
        name: `Schedule ${String.fromCharCode(65 + idx)}`,
        slots: results[key].map((row) => ({
          day: row.Day || row.day || "",
          time: row.Time || row.time || "",
          batch: row.Batch || row.batch || "",
          course: row.Course || row.course || row.Subject || row.subject || "",
          faculty: row.Faculty || row.faculty || "",
          room: row.Room || row.room || "",
          type: row.Type || row.type || "",
        })),
      }));
  };

  if (loading || status === "loading") {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (!department) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center text-white">
          <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <p className="text-lg">Error loading department data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen content-bg flex relative">
      {uploading && <WaitingRoom />}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        activeTab="dashboard"
        setActiveTab={createTabNavigator(router, actualDepartment)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        tabs={getDepartmentTabs(actualDepartment)}
      />

      <div className="flex-1 lg:ml-0">
        <DashboardNav
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          title={`${department.name} Department`}
          subtitle={session?.user?.university}
        />
        <div className="p-2 sm:p-4">
          <div className="space-y-3 sm:space-y-4">
            {activeTab === "dashboard" && (
              <>
                <FileUploadSection
                  onFileUpload={handleFileUpload}
                  uploading={uploading}
                  uploadProgress={uploadProgress}
                  processingSteps={processingSteps}
                />
                {analytics && (
                  <>
                    <TimetableAnalytics
                      analytics={analytics}
                      onEditExcel={() => setShowExcelEditor(true)}
                    />
                    {!showConfig && (
                      <div className="flex justify-center mt-4">
                        <button
                          onClick={handleGenerateTimetable}
                          className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all"
                        >
                          Configure & Generate
                        </button>
                      </div>
                    )}
                  </>
                )}
                {showConfig && (
                  <>
                    <ConfigTimeline
                      currentStep={configStep}
                      onStepClick={setConfigStep}
                      isStandardDept={isStandardDept}
                      departmentName={actualDepartment}
                    />
                    {configStep === 1 && (
                      <OnlineConfigModal
                        department={actualDepartment}
                        onSubmit={handleOnlineConfigSubmit}
                        onCancel={() => setShowConfig(false)}
                      />
                    )}
                    {configStep === 2 && (
                      <FacultyAvailability
                        extractedData={{ analytics }}
                        onSave={handleFacultyAvailabilityNext}
                        initialData={facultyAvailability}
                        timeSlots={timeSlots}
                      />
                    )}
                    {isStandardDept && configStep === 3 && (
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-4">
                        <h3 className="text-sm font-bold text-blue-600 mb-3">
                          TY PEC Configuration
                        </h3>
                        <PECSlotConfig
                          timeSlots={timeSlots}
                          lockedSlotsByDay={getTYLockedSlotsByDay()}
                          onNext={handleTYPECNext}
                          initialTheory={tyPecTheorySlots}
                          initialLab={tyPecLabSlots}
                        />
                      </div>
                    )}
                    {isStandardDept && configStep === 4 && (
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-4">
                        <h3 className="text-sm font-bold text-purple-600 mb-3">
                          BTech PEC Configuration
                        </h3>
                        <PECSlotConfig
                          timeSlots={timeSlots}
                          lockedSlotsByDay={getBTechLockedSlotsByDay()}
                          onNext={handleBTechPECNext}
                          initialTheory={btechPecTheorySlots}
                          initialLab={btechPecLabSlots}
                        />
                      </div>
                    )}
                    {configStep === 5 && (
                      <ConfigReview
                        onlineConfig={onlineConfig}
                        facultyAvailability={facultyAvailability}
                        tyTheorySlots={tyPecTheorySlots}
                        tyLabSlots={tyPecLabSlots}
                        btechTheorySlots={btechPecTheorySlots}
                        btechLabSlots={btechPecLabSlots}
                        timeSlots={timeSlots}
                        onConfirm={handlePECConfirm}
                        onBack={() => setConfigStep(isStandardDept ? 4 : 2)}
                        isStandardDept={isStandardDept}
                      />
                    )}
                  </>
                )}
              </>
            )}

            <ScheduleComparison
              schedulesData={convertResultsToScheduleData()}
              isOpen={showAnalyticsModal}
              onClose={() => setShowAnalyticsModal(false)}
              onSelect={handleSelectSchedule}
              rawResults={rawScheduleData}
            />

            <VirtualExcelEditor
              isOpen={showExcelEditor}
              onClose={() => setShowExcelEditor(false)}
              excelData={excelSheetData}
              departmentName={actualDepartment}
              onSave={async (updatedData) => {
                try {
                  // Convert updated data back to Excel format with same structure
                  const wb = XLSX.utils.book_new();
                  Object.keys(updatedData).forEach((sheetName) => {
                    const ws = XLSX.utils.json_to_sheet(updatedData[sheetName]);
                    XLSX.utils.book_append_sheet(wb, ws, sheetName);
                  });

                  // Convert to blob and file
                  const wbout = XLSX.write(wb, {
                    bookType: "xlsx",
                    type: "array",
                  });
                  const blob = new Blob([wbout], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  });
                  const file = new File([blob], uploadedFile.name, {
                    type: blob.type,
                  });

                  // Save to database
                  const fileBase64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result.split(",")[1]);
                    reader.readAsDataURL(file);
                  });

                  const saveResponse = await fetch(
                    "/api/coordinators/get-department",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        department: actualDepartment,
                        fileName: file.name,
                        fileData: fileBase64,
                        analytics: analytics,
                        timeSlots: timeSlots,
                      }),
                    },
                  );

                  if (saveResponse.ok) {
                    // Re-parse to update analytics
                    await handleFileUpload(file);
                    setShowExcelEditor(false);
                    alert("Changes saved successfully!");
                  } else {
                    throw new Error("Failed to save to database");
                  }
                } catch (error) {
                  console.error("Error saving Excel data:", error);
                  alert("Failed to save changes: " + error.message);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
