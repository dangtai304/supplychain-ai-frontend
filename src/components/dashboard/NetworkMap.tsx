import { useMemo, useState } from "react";
import { geoInterpolate, geoNaturalEarth1, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import world from "world-atlas/countries-110m.json";
import { Globe, TriangleAlert } from "lucide-react";
import type { NetworkNode, NodeKind, Shipment, Tone } from "@/lib/types";
import { useDashboard, type MapLayer } from "@/lib/store";
import { cn, toneColor } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/Card";

const W = 800;
const H = 380;

const kindMeta: Record<NodeKind, { label: string; tone: Tone; r: number }> = {
  factory: { label: "Factories", tone: "purple", r: 5.5 },
  warehouse: { label: "Warehouses", tone: "info", r: 4.5 },
  dc: { label: "Distribution Centers", tone: "cyan", r: 4 },
  retailer: { label: "Retailers", tone: "ok", r: 3 },
};

const topo = world as unknown as Topology<{ countries: GeometryCollection }>;
const land = feature(topo, topo.objects.countries) as FeatureCollection<Geometry>;
const landNoAntarctica: FeatureCollection<Geometry> = {
  type: "FeatureCollection",
  features: land.features.filter((f: Feature<Geometry>) => String(f.id) !== "010"),
};

function NodeMark({ node, x, y }: { node: NetworkNode; x: number; y: number }) {
  const m = kindMeta[node.kind];
  const fill = toneColor(m.tone);
  const stroke = "rgb(var(--surface))";
  if (node.kind === "factory") return <rect x={x - m.r} y={y - m.r} width={m.r * 2} height={m.r * 2} rx={1.5} fill={fill} stroke={stroke} strokeWidth={1.5} />;
  if (node.kind === "warehouse")
    return <path d={`M${x} ${y - m.r - 1} L${x + m.r + 1} ${y} L${x} ${y + m.r + 1} L${x - m.r - 1} ${y} Z`} fill={fill} stroke={stroke} strokeWidth={1.5} />;
  return <circle cx={x} cy={y} r={m.r} fill={fill} stroke={stroke} strokeWidth={1.25} />;
}

/** World projection with facility pins and geodesic shipment lanes. Legend rows toggle layers. */
export function NetworkMap({ nodes, shipments }: { nodes: NetworkNode[]; shipments: Shipment[] }) {
  const { hiddenLayers, toggleLayer } = useDashboard();
  const [hover, setHover] = useState<{ x: number; y: number; title: string; sub: string } | null>(null);
  const [focusLane, setFocusLane] = useState<string | null>(null);

  const { path, project, landPath } = useMemo(() => {
    const projection = geoNaturalEarth1().fitExtent(
      [
        [6, 6],
        [W - 6, H - 6],
      ],
      landNoAntarctica,
    );
    const p = geoPath(projection);
    return { path: p, project: (c: [number, number]) => projection(c) as [number, number], landPath: p(landNoAntarctica) ?? "" };
  }, []);

  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);
  const atRisk = shipments.filter((s) => s.atRisk);
  const counts: { layer: MapLayer; label: string; count: number; tone: Tone; dashed?: boolean }[] = [
    ...(Object.keys(kindMeta) as NodeKind[]).map((k) => ({ layer: k, label: kindMeta[k].label, count: nodes.filter((n) => n.kind === k).length, tone: kindMeta[k].tone })),
    { layer: "inTransit", label: "In-Transit", count: shipments.length, tone: "info", dashed: true },
    { layer: "atRisk", label: "At Risk", count: atRisk.length, tone: "bad" },
  ];
  const show = (l: MapLayer) => !hiddenLayers.includes(l);

  return (
    <Card className="flex flex-col" aria-label="Global order fulfillment network">
      <CardHeader title="Global Order Fulfillment Network" subtitle="Facilities and live lanes" icon={<Globe size={16} />} />

      <div className="relative mx-4 mt-3 overflow-hidden rounded-input bg-surface-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`Map of ${nodes.length} facilities and ${shipments.length} lanes in transit, ${atRisk.length} at risk`}>
          <path d={landPath} fill="rgb(var(--line) / 0.75)" stroke="rgb(var(--surface-2))" strokeWidth={0.5} />

          {/* Lanes */}
          {shipments.map((s) => {
            const a = byId[s.from];
            const b = byId[s.to];
            if (!a || !b) return null;
            if (s.atRisk ? !show("atRisk") : !show("inTransit")) return null;
            const d = path({ type: "LineString", coordinates: [a.coords, b.coords] }) ?? "";
            const dim = focusLane && focusLane !== s.id;
            return (
              <path
                key={s.id}
                d={d}
                fill="none"
                stroke={toneColor(s.atRisk ? "bad" : "info", dim ? 0.15 : s.atRisk ? 0.95 : 0.55)}
                strokeWidth={s.atRisk ? 1.75 : 1.1}
                strokeDasharray={s.atRisk ? undefined : "4 4"}
                strokeLinecap="round"
                className={s.atRisk ? undefined : "animate-dash"}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((n) => {
            if (!show(n.kind)) return null;
            const [x, y] = project(n.coords);
            return (
              <g
                key={n.id}
                tabIndex={0}
                role="button"
                aria-label={`${n.name}, ${kindMeta[n.kind].label.replace(/s$/, "")}`}
                onMouseEnter={() => setHover({ x, y, title: n.name, sub: `${kindMeta[n.kind].label.replace(/s$/, "")} in ${n.city}` })}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover({ x, y, title: n.name, sub: `${kindMeta[n.kind].label.replace(/s$/, "")} in ${n.city}` })}
                onBlur={() => setHover(null)}
                className="cursor-pointer outline-none"
              >
                <circle cx={x} cy={y} r={10} fill="transparent" />
                <NodeMark node={n} x={x} y={y} />
              </g>
            );
          })}

          {/* At-risk markers at lane midpoints */}
          {show("atRisk") &&
            atRisk.map((s) => {
              const a = byId[s.from];
              const b = byId[s.to];
              const [x, y] = project(geoInterpolate(a.coords, b.coords)(0.5) as [number, number]);
              return (
                <g
                  key={`risk-${s.id}`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${s.id} at risk: ${s.riskReason}`}
                  onMouseEnter={() => {
                    setFocusLane(s.id);
                    setHover({ x, y, title: `${a.city} → ${b.city}`, sub: `${s.riskReason}. ETA ${s.eta}` });
                  }}
                  onMouseLeave={() => {
                    setFocusLane(null);
                    setHover(null);
                  }}
                  onFocus={() => setFocusLane(s.id)}
                  onBlur={() => setFocusLane(null)}
                  className="cursor-pointer outline-none"
                >
                  <circle cx={x} cy={y} r={9} fill={toneColor("bad", 0.18)} className="origin-center [transform-box:fill-box] animate-pulse-ring" />
                  <circle cx={x} cy={y} r={5.5} fill={toneColor("bad")} stroke="rgb(var(--surface))" strokeWidth={1.5} />
                  <text x={x} y={y + 2.6} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#fff">
                    !
                  </text>
                </g>
              );
            })}
        </svg>

        {hover && (
          <div
            className="pointer-events-none absolute z-10 max-w-[220px] -translate-x-1/2 -translate-y-full rounded-btn border border-line bg-surface px-2.5 py-1.5 shadow-lg"
            style={{ left: `${(hover.x / W) * 100}%`, top: `calc(${(hover.y / H) * 100}% - 10px)` }}
          >
            <p className="text-label text-fg">{hover.title}</p>
            <p className="text-badge font-normal text-subtle">{hover.sub}</p>
          </div>
        )}
      </div>

      {/* Legend / layer toggles */}
      <ul className="grid grid-cols-2 gap-1 px-3 pt-3" aria-label="Map layers">
        {counts.map((c) => {
          const on = show(c.layer);
          return (
            <li key={c.layer}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => toggleLayer(c.layer)}
                className={cn("flex w-full items-center gap-2 rounded-btn px-2 py-1.5 text-left text-body hover:bg-surface-2", !on && "opacity-45")}
              >
                {c.dashed ? (
                  <svg width="14" height="6" aria-hidden="true">
                    <line x1="0" y1="3" x2="14" y2="3" stroke={toneColor(c.tone)} strokeWidth="2" strokeDasharray="3 2" />
                  </svg>
                ) : (
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: toneColor(c.tone) }} aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1 truncate text-muted">{c.label}</span>
                <span className="tnum font-semibold text-fg">{c.count}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* At-risk lanes list */}
      <ul className="mx-4 mb-4 mt-2 space-y-1 border-t border-line pt-3" aria-label="Lanes at risk">
        {atRisk.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onMouseEnter={() => setFocusLane(s.id)}
              onMouseLeave={() => setFocusLane(null)}
              onFocus={() => setFocusLane(s.id)}
              onBlur={() => setFocusLane(null)}
              className={cn("flex w-full items-start gap-2 rounded-btn px-2 py-1.5 text-left text-body", focusLane === s.id && "bg-bad/5")}
            >
              <TriangleAlert size={14} className="mt-[3px] shrink-0 text-bad" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="text-fg">
                  {byId[s.from].city} → {byId[s.to].city}
                </span>
                <span className="text-subtle">, {s.riskReason}</span>
              </span>
              <span className="tnum shrink-0 text-badge text-bad">{s.eta}</span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
