"use client";

import * as React from "react";
import { AreaTrend, BarList, Legend, StackedColumns, ViewToggle, type Series } from "@/components/charts/charts";
import { solarIcon } from "@/components/icons/solar";
import { Panel, PanelHeader } from "@/components/ui/primitives";
import { fmtNumber, fmtPct } from "@/lib/utils";

const REG_SERIES: Series[] = [
  { key: "students", label: "Students", color: "var(--viz-1)" },
  { key: "corporate", label: "Corporate", color: "var(--viz-2)" },
];

export function AnalyticsCharts({
  days,
  series,
  funnel,
  demand,
  mix,
  segments,
}: {
  days: number;
  series: Array<{ day: number; registrations: number; bookings: number; students: number; corporate: number }>;
  funnel: Array<{ stage: string; count: number }>;
  demand: Array<{ name: string; type: string; bookings: number; completed: number }>;
  mix: Array<{ label: string; value: number }>;
  segments: { student: number; corporate: number };
}) {
  const [regTable, setRegTable] = React.useState(false);
  const [bkTable, setBkTable] = React.useState(false);
  const total = segments.student + segments.corporate;

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <Panel>
        <PanelHeader
          icon={solarIcon("chart-square-bold-duotone")}
          title="New learners per day"
          description={`Last ${series.length} days, by segment`}
          actions={<ViewToggle table={regTable} onChange={setRegTable} />}
        />
        <div className="flex flex-col gap-4 px-5 py-4">
          <Legend series={REG_SERIES} />
          <StackedColumns data={series} series={REG_SERIES} label="New learners per day by segment" table={regTable} />
        </div>
      </Panel>

      <Panel>
        <PanelHeader icon={solarIcon("course-up-bold-duotone")} title="From sign-up to attended demo" description={`Learners who joined in the last ${days} days`} />
        <div className="px-5 py-4">
          <BarList
            items={funnel.map((f) => ({ label: f.stage, value: f.count }))}
            secondary={(i, idx) => (idx === 0 || !funnel[0].count ? null : fmtPct(i.value / funnel[0].count, 0))}
          />
          <p className="mt-4 text-meta text-ink-2">
            {funnel[1] && funnel[2] && funnel[1].count
              ? `Biggest drop: ${
                  funnel[1].count - funnel[2].count >= funnel[0].count - funnel[1].count
                    ? "onboarded learners who never booked"
                    : "sign-ups who didn't finish onboarding"
                }.`
              : "Not enough sign-ups in this range to compare stages."}
          </p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          icon={solarIcon("round-graph-bold-duotone")}
          title="Bookings made per day"
          description={`Last ${series.length} days`}
          actions={<ViewToggle table={bkTable} onChange={setBkTable} />}
        />
        <div className="px-5 py-4">
          {bkTable ? (
            <StackedColumns
              data={series}
              series={[{ key: "bookings", label: "Bookings", color: "var(--viz-1)" }]}
              label="Bookings made per day"
              table
            />
          ) : (
            <AreaTrend
              data={series.map((d) => ({ day: d.day, value: d.bookings }))}
              label="Bookings made per day. Use the Table view for exact values."
              height={180}
            />
          )}
        </div>
      </Panel>

      <Panel>
        <PanelHeader icon={solarIcon("pie-chart-2-bold-duotone")} title="What learners book" description={`${fmtNumber(mix.reduce((s, m) => s + m.value, 0))} bookings in ${days} days`} />
        <div className="flex flex-col gap-5 px-5 py-4">
          <BarList items={mix} />
          {total ? (
            <div>
              <p className="mb-3 text-meta text-ink-2">Who is booking</p>
              <div className="flex items-center gap-6">
                <Donut
                  parts={[
                    { label: "Students", value: segments.student, color: "var(--viz-1)" },
                    { label: "Corporate", value: segments.corporate, color: "var(--viz-2)" },
                  ]}
                  total={total}
                />
                <ul className="flex flex-col gap-2 text-meta text-ink-2">
                  <li className="inline-flex items-center gap-2">
                    <span className="size-[9px] rounded-full bg-[var(--viz-1)]" aria-hidden /> Students
                    <span className="num ml-2 text-ink">{fmtPct(segments.student / total, 0)}</span>
                  </li>
                  <li className="inline-flex items-center gap-2">
                    <span className="size-[9px] rounded-full bg-[var(--viz-2)]" aria-hidden /> Corporate
                    <span className="num ml-2 text-ink">{fmtPct(segments.corporate / total, 0)}</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </Panel>

      <Panel className="xl:col-span-2">
        <PanelHeader icon={solarIcon("ranking-bold-duotone")} title="Listings pulling the most demand" description={`Top ${demand.length} by bookings in ${days} days, with how many of those were attended`} />
        <div className="px-5 py-4">
          <BarList
            items={demand.map((x) => ({ label: x.name, value: x.bookings, sub: x.type === "course" ? "Course" : x.type[0].toUpperCase() + x.type.slice(1) }))}
            secondary={(_, idx) => `${demand[idx].completed} attended`}
          />
        </div>
      </Panel>
    </div>
  );
}

/** NXT donut: 18px stroke on a --line track, total centred, 2px gaps. */
function Donut({ parts, total }: { parts: Array<{ label: string; value: number; color: string }>; total: number }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const gap = parts.filter((p) => p.value > 0).length > 1 ? 3 : 0;
  const segments = parts.map((p, i) => ({
    ...p,
    len: (p.value / total) * C,
    start: (parts.slice(0, i).reduce((sum, x) => sum + x.value, 0) / total) * C,
  }));
  return (
    <div className="relative size-[132px] shrink-0" role="img" aria-label={parts.map((p) => `${p.label} ${p.value}`).join(", ")}>
      <svg viewBox="0 0 132 132" className="size-full -rotate-90" aria-hidden>
        <circle cx="66" cy="66" r={R} fill="none" stroke="var(--line)" strokeWidth="18" />
        {segments.map((p) => (
          <circle
            key={p.label}
            cx="66"
            cy="66"
            r={R}
            fill="none"
            stroke={p.color}
            strokeWidth="18"
            strokeDasharray={`${Math.max(0, p.len - gap)} ${C}`}
            strokeDashoffset={-p.start}
          />
        ))}
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <span className="text-[20px] font-semibold leading-none tabular-nums text-ink">{fmtNumber(total)}</span>
        <span className="mt-1 text-caption text-ink-3">bookings</span>
      </div>
    </div>
  );
}
