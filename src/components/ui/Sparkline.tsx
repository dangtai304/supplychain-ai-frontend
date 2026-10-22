import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import type { Tone } from "@/lib/types";
import { toneColor } from "@/lib/utils";

/** Mini trend line: soft area fill, emphasized endpoint, no axes. */
export function Sparkline({ data, tone, height = 32, className }: { data: number[]; tone: Tone; height?: number; className?: string }) {
  const gid = useId().replace(/:/g, "");
  const points = data.map((v, i) => ({ i, v }));
  const last = points.length - 1;
  return (
    <div className={className} style={{ height }} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 4, right: 4, bottom: 2, left: 0 }}>
          <defs>
            <linearGradient id={`sp-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={toneColor(tone, 0.25)} />
              <stop offset="100%" stopColor={toneColor(tone, 0)} />
            </linearGradient>
          </defs>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Area
            type="monotone"
            dataKey="v"
            stroke={toneColor(tone)}
            strokeWidth={1.75}
            fill={`url(#sp-${gid})`}
            isAnimationActive={false}
            dot={(p: { index?: number; cx?: number; cy?: number }) =>
              p.index === last ? <circle key="end" cx={p.cx} cy={p.cy} r={2.75} fill={toneColor(tone)} stroke="rgb(var(--surface))" strokeWidth={1.5} /> : <g key={p.index} />
            }
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
