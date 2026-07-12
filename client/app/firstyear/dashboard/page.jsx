"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardNav from "@/app/components/shared/DashboardNav";
import Sidebar from "@/app/components/shared/Sidebar";
import FileUploadSection from "@/app/components/dashboard/FileUploadSection";
import TimetableAnalytics from "@/app/components/dashboard/TimetableAnalytics";
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
import {
  getDepartmentTabs,
  createTabNavigator,
} from "@/app/components/dashboard/DepartmentSidebarConfig";

export default function CoordinatorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const actualDepartment = "First Year";
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
        `/api/coordinators/get-department?department=${encodeURIComponent(actualDepartment)}`,
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

        // Load saved online configuration if exists
        if (data.department.onlineConfig) {
          setOnlineConfig(data.department.onlineConfig);
        }

        // Load saved faculty availability if exists
        if (data.department.facultyAvailability) {
          setFacultyAvailability(data.department.facultyAvailability);
        }
      }
    } catch (error) {
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
          const roomSheet = workbook.Sheets["Rooms"];

          const facultyData = XLSX.utils.sheet_to_json(facultySheet, {
            defval: "",
          });
          const roomData = XLSX.utils.sheet_to_json(roomSheet, { defval: "" });

          const facultyMap = {};
          facultyData.forEach((row) => {
            const name = row["Name of Faculty"];
            // Per-course weekly class hours (theory + practical/tutorial) for
            // this row; a faculty teaching multiple courses gets one row per
            // course, so these are summed below into a per-faculty total.
            const hours =
              parseFloat(row["Total"]) ||
              (parseFloat(row["TH"]) || 0) + (parseFloat(row["PR/TU"]) || 0);
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

          // There's no dedicated "batches" sheet in this workbook format — batch
          // structure is embedded in the Faculty sheet's "Division" column
          // (whole-division groups, taught Theory) and "Batch" column (small
          // lab sub-groups, taught Lab), both as comma-separated codes.
          const batchMap = new Map();
          facultyData.forEach((row) => {
            const divisions = String(row["Division"] || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            const labBatches = String(row["Batch"] || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);

            divisions.forEach((name) => {
              if (!batchMap.has(name)) batchMap.set(name, { name, type: "Theory" });
            });
            labBatches.forEach((name) => {
              if (!batchMap.has(name)) batchMap.set(name, { name, type: "Lab" });
            });
          });

          const batches = Array.from(batchMap.values());

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
    setConfigStep(3);
  };

  const decodeResultsFromAPI = (resultsObj) => {
    const processedResults = {};

    for (const [key, value] of Object.entries(resultsObj || {})) {
      try {
        const base64Data = typeof value === "string" ? value : value?.data;

        if (!base64Data) {
          continue;
        }

        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const workbook = XLSX.read(bytes, { type: "array" });

        if (!workbook?.SheetNames?.length) {
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
      }
    }

    return processedResults;
  };

  const handlePECConfirm = async () => {
    if (!uploadedFile) {
      alert("No file uploaded!");
      return;
    }

    setUploading(true);
    setShowConfig(false);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("department", actualDepartment);
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

      if (data.success) {
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
      router.push("/firstyear/schedules");
    } catch (error) {
      if (error.message && !error.message.startsWith("HTTP")) {
        toast.error(`Deploy failed: ${error.message}`, { id: toastId });
      }
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
        setActiveTab={createTabNavigator(router)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        tabs={getDepartmentTabs()}
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
                    />
                    {configStep === 1 && (
                      <OnlineConfigModal
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
                    {configStep === 3 && (
                      <ConfigReview
                        onlineConfig={onlineConfig}
                        facultyAvailability={facultyAvailability}
                        onConfirm={handlePECConfirm}
                        onBack={() => setConfigStep(2)}
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
