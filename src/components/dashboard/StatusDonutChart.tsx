import { useState } from "react";
import { PieChart as PieIcon } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { StatusSegment } from "@/lib/types";
import { cn, fmtInt, toneColor } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/Card";

/** Donut with live center label: hover or focus a segment/legend row to read its count. */
export function StatusDonutChart({ segments }: { segments: StatusSegment[] }) {
  const [active, setActive] = useState<number | null>(null);
  const total = segments.reduce((s, x) => s + x.count, 0);
  const center = active === null ? { value: fmtInt(total), label: "Orders" } : { value: fmtInt(segments[active].count), label: segments[active].label };

  return (
    <Card className="flex flex-col" aria-label="Order status distribution">
      <CardHeader title="Order Status Distribution" subtitle="Share of this month's orders" icon={<PieIcon size={16} />} />
      <div className="flex flex-1 flex-col items-center gap-4 px-4 pb-4 pt-3">
        <div className="relative h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segments}
                dataKey="count"
                nameKey="label"
                innerRadius="66%"
                outerRadius="100%"
                paddingAngle={1.5}
                stroke="none"
                startAngle={90}
                endAngle={-270}
                isAnimationActive={false}
                onMouseEnter={(_, i) => setActive(i)}
                onMouseLeave={() => setActive(null)}
              >
                {segments.map((s, i) => (
                  <Cell key={s.id} fill={toneColor(s.tone, active === null || active === i ? 1 : 0.3)} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="tnum text-[22px] font-bold leading-7 text-fg">{center.value}</span>
            <span className="text-badge font-normal text-subtle">{center.label}</span>
          </div>
        </div>

        <ul className="w-full min-w-0 flex-1 space-y-1">
          {segments.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className={cn("grid w-full grid-cols-[10px_1fr_auto_auto] items-center gap-2 rounded-btn px-2 py-1.5 text-left text-body", active === i && "bg-surface-2")}
              >
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: toneColor(s.tone) }} aria-hidden="true" />
                <span className="truncate text-muted">{s.label}</span>
                <span className="tnum font-semibold text-fg">{s.pct}%</span>
                <span className="tnum w-12 text-right text-subtle">{fmtInt(s.count)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
