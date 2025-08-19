import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// lib/utils.ts
export function formatCurrency(amount: number, currency = "GBP", locale = "en-GB") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount || 0);
}
export function formatNumber(n: number, locale = "en-GB") {
  return new Intl.NumberFormat(locale).format(n || 0);
}
export const debounce = (fn: Function, wait = 300) => {
  let t: any;
  return (...args: any[]) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
};
// lib/utils.ts
export function formatDateSafe(date: any, locale = "en-GB") {
  if (!date) return "N/A";
  try {
    const d = date.toDate ? date.toDate() : new Date(date);
    if (isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(d);
  } catch {
    return "-";
  }
}
