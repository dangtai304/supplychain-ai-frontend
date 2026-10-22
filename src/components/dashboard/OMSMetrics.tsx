import { ShoppingCart } from "lucide-react";
import type { OmsMetric } from "@/lib/types";
import { changeTone, fmtInt } from "@/lib/utils";
import { useDashboard } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Change } from "@/components/ui/Change";
import { Sparkline } from "@/components/ui/Sparkline";

export function OMSMetrics({ metrics }: { metrics: OmsMetric[] }) {
  const setNav = useDashboard((s) => s.setNav);
  return (
    <Card className="flex flex-col" aria-label="Order management metrics">
      <CardHeader
        title="Order Management (OMS)"
        subtitle="This month"
        icon={<ShoppingCart size={16} />}
        action={
          <Button variant="link" size="sm" onClick={() => setNav("orders")}>
            View All
          </Button>
        }
      />
      <ul className="mt-2 flex flex-1 flex-col divide-y divide-line px-4 pb-2">
        {metrics.map((m) => (
          <li key={m.id} className="grid grid-cols-[1fr_auto_64px] items-center gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-body text-subtle">{m.label}</p>
              <p className="tnum text-[18px] font-bold leading-6 text-fg">{fmtInt(m.value)}</p>
            </div>
            <Change value={m.changePct} higherIsBetter={m.higherIsBetter} />
            <Sparkline data={m.trend} tone={changeTone(m.changePct, m.higherIsBetter)} height={28} />
          </li>
        ))}
      </ul>
    </Card>
  );
}
