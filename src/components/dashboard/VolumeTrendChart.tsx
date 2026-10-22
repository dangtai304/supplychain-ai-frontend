import { ChartColumn } from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { VolumePoint } from "@/lib/types";
import { toneColor } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/Card";

interface TipProps {
  active?: boolean;
  label?: string;
  payload?: { dataKey: string; value: number }[];
}

function Tip({ active, label, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  const vol = payload.find((p) => p.dataKey === "volumeK")?.value;
  const otif = payload.find((p) => p.dataKey === "otif")?.value;
  return (
    <div className="rounded-btn border border-line bg-surface px-3 py-2 shadow-lg">
      <p className="text-label text-fg">{label} 2026</p>
      <p className="tnum text-body text-muted">
        Volume <span className="font-semibold text-fg">{vol}K units</span>
      </p>
      <p className="tnum text-body text-muted">
        OTIF <span className="font-semibold text-fg">{otif}%</span>
      </p>
    </div>
  );
}

/** Monthly order volume (bars, left axis) against OTIF % (line, right axis). */
export function VolumeTrendChart({ data }: { data: VolumePoint[] }) {
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  return (
    <Card className="flex flex-col" aria-label="Order volume trend">
      <CardHeader
        title="Order Volume Trend"
        subtitle="Jan to Oct 2026"
        icon={<ChartColumn size={16} />}
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-4 pt-3">
        <ul className="flex w-full items-center gap-4" aria-label="Legend">
          <li className="inline-flex items-center gap-1.5 text-badge font-normal text-subtle">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: toneColor("info") }} aria-hidden="true" /> Volume (K units)
          </li>
          <li className="inline-flex items-center gap-1.5 text-badge font-normal text-subtle">
            <span className="h-0.5 w-3.5 rounded" style={{ background: toneColor("warn") }} aria-hidden="true" /> OTIF %
          </li>
        </ul>
        <p className="text-body text-subtle">
          October <span className="tnum font-semibold text-fg">{last.volumeK}K units</span>
        </p>
        <p className="text-body text-subtle">
          OTIF <span className="tnum font-semibold text-bad">{last.otif}%</span>{" "}
          <span className="tnum">({(last.otif - prev.otif).toFixed(1)} pts vs. Sep)</span>
        </p>
      </div>

      <div className="min-h-[256px] flex-1 px-2 pb-3 pt-2">
        <ResponsiveContainer width="100%" height="100%" minHeight={240}>
          <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} strokeDasharray="0" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={6} interval={0} />
            <YAxis yAxisId="vol" tickLine={false} axisLine={false} domain={[0, 140]} ticks={[0, 35, 70, 105, 140]} width={44} tickFormatter={(v) => `${v}K`} />
            <YAxis yAxisId="otif" orientation="right" tickLine={false} axisLine={false} domain={[80, 96]} ticks={[80, 84, 88, 92, 96]} width={40} tickFormatter={(v) => `${v}%`} />
            <Tooltip content={<Tip />} cursor={{ fill: "rgb(var(--brand) / 0.06)" }} />
            <Bar yAxisId="vol" dataKey="volumeK" fill={toneColor("info", 0.85)} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
            <Line
              yAxisId="otif"
              dataKey="otif"
              type="monotone"
              stroke={toneColor("warn")}
              strokeWidth={2.25}
              isAnimationActive={false}
              dot={{ r: 2.5, fill: toneColor("warn"), stroke: "rgb(var(--surface))", strokeWidth: 1 }}
              activeDot={{ r: 4.5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
