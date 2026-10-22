import { Boxes, ChevronsLeft, ChevronsRight, Search, X } from "lucide-react";
import { navGroups } from "@/lib/mock-data";
import { navIcons } from "@/lib/icons";
import { useDashboard } from "@/lib/store";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/Button";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

/** Left navigation: 240px expanded, 72px icon rail when collapsed, off-canvas drawer below lg. */
export function Sidebar() {
  const { activeNav, setNav, sidebarCollapsed: collapsed, toggleSidebar, mobileNavOpen, setMobileNav, setPalette, setCopilot } = useDashboard();

  const body = (mobile: boolean) => {
    const narrow = collapsed && !mobile;
    return (
      <div className="flex h-full flex-col bg-nav text-nav-fg">
        {/* Brand */}
        <div className={cn("flex items-center gap-2.5 px-4 pb-3 pt-4", narrow && "justify-center px-0")}>
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-input bg-[rgb(var(--amber))] text-[#0f172a]">
            <Boxes size={18} strokeWidth={2.25} aria-hidden="true" />
          </span>
          {!narrow && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-card-title text-nav-fg">SupplyChain AI</p>
              <p className="truncate text-badge font-normal text-nav-muted">Agentic Operating System</p>
            </div>
          )}
          {mobile && (
            <IconButton label="Close navigation" tone="nav" onClick={() => setMobileNav(false)}>
              <X size={18} />
            </IconButton>
          )}
        </div>

        {/* Search */}
        <div className={cn("px-3 pb-2", narrow && "flex justify-center px-0")}>
          {narrow ? (
            <IconButton label="Search (Ctrl+K)" tone="nav" onClick={() => setPalette(true)}>
              <Search size={18} />
            </IconButton>
          ) : (
            <button
              type="button"
              onClick={() => setPalette(true)}
              className="flex h-9 w-full items-center gap-2 rounded-input border border-white/10 bg-nav-2 px-2.5 text-body text-nav-muted transition-colors hover:border-white/20"
            >
              <Search size={16} aria-hidden="true" />
              <span className="flex-1 text-left">Search</span>
              <kbd className="rounded border border-white/15 px-1.5 font-sans text-badge text-nav-muted">{isMac ? "⌘K" : "Ctrl K"}</kbd>
            </button>
          )}
        </div>

        {/* Nav */}
        <nav aria-label="Main" className="scroll-thin flex-1 overflow-y-auto px-2 pb-3">
          {navGroups.map((g) => (
            <div key={g.label} className="mt-3 first:mt-1">
              {!narrow && <p className="px-3 pb-1 text-badge text-nav-muted/80">{g.label}</p>}
              {narrow && <div className="mx-4 mb-1 border-t border-white/10" />}
              <ul className="flex flex-col gap-0.5">
                {g.items.map((item) => {
                  const Icon = navIcons[item.id];
                  const active = activeNav === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        title={narrow ? item.label : undefined}
                        aria-current={active ? "page" : undefined}
                        onClick={() => {
                          if (item.id === "ask") setCopilot("docked");
                          setNav(item.id === "ask" ? activeNav : item.id);
                        }}
                        className={cn(
                          "relative flex h-9 w-full items-center gap-2.5 rounded-btn px-3 text-body transition-colors",
                          narrow && "justify-center px-0",
                          active ? "bg-nav-2 font-semibold text-nav-fg" : "text-nav-muted hover:bg-nav-2/60 hover:text-nav-fg",
                        )}
                      >
                        {active && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r bg-[rgb(var(--amber))]" aria-hidden="true" />}
                        <Icon size={17} aria-hidden="true" className="shrink-0" />
                        {!narrow && <span className="flex-1 truncate text-left">{item.label}</span>}
                        {!narrow && item.badge && (
                          <span className="rounded bg-[rgb(var(--amber))] px-1.5 text-[10px] font-bold leading-4 text-[#0f172a]">{item.badge}</span>
                        )}
                        {narrow && item.badge && <span className="absolute right-3 top-1.5 h-1.5 w-1.5 rounded-full bg-[rgb(var(--amber))]" aria-hidden="true" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Collapse */}
        {!mobile && (
          <div className={cn("border-t border-white/10 p-2", narrow && "flex justify-center")}>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn("flex h-8 items-center gap-2 rounded-btn px-3 text-body text-nav-muted hover:bg-nav-2 hover:text-nav-fg", narrow ? "w-8 justify-center px-0" : "w-full")}
            >
              {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
              {!narrow && "Collapse"}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <aside
        className={cn("sticky top-0 hidden h-screen shrink-0 transition-[width] duration-200 lg:block", collapsed ? "w-[72px]" : "w-60")}
        style={{ paddingLeft: "env(safe-area-inset-left, 0px)", background: "rgb(var(--nav))" }}
      >
        {body(false)}
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-black/50" onClick={() => setMobileNav(false)} />
          <div
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-slide-in shadow-xl"
            style={{ paddingLeft: "env(safe-area-inset-left, 0px)", paddingTop: "env(safe-area-inset-top, 0px)", background: "rgb(var(--nav))" }}
          >
            {body(true)}
          </div>
        </div>
      )}
    </>
  );
}
