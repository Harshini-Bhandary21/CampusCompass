import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T | string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
}: {
  columns: Column<T>[];
  data: T[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/70">
            {columns.map((c) => (
              <th
                key={String(c.key)}
                className={cn("px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground", c.className)}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-border/40 transition hover:bg-secondary/40 last:border-0">
              {columns.map((c) => (
                <td key={String(c.key)} className={cn("px-4 py-3.5 align-middle", c.className)}>
                  {c.render ? c.render(row) : String(row[c.key as keyof T])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Optimal: "bg-[#E1F5EE] text-[#0F6E56]",
    Active: "bg-[#E1F5EE] text-[#0F6E56]",
    Underloaded: "bg-[#F1EFE8] text-[#5F5E5A]",
    Overloaded: "bg-[#FCEBEB] text-[#A32D2D]",
    Overbooked: "bg-[#FCEBEB] text-[#A32D2D]",
    Theory: "bg-[#EEEDFE] text-[#3C3489]",
    Lab: "bg-[#E1F5EE] text-[#0F6E56]",
    Elective: "bg-[#FAEEDA] text-[#854F0B]",
  };
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", map[status] ?? "bg-[#F1EFE8] text-[#5F5E5A]")}>
      {status}
    </span>
  );
}
