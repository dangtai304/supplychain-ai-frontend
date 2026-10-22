import { create } from "zustand";
import type { ChatMessage, ExceptionId, NavId, NodeKind, RoleId, StageId } from "./types";
import * as mock from "./mock-data";
import { api, API_URL, ApiError, type DashboardData, type Me } from "./api";
import { authEnabled } from "./supabase";

export type CopilotMode = "docked" | "fullscreen" | "minimized" | "closed";
export type MapLayer = NodeKind | "inTransit" | "atRisk";
/** online = backend reachable; demo = no backend configured or unreachable (bundled data) */
export type ApiStatus = "connecting" | "online" | "demo";

const localData: DashboardData = {
  roles: mock.roles,
  kpis: mock.kpiCatalog,
  workflowStages: mock.workflowStages,
  omsMetrics: mock.omsMetrics,
  statusDistribution: mock.statusDistribution,
  exceptionCategories: mock.exceptionCategories,
  network: { nodes: mock.networkNodes, shipments: mock.shipments },
  volumeTrend: mock.volumeTrend,
  agents: mock.agents,
  resolved: {},
};

/** disabled = no Supabase configured (open demo); otherwise the sign-in lifecycle */
export type AuthStatus = "disabled" | "loading" | "signedOut" | "setPassword" | "noRole" | "signedIn";

interface DashboardState {
  authStatus: AuthStatus;
  setAuthStatus: (s: AuthStatus) => void;
  me: Me | null;
  /** True when the signed-in user may act on this exception category. */
  canAct: (category: ExceptionId) => boolean;
  canSwitchView: () => boolean;
  reset: () => void;

  data: DashboardData;
  apiStatus: ApiStatus;
  copilotSource: "claude" | "canned" | "local";
  notice: string | null;
  setNotice: (n: string | null) => void;
  init: () => Promise<void>;

  role: RoleId;
  setRole: (r: RoleId) => void;

  activeNav: NavId;
  setNav: (n: NavId) => void;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  mobileNavOpen: boolean;
  setMobileNav: (open: boolean) => void;

  paletteOpen: boolean;
  setPalette: (open: boolean) => void;

  selectedStage: StageId | null;
  selectStage: (s: StageId | null) => void;

  expandedException: ExceptionId | null;
  toggleException: (id: ExceptionId) => void;
  showAllExceptions: boolean;
  setShowAllExceptions: (v: boolean) => void;
  /** orderId → action taken */
  resolved: Record<string, "approved" | "assigned">;
  resolveOrder: (orderId: string, how: "approved" | "assigned") => void;

  hiddenLayers: MapLayer[];
  toggleLayer: (l: MapLayer) => void;

  copilot: CopilotMode;
  setCopilot: (m: CopilotMode) => void;
  messages: ChatMessage[];
  agentTyping: boolean;
  sendMessage: (text: string) => void;
}

const nowLabel = () => new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
let msgSeq = 100;
const localMsg = (from: "user" | "agent", blocks: ChatMessage["blocks"]): ChatMessage => ({ id: `l${++msgSeq}`, from, time: nowLabel(), blocks });

export const useDashboard = create<DashboardState>((set, get) => ({
  authStatus: authEnabled ? "loading" : "disabled",
  setAuthStatus: (authStatus) => set({ authStatus }),
  me: null,
  canAct: (category) => {
    const me = get().me;
    if (!me) return !authEnabled; // open demo: everything allowed
    return me.actionScope === "all" || me.actionScope.includes(category);
  },
  canSwitchView: () => {
    const me = get().me;
    return me ? me.canSwitchView : !authEnabled;
  },
  reset: () => set({ me: null, data: localData, resolved: {}, messages: mock.initialChat, role: "scm", apiStatus: API_URL ? "connecting" : "demo" }),

  data: localData,
  apiStatus: API_URL ? "connecting" : "demo",
  copilotSource: "local",
  notice: null,
  setNotice: (notice) => set({ notice }),
  init: async () => {
    if (!API_URL) return;
    try {
      const me = await api.me();
      const [data, chat] = await Promise.all([api.dashboard(), api.chat()]);
      set({
        me: me.auth ? me : null,
        role: me.auth ? me.defaultView : get().role,
        data,
        resolved: data.resolved,
        messages: chat.messages,
        copilotSource: chat.copilot,
        apiStatus: "online",
        ...(authEnabled ? { authStatus: "signedIn" as const } : {}),
      });
    } catch (e) {
      if (e instanceof ApiError && e.code === "no_role") return set({ authStatus: "noRole", apiStatus: "online" });
      if (e instanceof ApiError && e.status === 401) return set({ authStatus: "signedOut" });
      console.warn("Backend unreachable, using bundled demo data:", e);
      // Signed-in users still get the bundled data rather than a dead end.
      set({ apiStatus: "demo", ...(authEnabled ? { authStatus: "signedIn" as const } : {}) });
    }
  },

  role: "scm",
  setRole: (role) => {
    if (!get().canSwitchView() && role !== get().role) return;
    set({ role, showAllExceptions: false, expandedException: null });
  },

  activeNav: "home",
  setNav: (activeNav) => set({ activeNav, mobileNavOpen: false }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  mobileNavOpen: false,
  setMobileNav: (mobileNavOpen) => set({ mobileNavOpen }),

  paletteOpen: false,
  setPalette: (paletteOpen) => set({ paletteOpen }),

  selectedStage: "oms",
  selectStage: (selectedStage) => set({ selectedStage }),

  expandedException: null,
  toggleException: (id) => set((s) => ({ expandedException: s.expandedException === id ? null : id })),
  showAllExceptions: false,
  setShowAllExceptions: (showAllExceptions) => set({ showAllExceptions }),
  resolved: {},
  resolveOrder: (orderId, how) => {
    const category = get().data.exceptionCategories.find((c) => c.orders.some((o) => o.orderId === orderId));
    if (category && !get().canAct(category.id)) return;
    set((s) => ({ resolved: { ...s.resolved, [orderId]: how } }));
    if (get().apiStatus !== "online") return;
    api.setAction(orderId, how).catch(() => {
      set((s) => {
        const next = { ...s.resolved };
        delete next[orderId];
        return { resolved: next, notice: `Couldn't save the action on ${orderId}. Check your connection and try again.` };
      });
    });
  },

  hiddenLayers: [],
  toggleLayer: (l) =>
    set((s) => ({
      hiddenLayers: s.hiddenLayers.includes(l) ? s.hiddenLayers.filter((x) => x !== l) : [...s.hiddenLayers, l],
    })),

  copilot: typeof window !== "undefined" && window.innerWidth >= 1280 ? "docked" : "minimized",
  setCopilot: (copilot) => set({ copilot }),
  messages: mock.initialChat,
  agentTyping: false,
  sendMessage: (text) => {
    const trimmed = text.trim();
    if (!trimmed || get().agentTyping) return;
    const pending = localMsg("user", [{ kind: "text", text: trimmed }]);
    set((s) => ({ messages: [...s.messages, pending], agentTyping: true }));

    const replyLocally = () =>
      window.setTimeout(() => set((s) => ({ messages: [...s.messages, localMsg("agent", mock.mockAgentReply(trimmed))], agentTyping: false })), 600);

    if (get().apiStatus !== "online") return void replyLocally();

    const roleLabel = get().data.roles.find((r) => r.id === get().role)?.label ?? "Supply Chain Manager";
    api
      .send(trimmed, roleLabel)
      .then(({ user, reply, source }) =>
        set((s) => ({ messages: [...s.messages.filter((m) => m.id !== pending.id), user, reply], agentTyping: false, copilotSource: source })),
      )
      .catch((e: Error) => {
        set({ notice: e.message.includes("Too many") ? e.message : "The assistant couldn't be reached, so this answer uses offline data." });
        replyLocally();
      });
  },
}));
