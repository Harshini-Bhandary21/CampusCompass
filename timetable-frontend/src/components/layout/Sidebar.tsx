import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  Users,
  GraduationCap,
  BookOpen,
  DoorOpen,
  SlidersHorizontal,
  BarChart3,
  FileText,
  Settings,
  Compass,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCampusData } from "@/hooks/useCampusData";

const nav = [
  { section: "Overview", items: [
    { label: "Dashboard", to: "/", icon: LayoutDashboard },
    { label: "Timetables", to: "/timetables", icon: CalendarDays },
    { label: "Timetable Preview", to: "/timetable-preview", icon: CalendarDays },
    { label: "Generate Timetable", to: "/generate", icon: Sparkles, highlight: true },
  ]},
  { section: "Resources", items: [
    { label: "Faculty", to: "/faculty", icon: Users },
    { label: "Students", to: "/students", icon: GraduationCap },
    { label: "Subjects", to: "/subjects", icon: BookOpen },
    { label: "Rooms", to: "/rooms", icon: DoorOpen },
    { label: "Constraints", to: "/constraints", icon: SlidersHorizontal },
  ]},
  { section: "Insights", items: [
    { label: "Analytics", to: "/analytics", icon: BarChart3 },
    { label: "Reports", to: "/reports", icon: FileText },
    { label: "Settings", to: "/settings", icon: Settings },
  ]},
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { colorSchema } = useCampusData();
  const isTeal = colorSchema === "teal";

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar border-r border-border text-sidebar-foreground transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-5">
          <Link to="/" className="flex items-center gap-3" onClick={onClose}>
            <div className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
              isTeal ? "bg-[#3c6e71]" : "bg-[#534AB7]"
            )}>
              <Compass className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold leading-tight text-sidebar-foreground">
                CampusCompass
              </p>
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#9ca3af] dark:text-sidebar-muted">
                ATS Platform
              </p>
            </div>
          </Link>
          <button
            className="grid h-8 w-8 place-items-center rounded-lg text-sidebar-muted hover:bg-sidebar-accent lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
          {nav.map((group) => (
            <div key={group.section}>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af] dark:text-sidebar-muted">
                {group.section}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        active
                          ? isTeal
                            ? "bg-[#e8f4f4] text-[#3c6e71] dark:bg-[#163638] dark:text-[#a7f3d0]"
                            : "bg-[#EEEDFE] text-[#534AB7] dark:bg-[#342a96] dark:text-[#e0e7ff]"
                          : "text-[#1f2937] hover:bg-gray-100/50 hover:text-foreground dark:text-sidebar-muted dark:hover:bg-sidebar-accent/60 dark:hover:text-sidebar-foreground",
                      )}
                    >
                      {active && (
                        <span className={cn(
                          "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full",
                          isTeal ? "bg-[#3c6e71] dark:bg-[#3caea3]" : "bg-[#534AB7] dark:bg-primary"
                        )} />
                      )}
                      <item.icon className={cn(
                        "h-[18px] w-[18px] shrink-0", 
                        active 
                          ? isTeal ? "text-[#3c6e71] dark:text-[#a7f3d0]" : "text-[#534AB7] dark:text-[#c7d2fe]"
                          : isTeal ? "text-[#1f2937] dark:text-sidebar-muted group-hover:text-[#3c6e71] dark:group-hover:text-white" : "text-[#1f2937] dark:text-sidebar-muted group-hover:text-[#534AB7] dark:group-hover:text-white"
                      )} />
                      <span className="truncate">{item.label}</span>
                      {item.highlight && (
                        <span className={cn(
                          "ml-auto rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide border dark:bg-gray-100 dark:border-gray-200/60 dark:text-gray-700",
                          isTeal
                            ? "bg-[#e8f4f4] border-[#3c6e71]/20 text-[#3c6e71]"
                            : "bg-[#EEEDFE] border-[#534AB7]/20 text-[#534AB7]"
                        )}>
                          AI
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="m-3 rounded-xl border border-[#e5e7eb] dark:border-sidebar-border bg-white dark:bg-[#111827] p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1f2937] dark:text-sidebar-foreground">
            <Sparkles className={cn("h-4 w-4", isTeal ? "text-[#3c6e71]" : "text-[#534AB7]")} />
            Optimization Score
          </div>
          <p className="mt-2 font-display text-3xl font-bold text-[#1f2937] dark:text-sidebar-foreground">95%</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#e5e7eb] dark:bg-gray-800">
            <div className={cn("h-full rounded-full", isTeal ? "bg-[#3c6e71]" : "bg-[#534AB7]")} style={{ width: "95%" }} />
          </div>
          <p className="mt-2 text-[11px] text-[#6b7280] dark:text-sidebar-muted">Last run · 3 hours ago</p>
        </div>
      </aside>
    </>
  );
}
