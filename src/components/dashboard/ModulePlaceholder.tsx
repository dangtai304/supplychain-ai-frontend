import { ArrowLeft, Sparkles } from "lucide-react";
import { navGroups } from "@/lib/mock-data";
import { navIcons } from "@/lib/icons";
import { useDashboard } from "@/lib/store";
import type { NavId } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/** Empty state for modules outside this build's scope (only Home is specified). */
export function ModulePlaceholder({ id }: { id: NavId }) {
  const { setNav, setCopilot, sendMessage } = useDashboard();
  const item = navGroups.flatMap((g) => g.items).find((i) => i.id === id)!;
  const Icon = navIcons[id];
  return (
    <Card className="mx-auto mt-6 flex max-w-xl flex-col items-center px-6 py-12 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-card bg-brand-soft text-brand">
        <Icon size={22} aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-title text-fg">{item.label}</h2>
      <p className="mt-1 max-w-sm text-body text-subtle">
        This module's workspace isn't built yet. The Home control tower already covers its KPIs and exceptions, and the assistant can answer questions about it now.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={() => setNav("home")}>
          <ArrowLeft size={15} aria-hidden="true" /> Back to Home
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            setCopilot("docked");
            sendMessage(`Give me a ${item.label.toLowerCase()} update`);
          }}
        >
          <Sparkles size={15} aria-hidden="true" /> Ask about {item.label}
        </Button>
      </div>
    </Card>
  );
}
