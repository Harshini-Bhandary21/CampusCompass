import { useState } from "react";
import {
  DocumentArrowUpIcon,
  CpuChipIcon,
  SparklesIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function FileUploadSection({
  onFileUpload,
  uploading,
  uploadProgress,
  processingSteps,
}) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (selectedFile) => {
    if (
      selectedFile &&
      (selectedFile.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        selectedFile.name.endsWith(".xlsx"))
    ) {
      setFile(selectedFile);
    } else {
      alert("Please select a valid Excel file (.xlsx)");
    }
  };

  // Replace the handleSubmit in FileUploadSection.jsx
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || uploading) return;

    onFileUpload(file); // delegate to parent — parent owns the fetch logic
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="content-card rounded-xl shadow-lg border border-secondary/20 p-4 mb-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upload Section */}
        <div className="relative">
          {/* Animated Background Gradient - Matching Topbar */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-xl"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-0 left-0 w-32 h-32 bg-primary/15 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>

          {/* Decorative SVG Elements */}
          <div className="absolute top-4 right-4 opacity-10">
            <svg
              className="w-12 h-12 text-primary"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </div>
          <div className="absolute bottom-4 left-4 opacity-10">
            <svg
              className="w-10 h-10 text-primary"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="mb-4">
              <div className="flex items-center mb-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-primary blur-lg opacity-60 rounded-2xl animate-pulse"></div>
                  <div className="relative bg-gradient-primary p-3 rounded-2xl shadow-xl">
                    <CpuChipIcon className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <h2 className="text-xl font-bold text-primary">
                    Automated Timetable Generator
                  </h2>
                  <p className="text-gray-600 text-sm font-medium">
                    Intelligent scheduling in seconds
                  </p>
                </div>
              </div>
            </div>

            {/* Download Buttons */}
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const response = await fetch("/api/generate-template");
                    if (response.ok) {
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "timetable_template.xlsx";
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    }
                  } catch (error) {
                  }
                }}
                className="relative flex-1 bg-gradient-primary text-white px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download Excel Template
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = "/Input_Guidelines.pdf";
                  a.download = "Input_Guidelines.pdf";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                className="relative flex-1 bg-gradient-primary text-white px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Input Guidelines
                </div>
              </button>
            </div>

            {/* Upload Form */}
            <form onSubmit={handleSubmit}>
              <div
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 overflow-hidden ${
                  isDragging
                    ? "border-primary bg-primary/5 scale-105 shadow-xl"
                    : "border-primary/40 bg-white/80 backdrop-blur-sm hover:border-primary hover:shadow-lg"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {/* Animated corner accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary/30 rounded-tl-2xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary/30 rounded-tr-2xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary/30 rounded-bl-2xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary/30 rounded-br-2xl"></div>

                <div className="mb-4 relative">
                  {/* Floating decorative icons */}
                  <div className="absolute -top-2 -left-2 opacity-20">
                    <svg
                      className="w-6 h-6 text-primary animate-bounce"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      style={{ animationDuration: "3s" }}
                    >
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path
                        fillRule="evenodd"
                        d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 opacity-20">
                    <svg
                      className="w-6 h-6 text-primary animate-bounce"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      style={{
                        animationDuration: "2.5s",
                        animationDelay: "0.5s",
                      }}
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>

                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-primary rounded-full blur-xl opacity-40 animate-pulse"></div>
                    <div className="relative bg-gradient-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl transform hover:scale-110 transition-transform duration-300">
                      <DocumentArrowUpIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-gray-800 mb-1">
                    Upload Your Data
                  </h3>
                  <p className="text-sm text-gray-600">
                    Drop Excel file here or click to browse
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Supports .xlsx, .xls • Max 10MB
                  </p>
                </div>

                <div className="mb-4">
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    <div
                      className={`inline-flex items-center px-6 py-3 rounded-xl border-2 text-sm font-semibold transition-all transform hover:scale-105 ${
                        file
                          ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 text-green-700 shadow-lg"
                          : "bg-gradient-to-r from-white to-gray-50 border-gray-300 text-gray-700 hover:border-primary hover:shadow-lg"
                      }`}
                    >
                      {file ? (
                        <>
                          <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500" />
                          <span className="truncate max-w-[180px]">
                            {file.name}
                          </span>
                          <svg
                            className="w-4 h-4 ml-2 text-green-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </>
                      ) : (
                        <>
                          <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                          Choose Excel File
                          <svg
                            className="w-4 h-4 ml-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </>
                      )}
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) =>
                        e.target.files[0] && handleFileSelect(e.target.files[0])
                      }
                      className="hidden"
                      required
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="relative bg-gradient-primary text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto text-sm shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:hover:scale-100 overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex items-center">
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white mr-2"></div>
                        Analyzing Inputs
                      </>
                    ) : (
                      <>
                        Upload & Analyze Timetable
                        <svg
                          className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </>
                    )}
                  </div>
                </button>

                {/* Progress */}
                {uploading && (
                  <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/20 shadow-inner relative overflow-hidden">
                    {/* Progress decoration */}
                    <div className="absolute top-0 right-0 opacity-5">
                      <svg
                        className="w-16 h-16 text-primary"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-primary mb-2 relative z-10">
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-ping"></div>
                        Analyzing Inputs
                      </span>
                      <span className="text-primary">
                        {Math.round(uploadProgress)}%
                      </span>
                    </div>
                    <div className="w-full bg-white/50 rounded-full h-3 overflow-hidden shadow-inner relative z-10">
                      <div
                        className="bg-gradient-primary h-3 rounded-full transition-all duration-500 relative overflow-hidden"
                        style={{ width: `${uploadProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                    {processingSteps.length > 0 && (
                      <div className="mt-3 space-y-1.5 relative z-10">
                        {processingSteps.slice(-2).map((step, idx) => (
                          <div
                            key={idx}
                            className="flex items-center text-xs text-gray-700 bg-white/60 p-2 rounded-lg backdrop-blur-sm"
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                            <span className="truncate font-medium">{step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right: SVG Illustration + Guidelines */}
        <div className="hidden lg:flex flex-col bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-xl p-6 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id="timetable-grid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <rect
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-primary"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#timetable-grid)" />
            </svg>
          </div>

          {/* Formatting Guidelines */}
          <div className="relative z-10 w-full bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-primary/20 shadow-lg">
            <h3 className="text-sm font-bold text-primary mb-3 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Excel Formatting Guidelines
            </h3>
            <div className="space-y-2 text-xs text-gray-700">
              <div className="flex items-start gap-2 bg-gray-50 p-2 rounded-lg">
                <span className="chart-color-1 w-2 h-2 rounded-full mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800 mb-1">
                    Batch Format:
                  </p>
                  <p>
                    <span className="font-mono bg-white px-1 rounded">
                      YearName_UniqueQuantity
                    </span>{" "}
                    (e.g., FY_A)
                  </p>
                  <p className="text-gray-600">Sub-batches: FY_A1, FY_A2</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-gray-50 p-2 rounded-lg">
                <span className="chart-color-5 w-2 h-2 rounded-full mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800 mb-1">
                    Elective Format:
                  </p>
                  <p>
                    <span className="font-mono bg-white px-1 rounded">
                      Year_ElectiveName_CourseName
                    </span>
                  </p>
                  <p className="text-gray-600">e.g., TY_PEC_AIML, TY_PEC_AIML1</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-gray-50 p-2 rounded-lg">
                <span className="chart-color-2 w-2 h-2 rounded-full mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800 mb-1">Room Types:</p>
                  <p>Theory or Lab (exact spelling)</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-gray-50 p-2 rounded-lg">
                <span className="chart-color-3 w-2 h-2 rounded-full mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800 mb-1">
                    Time Format:
                  </p>
                  <p>
                    <span className="font-mono bg-white px-1 rounded">00:00</span>{" "}
                    (24-hour clock)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-gray-50 p-2 rounded-lg text-xs">
                <span className="chart-color-6 w-2 h-2 rounded-full mt-1 shrink-0" />
                <p className="text-gray-600">
                  Note: _ and - are treated the same
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
