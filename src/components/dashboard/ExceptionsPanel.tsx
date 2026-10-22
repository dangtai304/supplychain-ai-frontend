import { Bot, Check, ChevronDown, Lock, Sparkles, TriangleAlert } from "lucide-react";
import type { ExceptionCategory, ExceptionId } from "@/lib/types";
import { useDashboard } from "@/lib/store";
import { cn, fmtMoney, toneBg, toneColor, toneSoft } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";

/** AI-detected exceptions with expandable rows; each order can be approved or handed to its agent. */
export function ExceptionsPanel({ categories, scope }: { categories: ExceptionCategory[]; scope: ExceptionId[] }) {
  const { expandedException, toggleException, showAllExceptions, setShowAllExceptions, resolved, resolveOrder, setNav, canAct } = useDashboard();
  const scoped = scope.length > 0 && !showAllExceptions;
  const visible = scoped ? categories.filter((c) => scope.includes(c.id)) : categories;
  const max = Math.max(...categories.map((c) => c.count));

  return (
    <Card className="flex flex-col" aria-label="Top order exceptions">
      <CardHeader
        title="Top Order Exceptions"
        subtitle={
          <span className="inline-flex items-center gap-1">
            <Sparkles size={12} aria-hidden="true" /> AI detected
          </span>
        }
        icon={<TriangleAlert size={16} />}
        action={
          <Button variant="link" size="sm" onClick={() => setNav("exceptions")}>
            View All
          </Button>
        }
      />

      <ul className="mt-2 flex flex-1 flex-col gap-1.5 px-3 pb-3">
        {visible.map((c) => {
          const open = expandedException === c.id;
          const done = c.orders.filter((o) => resolved[o.orderId]).length;
          return (
            <li key={c.id} id={`exc-${c.id}`} className={cn("overflow-hidden rounded-input border transition-colors", open ? "border-line bg-surface-2" : "border-transparent")}>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`exc-body-${c.id}`}
                onClick={() => toggleException(c.id)}
                className="grid w-full grid-cols-[4px_1fr_auto_16px] items-center gap-3 rounded-input px-2 py-2 text-left hover:bg-surface-2"
              >
                <span className={cn("h-8 w-1 rounded-full", toneBg[c.tone])} aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-body text-fg">{c.label}</span>
                  <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-line/70">
                    <span className="block h-full rounded-full" style={{ width: `${(c.count / max) * 100}%`, background: toneColor(c.tone) }} />
                  </span>
                </span>
                <span className={cn("tnum inline-flex min-w-[36px] justify-center rounded-full px-2 py-0.5 text-label", toneSoft[c.tone])}>{c.count - done}</span>
                <ChevronDown size={16} className={cn("text-subtle transition-transform", open && "rotate-180")} aria-hidden="true" />
              </button>

              {open && (
                <div id={`exc-body-${c.id}`} className="animate-fade-up space-y-2 px-3 pb-3 pt-1">
                  <p className="text-badge font-normal text-subtle">
                    Owner: <span className="font-semibold text-muted">{c.owner}</span>, showing 3 of {c.count}
                  </p>
                  {c.orders.map((o) => {
                    const state = resolved[o.orderId];
                    return (
                      <div key={o.orderId} className="rounded-input border border-line bg-surface p-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                          <p className="font-mono text-label text-fg">{o.orderId}</p>
                          <p className="tnum text-badge font-normal text-subtle">
                            {o.customer}, {fmtMoney(o.value)}
                          </p>
                        </div>
                        <p className="mt-1 text-body text-muted">{o.reason}</p>
                        <p className="mt-1.5 flex gap-1.5 text-body text-fg">
                          <Sparkles size={14} className="mt-[3px] shrink-0 text-brand" aria-hidden="true" />
                          {o.recommendation}
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {!state && !canAct(c.id) ? (
                            <span className="inline-flex h-7 items-center gap-1 text-badge font-normal text-subtle">
                              <Lock size={12} aria-hidden="true" /> View only for your role. {c.owner} or the owning team can act.
                            </span>
                          ) : state ? (
                            <span className="inline-flex h-7 items-center gap-1 rounded-btn bg-ok/10 px-2.5 text-label text-ok">
                              <Check size={14} aria-hidden="true" />
                              {state === "approved" ? "Approved, agent executing" : `Assigned to ${c.owner}`}
                            </span>
                          ) : (
                            <>
                              <Button size="sm" variant="primary" onClick={() => resolveOrder(o.orderId, "approved")}>
                                Approve fix
                              </Button>
                              <Button size="sm" onClick={() => resolveOrder(o.orderId, "assigned")}>
                                <Bot size={14} aria-hidden="true" /> Let agent decide
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {scope.length > 0 && (
        <p className="border-t border-line px-4 py-2.5 text-badge font-normal text-subtle">
          {scoped ? `Showing ${visible.length} of ${categories.length} categories for your role. ` : "Showing all categories. "}
          <button type="button" className="font-semibold text-brand hover:text-brand-strong" onClick={() => setShowAllExceptions(!showAllExceptions)}>
            {scoped ? "Show all" : "Show my categories"}
          </button>
        </p>
      )}
    </Card>
  );
}
