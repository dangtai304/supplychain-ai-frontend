import { useEffect, useState } from "react";
import { Bell, Menu, Monitor, Moon, Sparkles, Sun } from "lucide-react";
import { currentUser } from "@/lib/mock-data";
import { useDashboard } from "@/lib/store";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/Button";
import { StatusDot } from "@/components/ui/StatusDot";

type ThemePref = "system" | "light" | "dark";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(t);
  }, []);
  const date = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date} ${time}`;
}

function ThemeToggle() {
  const [pref, setPref] = useState<ThemePref>("system");
  useEffect(() => {
    const root = document.documentElement;
    if (pref === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", pref);
  }, [pref]);
  const next: Record<ThemePref, ThemePref> = { system: "light", light: "dark", dark: "system" };
  const Icon = pref === "light" ? Sun : pref === "dark" ? Moon : Monitor;
  return (
    <IconButton label={`Theme: ${pref}. Switch to ${next[pref]}`} onClick={() => setPref(next[pref])}>
      <Icon size={17} />
    </IconButton>
  );
}

function LiveBadge({ status }: { status: "connecting" | "online" | "demo" }) {
  if (status === "online")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/10 px-2 py-0.5 text-badge text-ok" title="Connected to the SupplyChain AI API">
        <StatusDot tone="ok" pulse /> Live data
      </span>
    );
  if (status === "connecting")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-info/10 px-2 py-0.5 text-badge text-info" title="The API can take up to a minute to wake up">
        <StatusDot tone="info" pulse /> Connecting
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-warn/10 px-2 py-0.5 text-badge text-warn" title="API not reachable, showing bundled demo data">
      <StatusDot tone="warn" /> Demo data
    </span>
  );
}

/** Top command bar plus welcome banner and persona role switcher. */
export function Header({ title }: { title: string }) {
  const { role, setRole, setMobileNav, copilot, setCopilot, apiStatus } = useDashboard();
  const roles = useDashboard((s) => s.data.roles);
  const stamp = useClock();

  return (
    <>
      {/* Command bar */}
      <div
        className="sticky z-30 border-b border-line bg-surface/95 backdrop-blur"
        style={{ top: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex h-14 items-center gap-2 px-4 md:px-6">
          <IconButton label="Open navigation" className="lg:hidden" onClick={() => setMobileNav(true)}>
            <Menu size={18} />
          </IconButton>
          <p className="min-w-0 flex-1 truncate text-card-title text-fg">{title}</p>
          <div className="hidden items-center gap-3 text-label font-normal text-subtle sm:flex">
            <span className="tnum">{stamp}</span>
            <LiveBadge status={apiStatus} />
          </div>
          <ThemeToggle />
          <IconButton label="Notifications, 16 approvals waiting" className="relative">
            <Bell size={17} />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-bad ring-2 ring-surface" aria-hidden="true" />
          </IconButton>
          {(copilot === "closed" || copilot === "minimized") && (
            <button
              type="button"
              onClick={() => setCopilot("docked")}
              className="hidden h-8 items-center gap-1.5 rounded-btn bg-brand px-3 text-body font-semibold text-white hover:opacity-90 sm:inline-flex"
            >
              <Sparkles size={15} aria-hidden="true" /> Ask AI
            </button>
          )}
          <span
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-label text-brand-strong"
            title={currentUser.firstName}
            aria-label={`Signed in as ${currentUser.firstName}`}
          >
            {currentUser.firstName[0]}
          </span>
        </div>
      </div>

      {/* Welcome + role switcher */}
      <div className="px-4 pt-5 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div className="min-w-0">
            <h1 className="text-title text-fg" style={{ textWrap: "balance" }}>
              Welcome back, {currentUser.firstName} 👋
            </h1>
            <p className="text-body text-subtle">Your role-based AI agents are monitoring the entire supply chain and taking actions.</p>
          </div>
          <div className="flex items-center gap-2 text-label font-normal text-subtle sm:hidden">
            <LiveBadge status={apiStatus} /> <span className="tnum">{stamp}</span>
          </div>
        </div>

        <div role="radiogroup" aria-label="View as role" className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
          {roles.map((r) => {
            const active = r.id === role;
            return (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setRole(r.id)}
                className={cn(
                  "h-8 shrink-0 whitespace-nowrap rounded-full border px-3 text-body transition-colors",
                  active ? "border-brand bg-brand font-semibold text-white" : "border-line bg-surface text-muted hover:border-brand/50 hover:text-fg",
                )}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
