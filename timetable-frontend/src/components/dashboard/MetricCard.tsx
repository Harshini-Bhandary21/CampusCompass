import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendDir?: "up" | "down";
  accent?: "primary" | "info" | "success" | "warning" | "destructive";
  index?: number;
}

const accentMap: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  primary: "text-[#134e4a] bg-[#ccfbf1] dark:bg-teal-500/20 dark:text-teal-400",
  info: "text-[#064e3b] bg-[#d1fae5] dark:bg-emerald-500/20 dark:text-emerald-400",
  success: "text-[#78350f] bg-[#fef3c7] dark:bg-amber-500/20 dark:text-amber-400",
  warning: "text-[#5b21b6] bg-[#ede9fe] dark:bg-violet-500/20 dark:text-violet-400",
  destructive: "text-[#881337] bg-[#ffe4e6] dark:bg-rose-500/25 dark:text-rose-400",
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  trendDir = "up",
  accent = "primary",
  index = 0,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
        accent === "destructive" && "border-l-4 border-l-[#e11d48] bg-rose-500/[0.02] dark:bg-rose-950/15"
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn("grid h-11 w-11 place-items-center rounded-xl", accentMap[accent])}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-bold",
              accent === "destructive"
                ? "bg-[#ffe4e6] text-[#e11d48] dark:bg-rose-500/20 dark:text-rose-400"
                : "bg-[#d1fae5] text-[#059669] dark:bg-emerald-500/20 dark:text-emerald-400",
            )}
          >
            {trendDir === "up" ? "▲" : "▼"} {trend}
          </span>
        )}
      </div>
      <p className={cn(
        "mt-4 font-display text-3xl font-bold tracking-tight text-[#1f2937] dark:text-card-foreground",
        accent === "destructive" && "text-[#e11d48] dark:text-rose-400"
      )}>
        {value}
      </p>
      <p className="mt-1 text-sm font-semibold tracking-wide text-[#6b7280] dark:text-[#94a3b8]">{label}</p>
    </motion.div>
  );
}
