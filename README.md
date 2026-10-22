# SupplyChain AI – Agentic Operating System Dashboard

Control-tower dashboard built from the SDD spec: React 19 + TypeScript + Vite, Tailwind CSS (token-based light/dark theme), Recharts, Lucide icons, Zustand, and a d3-geo world map.

Backend: [supplychain-ai-backend](https://github.com/dangtai304/supplychain-ai-backend) (Render). Frontend hosting: Vercel.

## Run

```bash
npm install
cp .env.example .env.local   # point VITE_API_URL at the backend, or leave empty for demo data
npm run dev          # http://localhost:5173
npm run build        # typecheck + production build → dist/
npm run build:single # one self-contained HTML file → dist-single/
```

## Structure

```
src/
  lib/
    types.ts         # domain schemas (KPIs, workflow, exceptions, network, agents, chat)
    mock-data.ts     # typed mock data service + canned copilot replies (swap for APIs)
    store.ts         # Zustand: role, nav, sidebar, palette, exceptions, map layers, copilot
    icons.ts         # nav / stage / agent icon maps
    utils.ts         # formatting, tone → color helpers
  components/
    ui/              # Card, Button/IconButton, Badge, StatusDot, Sparkline, Change
    layout/          # Sidebar, Header (command bar + role switcher), CommandPalette
    dashboard/       # KPICard, WorkflowTracker, OMSMetrics, StatusDonutChart, ExceptionsPanel,
                     # NetworkMap, VolumeTrendChart, AgentTray, CopilotDrawer, ModulePlaceholder
  App.tsx            # 3-column shell
  index.css          # design tokens (RGB channels) for light + dark
```

## Interactions

- **Role switcher** swaps the 6 KPIs, dims workflow stages outside the role, marks the role's agents "Yours", and scopes exceptions (with a "Show all" escape).
- **Workflow tracker**: click a stage for its detail strip; amber badge = decisions waiting on a human.
- **Exceptions**: expand a category to see orders, AI recommendation, and Approve / Let agent decide.
- **Network map**: hover pins and at-risk markers; legend rows toggle layers.
- **Copilot**: docked ≥1280px, slide-over below; minimize, fullscreen, close. Quick actions, context chips, attachment and voice (Web Speech API where available). Replies come from `mockAgentReply()`.
- **Ctrl/⌘ + K**: search pages, agents and order numbers; unmatched text goes to the copilot.

## Backend connection

`src/lib/api.ts` reads `VITE_API_URL` (set in the Vercel project). On load the app fetches `/api/dashboard` and the chat history; approvals and copilot messages go to the API and persist in Postgres. The header badge shows **Live data** when connected, **Connecting** while Render's free instance wakes up (up to about a minute), and **Demo data** if the API is unreachable, in which case everything runs on `lib/mock-data.ts`.
