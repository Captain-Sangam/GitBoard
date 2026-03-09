"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMonthValue } from "@/lib/format";
import { cn } from "@/lib/utils";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface MonthSelectorProps {
  months: string[];
  value: string;
  onChange: (value: string) => void;
}

function parseYearMonth(dateStr: string): { year: number; month: number } {
  const formatted = formatMonthValue(dateStr);
  const [y, m] = formatted.split("-");
  return { year: Number(y), month: Number(m) - 1 };
}

export function MonthSelector({ months, value, onChange }: MonthSelectorProps) {
  const [monthOpen, setMonthOpen] = useState(false);
  const monthRef = useRef<HTMLDivElement>(null);

  const yearMonthMap = useMemo(() => {
    const map = new Map<number, Set<number>>();
    for (const m of months) {
      const { year, month } = parseYearMonth(m);
      if (!map.has(year)) map.set(year, new Set());
      map.get(year)!.add(month);
    }
    return map;
  }, [months]);

  const years = useMemo(
    () => Array.from(yearMonthMap.keys()).sort((a, b) => b - a),
    [yearMonthMap]
  );

  const { year: selectedYear, month: selectedMonthIdx } = useMemo(
    () => parseYearMonth(value),
    [value]
  );

  const availableMonths = yearMonthMap.get(selectedYear) ?? new Set<number>();

  const handleYearChange = (yearStr: string) => {
    const newYear = Number(yearStr);
    const available = yearMonthMap.get(newYear);
    if (!available || available.size === 0) return;

    let newMonth = selectedMonthIdx;
    if (!available.has(newMonth)) {
      newMonth = Math.max(...Array.from(available));
    }
    onChange(`${newYear}-${String(newMonth + 1).padStart(2, "0")}-01`);
  };

  const handleMonthSelect = (monthIdx: number) => {
    onChange(`${selectedYear}-${String(monthIdx + 1).padStart(2, "0")}-01`);
    setMonthOpen(false);
  };

  useEffect(() => {
    if (!monthOpen) return;
    const handler = (e: MouseEvent) => {
      if (monthRef.current && !monthRef.current.contains(e.target as Node)) {
        setMonthOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [monthOpen]);

  return (
    <div className="flex items-center gap-2">
      <Select value={String(selectedYear)} onValueChange={handleYearChange}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative" ref={monthRef}>
        <button
          type="button"
          onClick={() => setMonthOpen((prev) => !prev)}
          className="flex h-9 w-[120px] items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50"
        >
          <span>{MONTH_LABELS[selectedMonthIdx]}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
        {monthOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 w-[220px] rounded-md border bg-popover p-2 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
            <div className="grid grid-cols-3 gap-1">
              {MONTH_LABELS.map((label, idx) => {
                const isAvailable = availableMonths.has(idx);
                const isSelected = idx === selectedMonthIdx;
                return (
                  <button
                    key={label}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => handleMonthSelect(idx)}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : isAvailable
                          ? "hover:bg-accent hover:text-accent-foreground"
                          : "text-muted-foreground/40 cursor-not-allowed"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
