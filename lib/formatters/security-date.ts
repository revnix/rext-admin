import { format } from "date-fns";

export function formatSecurityDate(
  value: string | Date | null | undefined,
): string {
  if (!value) return "Unknown";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return format(date, "MMMM d, yyyy");
}
