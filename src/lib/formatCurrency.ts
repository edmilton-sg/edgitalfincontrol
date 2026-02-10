import type { Language } from "@/i18n/translations";

export function formatCurrency(value: number, language: Language): string {
  if (language === "pt-BR") {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
