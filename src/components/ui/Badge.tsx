import type { ReactNode } from "react";
import type { Tone } from "@/lib/types";
import { cn, toneSoft } from "@/lib/utils";

export function Badge({ tone = "info", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-badge", toneSoft[tone], className)}>{children}</span>;
}
