import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { changeTone, cn, fmtPct, toneText } from "@/lib/utils";

/** Percentage change with direction arrow, colored by whether the move is good. */
export function Change({ value, higherIsBetter, className }: { value: number; higherIsBetter: boolean; className?: string }) {
  const tone = changeTone(value, higherIsBetter);
  const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("tnum inline-flex items-center gap-0.5 text-label", toneText[tone], className)}>
      <Icon size={14} strokeWidth={2.25} aria-hidden="true" />
      {fmtPct(value)}
      <span className="sr-only">{tone === "ok" ? "(favorable)" : "(unfavorable)"}</span>
    </span>
  );
}
