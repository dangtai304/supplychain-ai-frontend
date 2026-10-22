import type { Kpi } from "@/lib/types";
import { changeTone, cn } from "@/lib/utils";
import { Change } from "@/components/ui/Change";
import { Sparkline } from "@/components/ui/Sparkline";

export function KPICard({ kpi }: { kpi: Kpi }) {
  const tone = changeTone(kpi.changePct, kpi.higherIsBetter);
  return (
    <article className="flex min-w-0 flex-col rounded-card border border-line bg-surface p-4" aria-label={kpi.title}>
      <h3 className="line-clamp-2 min-h-[32px] text-label text-subtle">{kpi.title}</h3>
      <p className="tnum mt-1 text-kpi text-fg">{kpi.value}</p>
      <p className="flex flex-wrap items-center gap-x-1.5 text-badge font-normal text-subtle">
        <Change value={kpi.changePct} higherIsBetter={kpi.higherIsBetter} />
        {kpi.period}
      </p>
      <Sparkline data={kpi.trend} tone={tone} className="-mx-1 mt-2" height={32} />
    </article>
  );
}

/** Six-up KPI row. `roomy` = the main stage has the full width (copilot not docked). */
export function KPIGrid({ kpis, roomy }: { kpis: Kpi[]; roomy: boolean }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3", roomy ? "xl:grid-cols-6" : "min-[1760px]:grid-cols-6")}>
      {kpis.map((k) => (
        <KPICard key={k.id} kpi={k} />
      ))}
    </div>
  );
}
