import { useState, useEffect } from "react";
import { Menu, Search, Bell, Plus, Sun, Moon, CircleAlert, AlertTriangle, Building2, ScrollText, Trash2, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useCampusData } from "@/hooks/useCampusData";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const notifIcon = {
  conflict: CircleAlert,
  preference: AlertTriangle,
  room: Building2,
  log: ScrollText,
};

const notifColor = {
  conflict: "text-destructive bg-destructive/10",
  preference: "text-warning bg-warning/10",
  room: "text-info bg-info/10",
  log: "text-success bg-success/10",
};

export function Topbar({ onMenu, title, subtitle }: { onMenu: () => void; title: string; subtitle?: string }) {
  const { colorSchema, setColorSchema, notifications, clearNotifications, dismissNotification } = useCampusData();
  const isTeal = colorSchema === "teal";

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme");
      if (stored === "dark" || stored === "light") return stored;
      return "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <header className={cn(
      "sticky top-0 z-30 border-b shadow-sm transition-colors duration-200",
      isTeal
        ? "bg-white dark:bg-gradient-to-r dark:from-[#2a4a5e] dark:to-[#1e3a4c] border-[#e5e7eb] dark:border-[#1e3a4c]/60 text-[#1f2937] dark:text-white"
        : "bg-gradient-to-r from-[#2a4a5e] to-[#1e3a4c] border-[#1e3a4c]/60 text-white"
    )}>
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <button
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-lg lg:hidden transition",
            isTeal
              ? "text-[#1f2937] hover:bg-gray-100 dark:text-sky-100 dark:hover:bg-[#1e3a4c]/60"
              : "text-sky-100 hover:bg-[#1e3a4c]/60"
          )}
          onClick={onMenu}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className={cn(
            "truncate font-display text-lg font-bold leading-tight sm:text-xl",
            isTeal ? "text-[#1f2937] dark:text-white" : "text-white"
          )}>{title}</h1>
          {subtitle && <p className={cn(
            "hidden truncate text-xs sm:block",
            isTeal ? "text-[#6b7280] dark:text-sky-200/80" : "text-sky-200/80"
          )}>{subtitle}</p>}
        </div>

        <div className="relative hidden md:block">
          <Search className={cn(
            "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
            isTeal ? "text-[#6b7280] dark:text-sky-200/70" : "text-sky-200/70"
          )} />
          <input
            placeholder="Search..."
            className={cn(
              "h-9 w-56 rounded-lg pl-9 pr-3 text-sm outline-none transition focus:ring-1",
              isTeal
                ? "border border-[#e5e7eb] bg-white dark:border-[#475569] dark:bg-[#0f1419] focus:border-[#3c6e71] dark:focus:border-[#3caea3] focus:ring-[#3c6e71]/25 text-[#1f2937] dark:text-white placeholder-[#6b7280] dark:placeholder-sky-200/40"
                : "border border-[#475569] bg-[#0f1419] focus:border-sky-400 focus:ring-sky-400/25 text-white placeholder-sky-200/40"
            )}
          />
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-lg transition cursor-pointer border border-transparent",
            isTeal
              ? "text-[#1f2937] hover:bg-gray-100 dark:bg-[#1e293b] dark:border-[#475569] dark:text-sky-100 dark:hover:bg-[#334155]"
              : "bg-[#1e293b] border-[#475569] text-sky-100 hover:bg-[#334155]"
          )}
        >
          {theme === "light" ? (
            <Moon className="h-[18px] w-[18px]" />
          ) : (
            <Sun className="h-[18px] w-[18px]" />
          )}
        </button>

        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              "relative grid h-9 w-9 shrink-0 place-items-center rounded-lg transition cursor-pointer outline-none border border-transparent",
              isTeal
                ? "text-[#1f2937] hover:bg-gray-100 dark:bg-[#1e293b] dark:border-[#475569] dark:text-sky-100 dark:hover:bg-[#334155]"
                : "bg-[#1e293b] border-[#475569] text-sky-100 hover:bg-[#334155]"
            )}>
              <Bell className="h-[18px] w-[18px]" />
              {notifications.length > 0 && (
                <span className={cn(
                  "absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2",
                  isTeal ? "ring-white dark:ring-[#1e293b]" : "ring-[#1e293b]"
                )} />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 mr-4 z-50 bg-popover text-popover-foreground shadow-lg border border-border rounded-xl" align="end">
            <div className="flex items-center justify-between border-b border-border p-3">
              <span className="text-sm font-semibold">Notifications</span>
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="text-xs text-destructive hover:underline cursor-pointer flex items-center gap-1 font-medium border-0 bg-transparent p-0"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear all
                </button>
              )}
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
              {notifications.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground font-medium">No alerts active</p>
              ) : (
                notifications.map((n) => {
                  const Icon = notifIcon[n.category] || Bell;
                  return (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 rounded-lg border border-border/50 p-2.5 transition hover:bg-secondary/40 relative group"
                    >
                      <div className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-md", notifColor[n.category])}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-foreground">{n.title}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{n.detail}</p>
                        <span className="text-[9px] text-muted-foreground/80 mt-1 block">{n.time}</span>
                      </div>
                      <button
                        onClick={() => dismissNotification(n.id)}
                        className="opacity-0 group-hover:opacity-100 transition absolute right-2 top-2 h-5 w-5 hover:bg-secondary rounded grid place-items-center cursor-pointer text-muted-foreground hover:text-foreground border-0 bg-transparent"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Button asChild variant="default" size="sm" className={cn(
          "hidden sm:inline-flex text-white shadow-none rounded-lg border-0 h-9 font-semibold px-4",
          isTeal
            ? "bg-[#3c6e71] hover:bg-[#2e5557]"
            : "bg-[#534AB7] hover:bg-[#3C3489]"
        )}>
          <Link to="/generate">
            <Plus className="h-4 w-4" />
            Generate
          </Link>
        </Button>

        <div className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold select-none border",
          isTeal
            ? "bg-gray-100 border-[#e5e7eb] text-[#1f2937] dark:bg-[#1e293b] dark:border-[#475569] dark:text-sky-100"
            : "bg-[#1e293b] border-[#475569] text-sky-100"
        )}>
          AD
        </div>
      </div>
    </header>
  );
}
