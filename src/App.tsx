import { useEffect, useMemo } from "react";
import { navGroups } from "@/lib/mock-data";
import { useDashboard } from "@/lib/store";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { KPIGrid } from "@/components/dashboard/KPICard";
import { WorkflowTracker } from "@/components/dashboard/WorkflowTracker";
import { OMSMetrics } from "@/components/dashboard/OMSMetrics";
import { StatusDonutChart } from "@/components/dashboard/StatusDonutChart";
import { ExceptionsPanel } from "@/components/dashboard/ExceptionsPanel";
import { NetworkMap } from "@/components/dashboard/NetworkMap";
import { VolumeTrendChart } from "@/components/dashboard/VolumeTrendChart";
import { AgentTray } from "@/components/dashboard/AgentTray";
import { CopilotDrawer } from "@/components/dashboard/CopilotDrawer";
import { ModulePlaceholder } from "@/components/dashboard/ModulePlaceholder";

function HomeDashboard() {
  const roleId = useDashboard((s) => s.role);
  const roomy = useDashboard((s) => s.copilot !== "docked");
  const data = useDashboard((s) => s.data);
  const role = data.roles.find((r) => r.id === roleId) ?? data.roles[0];
  const kpis = useMemo(() => role.kpis.map((id) => data.kpis[id]).filter(Boolean), [role, data]);

  return (
    <div className="flex flex-col gap-4">
      <KPIGrid kpis={kpis} roomy={roomy} />
      <WorkflowTracker stages={data.workflowStages} focus={role.focusStages} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <OMSMetrics metrics={data.omsMetrics} />
        <StatusDonutChart segments={data.statusDistribution} />
        <ExceptionsPanel categories={data.exceptionCategories} scope={role.exceptionScope} />
      </div>
      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[3fr_2fr]">
        <NetworkMap nodes={data.network.nodes} shipments={data.network.shipments} />
        <VolumeTrendChart data={data.volumeTrend} />
      </div>
      <AgentTray agents={data.agents} focus={role.focusAgents} />
    </div>
  );
}

export default function App() {
  const activeNav = useDashboard((s) => s.activeNav);
  const init = useDashboard((s) => s.init);
  useEffect(() => {
    void init();
  }, [init]);
  const title = navGroups.flatMap((g) => g.items).find((i) => i.id === activeNav)?.label ?? "Home";

  return (
    <div className="flex min-h-full items-start">
      <Sidebar />
      <main className="min-w-0 flex-1" style={{ paddingLeft: "env(safe-area-inset-left, 0px)", paddingRight: "env(safe-area-inset-right, 0px)" }}>
        <Header title={title === "Home" ? "Control Tower" : title} />
        <div className="px-4 pb-24 pt-4 md:px-6 xl:pb-8">{activeNav === "home" ? <HomeDashboard /> : <ModulePlaceholder id={activeNav} />}</div>
      </main>
      <CopilotDrawer />
      <CommandPalette />
    </div>
  );
}
