import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import type { ActorKind, StageId, Tone, WorkflowStage } from "@/lib/types";
import { stageIcons } from "@/lib/icons";
import { useDashboard } from "@/lib/store";
import { cn, toneColor } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusDot } from "@/components/ui/StatusDot";

const actorTone: Record<ActorKind, Tone> = { agent: "ok", human: "warn", automated: "info" };
const legend: { tone: Tone; label: string }[] = [
  { tone: "ok", label: "AI Agent" },
  { tone: "warn", label: "Human Approval" },
  { tone: "info", label: "Automated Action" },
];

function StageStatusLabel({ stage }: { stage: WorkflowStage }) {
  if (stage.status === "inProgress")
    return (
      <span className="inline-flex items-center gap-1.5 text-badge text-info">
        <StatusDot tone="info" hollow /> In Progress
      </span>
    );
  if (stage.status === "needsApproval")
    return (
      <span className="inline-flex items-center gap-1.5 text-badge text-warn">
        <StatusDot tone="warn" pulse /> Needs approval
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-badge text-ok">
      <StatusDot tone="ok" pulse /> Active
    </span>
  );
}

/** Horizontal agentic orchestration pipeline. Click a stage to inspect it. */
export function WorkflowTracker({ stages, focus }: { stages: WorkflowStage[]; focus: StageId[] }) {
  const { selectedStage, selectStage } = useDashboard();
  const selected = stages.find((s) => s.id === selectedStage);

  return (
    <Card aria-label="End-to-end order flow">
      <CardHeader
        title="End-to-End Order Flow"
        subtitle="Agentic orchestration pipeline"
        action={
          <ul className="hidden flex-wrap items-center gap-x-4 gap-y-1 md:flex" aria-label="Legend">
            {legend.map((l) => (
              <li key={l.label} className="inline-flex items-center gap-1.5 text-badge font-normal text-subtle">
                <StatusDot tone={l.tone} /> {l.label}
              </li>
            ))}
          </ul>
        }
      />

      <div className="scroll-thin overflow-x-auto px-4 pb-2 pt-4">
        <ol className="flex min-w-[760px] items-stretch">
          {stages.map((s, i) => {
            const Icon = stageIcons[s.id];
            const dimmed = focus.length > 0 && !focus.includes(s.id);
            const isSel = s.id === selectedStage;
            const tone = actorTone[s.actor];
            return (
              <Fragment key={s.id}>
                <li className="flex min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => selectStage(isSel ? null : s.id)}
                    aria-pressed={isSel}
                    className={cn(
                      "group flex w-full flex-col items-center rounded-card border px-2 pb-3 pt-3 text-center transition-all",
                      isSel ? "border-brand bg-brand-soft/50" : "border-transparent hover:border-line hover:bg-surface-2",
                      dimmed && "opacity-45 hover:opacity-100",
                    )}
                  >
                    <span className="relative">
                      <span
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full"
                        style={{ background: toneColor(tone, 0.12), color: toneColor(tone), boxShadow: `inset 0 0 0 1.5px ${toneColor(tone, 0.5)}` }}
                      >
                        <Icon size={20} aria-hidden="true" />
                      </span>
                      {s.pendingApprovals ? (
                        <span
                          className="absolute -right-1.5 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[rgb(var(--amber))] px-1 text-[10px] font-bold text-[#0f172a] ring-2 ring-surface"
                          title={`${s.pendingApprovals} waiting for human approval`}
                        >
                          {s.pendingApprovals}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-2 text-label text-fg">{s.title}</span>
                    <span className="mt-0.5 line-clamp-2 min-h-[32px] text-badge font-normal text-subtle">{s.description}</span>
                    <span className="tnum mt-1.5 text-card-title text-fg">{s.metric.value}</span>
                    <span className="text-badge font-normal text-subtle">{s.metric.label}</span>
                    <span className="mt-2">
                      <StageStatusLabel stage={s} />
                    </span>
                  </button>
                </li>
                {i < stages.length - 1 && (
                  <li aria-hidden="true" className="flex w-6 shrink-0 items-start justify-center pt-[34px]">
                    <svg width="24" height="10" viewBox="0 0 24 10" className="overflow-visible">
                      <line x1="0" y1="5" x2="18" y2="5" stroke="rgb(var(--subtle))" strokeWidth="1.5" strokeDasharray="3 3" className="animate-dash" />
                      <path d="M17 1.5 L21.5 5 L17 8.5" fill="none" stroke="rgb(var(--subtle))" strokeWidth="1.5" />
                    </svg>
                  </li>
                )}
              </Fragment>
            );
          })}
        </ol>
      </div>

      {/* Selected stage detail */}
      {selected && (
        <div className="mx-4 mb-4 animate-fade-up rounded-input border border-line bg-surface-2 px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <p className="inline-flex items-center gap-1 text-label text-fg">
              {selected.title}
              <ChevronRight size={14} className="text-subtle" aria-hidden="true" />
            </p>
            {selected.detail.map((d) => (
              <p key={d.label} className="text-body text-subtle">
                {d.label} <span className="tnum font-semibold text-fg">{d.value}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 pb-4 md:hidden" aria-label="Legend">
        {legend.map((l) => (
          <li key={l.label} className="inline-flex items-center gap-1.5 text-badge font-normal text-subtle">
            <StatusDot tone={l.tone} /> {l.label}
          </li>
        ))}
      </ul>
    </Card>
  );
}
