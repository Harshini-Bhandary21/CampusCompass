import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { TimetablePreview } from "@/components/dashboard/TimetablePreview";
import { Sparkles, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/timetable-preview")({
  head: () => ({
    meta: [
      { title: "Weekly Timetable Preview — CampusCompass ATS" },
      { name: "description", content: "Interactive weekly college timetable preview and search filtering." },
    ],
  }),
  component: TimetablePreviewPage,
});

function TimetablePreviewPage() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative transition-colors duration-300 overflow-x-hidden",
      isDark
        ? "bg-[#0f1419]"
        : "bg-[#f9fafb]"
    )}>
      {/* Radial accent glow for depth in dark mode */}
      {isDark && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(60,110,113,0.06),transparent_70%)] pointer-events-none z-0" />
      )}

      {/* Back to Dashboard Link */}
      <div className="w-full max-w-[1000px] mb-4 flex justify-start z-10">
        <Link
          to="/"
          className={cn(
            "flex items-center gap-1.5 text-xs font-semibold transition select-none",
            isDark
              ? "text-[#d1d5db] hover:text-white"
              : "text-[#3c6e71]/80 hover:text-[#3c6e71]"
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
      </div>

      {/* Main Timetable Card */}
      <div className="w-full flex justify-center z-10">
        <TimetablePreview />
      </div>

      {/* Decorative sparkle in the bottom-right corner of the page */}
      <div className={cn(
        "fixed bottom-6 right-6 pointer-events-none select-none z-0 transition-all duration-300",
        isDark
          ? "text-[#3c6e71]/80 drop-shadow-[0_0_8px_rgba(60,110,113,0.5)]"
          : "text-[#3c6e71]/40"
      )}>
        <Sparkles className="h-6 w-6" />
      </div>
    </div>
  );
}
