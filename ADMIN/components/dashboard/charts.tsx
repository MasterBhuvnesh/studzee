"use client";

import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const ROWS = 20;

export function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-0.75">
      {data.map((v, i) => (
        <div
          key={i}
          className={`w-0.75 rounded-full ${v === max ? "bg-foreground" : "bg-foreground/25"}`}
          style={{ height: `${(v / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

type Week = { newUser: number; existing: number };
export function PixelChart({
  weeks,
  months,
  maxK,
  year,
  tooltipLabels,
}: {
  weeks: Week[];
  months: string[];
  maxK: number;
  year: number;
  tooltipLabels?: string[];
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const kPerCell = maxK / ROWS;
  const yLabels = Array.from({ length: 7 }, (_, i) => `${Math.round((maxK / 6) * (6 - i))}k`);
  const lineLeft =
    hovered === null ? "0%" : `${((hovered + 0.5) / weeks.length) * 100}%`;
  const flip = hovered !== null && hovered > weeks.length / 2;
  const hoveredMonth =
    hovered === null
      ? ""
      : months[Math.min(months.length - 1, Math.floor((hovered / weeks.length) * months.length))];
  const tipLabel =
    hovered === null
      ? ""
      : tooltipLabels
        ? tooltipLabels[hovered]
        : `${hoveredMonth} ${year}`;

  return (
    <div>
      <div className="flex gap-3">
        <div className="flex w-7 shrink-0 flex-col justify-between py-px text-right font-mono text-[10px] text-muted-foreground">
          {yLabels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>

        <div className="relative flex-1" onMouseLeave={() => setHovered(null)}>
          <div
            className="grid h-72 gap-0.75"
            style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}
          >
            {weeks.map((w, i) => {
              const existingCells = Math.round(w.existing / kPerCell);
              const newCells = Math.round(w.newUser / kPerCell);
              return (
                <div
                  key={i}
                  className="flex flex-col-reverse gap-0.75"
                  onMouseEnter={() => setHovered(i)}
                >
                  {Array.from({ length: ROWS }, (_, c) => (
                    <div
                      key={c}
                      className={`min-h-0 flex-1 rounded-[1px] ${
                        c < existingCells
                          ? "bg-foreground"
                          : c < existingCells + newCells
                            ? "bg-foreground/30"
                            : "bg-foreground/5"
                      }`}
                    />
                  ))}
                </div>
              );
            })}
          </div>

          {hovered !== null && (
            <>
              <div
                className="pointer-events-none absolute inset-y-0 border-l border-dashed border-foreground/40"
                style={{ left: lineLeft }}
              >
                <span className="absolute -top-1 left-[-4.5px] size-2 rounded-full bg-foreground" />
              </div>
              <div
                className="pointer-events-none absolute top-2 z-10 w-44 rounded-xl border bg-popover p-1 shadow-md"
                style={
                  flip
                    ? { right: `calc(100% - ${lineLeft} + 12px)` }
                    : { left: `calc(${lineLeft} + 12px)` }
                }
              >
                <p className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  {tipLabel}
                </p>
                <div className="space-y-1 px-3 py-1.5 text-xs">
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <span className="size-2 rounded-full bg-foreground/30" />
                    New User
                    <span className="ml-auto font-mono font-semibold text-foreground">
                      {weeks[hovered].newUser}k
                    </span>
                  </p>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <span className="size-2 rounded-full bg-foreground" />
                    Existing User
                    <span className="ml-auto font-mono font-semibold text-foreground">
                      {weeks[hovered].existing}k
                    </span>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between pl-10 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
        {months.map((m, i) => (
          <span
            key={m}
            className={`items-center gap-3 ${i % 2 ? "hidden sm:flex" : "flex"}`}
          >
            {m}
            {i < months.length - 1 && <span className="text-foreground/20">•</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

const revenueChartConfig = {
  revenue: { label: "Revenue", color: "var(--foreground)" },
} satisfies ChartConfig;

export function RevenueBars({ bars }: { bars: { h: number; o: number; b: number }[] }) {
  const days = bars.map((bar, i) => ({
    day: i + 1,
    revenue: bar.o + bar.b,
    above: bar.h - bar.o - bar.b,
  }));

  return (
    <ChartContainer config={revenueChartConfig} className="aspect-auto h-56 w-full">
      <BarChart data={days} barSize={3} margin={{ top: 0, right: 4, bottom: 0, left: 4 }}>
        <CartesianGrid
          vertical={false}
          strokeDasharray="4 4"
          stroke="color-mix(in oklab, var(--foreground) 10%, transparent)"
        />
        <XAxis dataKey="day" hide />
        <YAxis domain={[0, 100]} hide />
        <Bar dataKey="revenue" stackId="d" fill="var(--color-revenue)" radius={[2, 2, 0, 0]} />
        <Bar dataKey="above" stackId="d" fill="var(--color-revenue)" fillOpacity={0.15} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

const monthlyConfig = {
  revenue: {
    label: "This Year",
    color: "color-mix(in oklab, var(--foreground) 70%, transparent)",
  },
  lastYear: {
    label: "Last Year",
    color: "color-mix(in oklab, var(--foreground) 30%, transparent)",
  },
} satisfies ChartConfig;

export function MonthlyArea({
  data,
}: {
  data: { month: string; revenue: number; lastYear: number }[];
}) {
  return (
    <ChartContainer config={monthlyConfig} className="aspect-auto h-64 w-full">
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="fillLastYear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-lastYear)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--color-lastYear)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          vertical={false}
          strokeDasharray="4 4"
          stroke="color-mix(in oklab, var(--foreground) 10%, transparent)"
        />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontFamily: "var(--font-geist-mono)" }}
        />
        <YAxis hide />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Area
          dataKey="lastYear"
          type="natural"
          stroke="var(--color-lastYear)"
          strokeWidth={2}
          fill="url(#fillLastYear)"
        />
        <Area
          dataKey="revenue"
          type="natural"
          stroke="var(--color-revenue)"
          strokeWidth={2}
          fill="url(#fillRevenue)"
        />
      </AreaChart>
    </ChartContainer>
  );
}
