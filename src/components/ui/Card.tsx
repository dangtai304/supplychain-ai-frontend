import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children, as: Tag = "section", ...rest }: { className?: string; children: ReactNode; as?: "section" | "div" | "article"; "aria-label"?: string }) {
  return (
    <Tag className={cn("rounded-card border border-line bg-surface", className)} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, action, icon }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-3 px-4 pt-4">
      <div className="flex min-w-0 items-start gap-2">
        {icon && <span className="mt-0.5 text-subtle">{icon}</span>}
        <div className="min-w-0">
          <h2 className="text-card-title text-fg">{title}</h2>
          {subtitle && <p className="text-body text-subtle">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
