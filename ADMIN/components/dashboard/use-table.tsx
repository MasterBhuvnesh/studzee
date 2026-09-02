"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpDownIcon } from "@hugeicons/core-free-icons";
import { TableHead } from "@/components/ui/table";

export type SortDir = "asc" | "desc";

// Strip everything but digits for a monotonic numeric key. Works for money
// ("$12,340" -> 12340), plain numbers, and percents ("4,2%" -> 42): within a
// single column the format is consistent, so order is preserved.
export const num = (s: string | number) =>
  typeof s === "number" ? s : Number(String(s).replace(/[^0-9]/g, "")) || 0;

export type TableState<T> = {
  rows: T[];
  sorted: T[];
  total: number;
  query: string;
  setQuery: (v: string) => void;
  filter: string;
  setFilter: (v: string) => void;
  sortKey: string | null;
  sortDir: SortDir;
  toggleSort: (key: string) => void;
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
  setPageSize: (s: number) => void;
};

export function useDataTable<T>(
  rows: T[],
  opts: {
    searchFields: (row: T) => string[];
    filterField?: (row: T) => string;
    sorters: Record<string, (row: T) => string | number>;
    initialSize?: number;
  },
): TableState<T> {
  const [query, setQueryState] = useState("");
  const [filter, setFilterState] = useState("All");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(opts.initialSize ?? 10);

  const q = query.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    if (opts.filterField && filter !== "All" && opts.filterField(r) !== filter) return false;
    if (q && !opts.searchFields(r).some((f) => f.toLowerCase().includes(q))) return false;
    return true;
  });

  const acc = sortKey ? opts.sorters[sortKey] : undefined;
  const sorted = acc
    ? [...filtered].sort((a, b) => {
        const av = acc(a);
        const bv = acc(b);
        const cmp =
          typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      })
    : filtered;

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  return {
    rows: paged,
    sorted,
    total,
    query,
    setQuery: (v) => {
      setQueryState(v);
      setPage(1);
    },
    filter,
    setFilter: (v) => {
      setFilterState(v);
      setPage(1);
    },
    sortKey,
    sortDir,
    toggleSort: (key) => {
      if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else {
        setSortKey(key);
        setSortDir("asc");
      }
      setPage(1);
    },
    page: safePage,
    setPage,
    pageSize,
    setPageSize: (s) => {
      setPageSizeState(s);
      setPage(1);
    },
  };
}

export function Th({
  label,
  k,
  sort,
  className,
}: {
  label: string;
  k: string;
  sort: { sortKey: string | null; toggleSort: (key: string) => void };
  className?: string;
}) {
  const active = sort.sortKey === k;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => sort.toggleSort(k)}
        className={`flex cursor-pointer items-center gap-1 font-mono text-[10px] tracking-wider uppercase select-none ${
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {label}
        <HugeiconsIcon icon={ArrowUpDownIcon} size={12} />
      </button>
    </TableHead>
  );
}

export function FilterPills({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-lg bg-muted p-0.5 text-xs font-medium">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={
            opt === value
              ? "rounded-md bg-card px-3 py-1.5 shadow-xs"
              : "px-3 py-1.5 text-muted-foreground"
          }
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
