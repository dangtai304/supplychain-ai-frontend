import {
  Activity,
  Bot,
  Boxes,
  ChartColumn,
  ClipboardList,
  Factory,
  FileChartColumn,
  Handshake,
  House,
  LineChart,
  Package,
  Settings,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  Store,
  TrendingUp,
  TriangleAlert,
  Truck,
  Users,
  Warehouse,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { AgentId, NavId, StageId } from "./types";

export const navIcons: Record<NavId, LucideIcon> = {
  home: House,
  agents: Bot,
  ask: Sparkles,
  demand: TrendingUp,
  orders: ShoppingCart,
  inventory: Boxes,
  procurement: ClipboardList,
  suppliers: Handshake,
  manufacturing: Factory,
  transportation: Truck,
  warehousing: Warehouse,
  customers: Users,
  exceptions: TriangleAlert,
  analytics: ChartColumn,
  reports: FileChartColumn,
  settings: Settings,
};

export const stageIcons: Record<StageId, LucideIcon> = {
  customerOrder: ShoppingCart,
  oms: Workflow,
  inventory: Boxes,
  procurement: ClipboardList,
  warehouse: Package,
  transportation: Truck,
  customer: Store,
};

export const agentIcons: Record<AgentId, LucideIcon> = {
  demand: TrendingUp,
  inventory: Boxes,
  procurement: ClipboardList,
  supplierRisk: ShieldAlert,
  warehouse: Warehouse,
  transportation: Truck,
  oms: Workflow,
  analytics: LineChart,
};

export { Activity };
