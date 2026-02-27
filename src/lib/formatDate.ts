/**
 * Format a date string (YYYY-MM-DD) for display without timezone shift.
 * Avoids `new Date("YYYY-MM-DD")` which parses as UTC and shifts in negative-offset timezones.
 */
export function formatDateString(dateStr: string, language: string = "pt-BR"): string {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("T")[0].split("-");
  if (language === "pt-BR") return `${day}/${month}/${year}`;
  return `${month}/${day}/${year}`;
}

/**
 * Format a date string (YYYY-MM-DD) as month/year (e.g. "Janeiro 2025").
 */
export function formatMonthYear(dateStr: string, language: string = "pt-BR"): string {
  if (!dateStr) return "—";
  const [year, month] = dateStr.split("T")[0].split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString(language, { month: "long", year: "numeric" });
}
