import type { Tone } from "@/lib/types";
import { cn, toneBg } from "@/lib/utils";

/** Solid status dot; `pulse` adds an expanding ring for live/active states. */
export function StatusDot({ tone = "ok", pulse = false, hollow = false, className }: { tone?: Tone; pulse?: boolean; hollow?: boolean; className?: string }) {
  return (
    <span className={cn("relative inline-flex h-2 w-2 shrink-0", className)} aria-hidden="true">
      {pulse && <span className={cn("absolute inset-0 rounded-full animate-pulse-ring", toneBg[tone])} />}
      <span
        className={cn("relative inline-flex h-2 w-2 rounded-full", hollow ? "border-[1.5px] bg-transparent" : toneBg[tone])}
        style={hollow ? { borderColor: `rgb(var(--${tone}))` } : undefined}
      />
    </span>
  );
}
