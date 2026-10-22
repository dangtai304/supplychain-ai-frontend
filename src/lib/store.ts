import { create } from "zustand";
import type { ChatMessage, ExceptionId, NavId, NodeKind, RoleId, StageId } from "./types";
import * as mock from "./mock-data";
import { api, API_URL, type DashboardData } from "./api";

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

interface DashboardState {
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
  data: localData,
  apiStatus: API_URL ? "connecting" : "demo",
  copilotSource: "local",
  notice: null,
  setNotice: (notice) => set({ notice }),
  init: async () => {
    if (!API_URL) return;
    try {
      const [data, chat] = await Promise.all([api.dashboard(), api.chat()]);
      set({ data, resolved: data.resolved, messages: chat.messages, copilotSource: chat.copilot, apiStatus: "online" });
    } catch (e) {
      console.warn("Backend unreachable, using bundled demo data:", e);
      set({ apiStatus: "demo" });
    }
  },

  role: "scm",
  setRole: (role) => set({ role, showAllExceptions: false, expandedException: null }),

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
