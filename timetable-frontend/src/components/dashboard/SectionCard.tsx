import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionCard({
  children,
  className,
  title,
  subtitle,
  icon,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border border-border/70 bg-card shadow-card", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            {icon && (
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && <h3 className="truncate font-display text-sm font-semibold">{title}</h3>}
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
