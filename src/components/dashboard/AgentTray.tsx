import { Bot } from "lucide-react";
import type { Agent, AgentHealth, AgentId, Tone } from "@/lib/types";
import { agentIcons } from "@/lib/icons";
import { useDashboard } from "@/lib/store";
import { cn, fmtInt, toneSoft } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusDot } from "@/components/ui/StatusDot";

const healthTone: Record<AgentHealth, Tone> = { active: "ok", degraded: "warn", paused: "bad" };
const healthLabel: Record<AgentHealth, string> = { active: "Active", degraded: "Degraded", paused: "Paused" };

/** Always-on specialized agents. Agents owned by the current persona are marked "Yours". */
export function AgentTray({ agents, focus }: { agents: Agent[]; focus: AgentId[] }) {
  const { setCopilot, sendMessage } = useDashboard();
  const totalActions = agents.reduce((s, a) => s + a.actionsToday, 0);
  return (
    <Card aria-label="Specialized AI agents">
      <CardHeader
        title="Specialized AI Agents"
        subtitle="Role-based and always on"
        icon={<Bot size={16} />}
        action={
          <p className="text-badge font-normal text-subtle">
            <span className="tnum font-semibold text-fg">{fmtInt(totalActions)}</span> actions today
          </p>
        }
      />
      <ul className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {agents.map((a) => {
          const Icon = agentIcons[a.id];
          const mine = focus.includes(a.id);
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => {
                  setCopilot("docked");
                  sendMessage(`What has the ${a.name} done today?`);
                }}
                className={cn(
                  "flex h-full w-full flex-col rounded-input border p-3 text-left transition-colors hover:border-brand/60",
                  mine ? "border-brand/50 bg-brand-soft/40" : "border-line bg-surface",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-input bg-surface-2 text-brand">
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-label text-fg">{a.name}</span>
                    <span className="block truncate text-badge font-normal text-subtle">{a.scope}</span>
                  </span>
                </span>
                <span className="mt-3 flex items-center gap-2">
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-badge", toneSoft[healthTone[a.health]])}>
                    <StatusDot tone={healthTone[a.health]} pulse={a.health === "active"} /> {healthLabel[a.health]}
                  </span>
                  {mine && <span className="rounded-full bg-brand px-2 py-0.5 text-badge text-white">Yours</span>}
                  <span className="tnum ml-auto whitespace-nowrap text-badge font-normal text-subtle">{fmtInt(a.actionsToday)} actions</span>
                </span>
                <span className="mt-2 line-clamp-2 text-badge font-normal text-muted">{a.lastAction}</span>
                {a.pendingApprovals > 0 && (
                  <span className="mt-2 inline-flex items-center gap-1.5 text-badge text-warn">
                    <StatusDot tone="warn" /> {a.pendingApprovals} awaiting approval
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
