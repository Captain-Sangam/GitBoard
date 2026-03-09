import { format, parseISO } from "date-fns";

export function formatMonth(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMMM yyyy");
}

export function formatMonthValue(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd");
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d");
}

export function formatNumber(n: number): string {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return n.toLocaleString();
}

export function formatWeekLabel(_weekStart: Date | string, index: number, month?: string): string {
  if (!month) return `Week ${index + 1}`;

  const d = parseISO(month);
  const year = d.getFullYear();
  const m = d.getMonth();
  const lastDay = new Date(year, m + 1, 0).getDate();

  const starts = [1, 8, 15, 22];
  const ends = [7, 14, 21, lastDay];
  const monthName = format(d, "MMM");

  const start = starts[index] ?? 22;
  const end = ends[index] ?? lastDay;

  return `Week ${index + 1}  ·  ${monthName} ${start}–${end}`;
}

export function formatOrdinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  const suffix = v >= 11 && v <= 13 ? "th" : suffixes[v % 10] || "th";
  return `${n}${suffix}`;
}
