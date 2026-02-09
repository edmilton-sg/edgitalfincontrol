import { DollarSign, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageContext";
import { summaryData } from "@/data/mockData";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number, lang: string) =>
  new Intl.NumberFormat(lang === "pt-BR" ? "pt-BR" : "en-US", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export function SummaryCards() {
  const { t, language } = useLanguage();

  const cards = [
    {
      label: t("currentBalance"),
      value: summaryData.currentBalance,
      change: summaryData.currentBalanceChange,
      icon: DollarSign,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: t("monthlyRevenue"),
      value: summaryData.monthlyRevenue,
      change: summaryData.monthlyRevenueChange,
      icon: TrendingUp,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: t("monthlyExpense"),
      value: summaryData.monthlyExpense,
      change: summaryData.monthlyExpenseChange,
      icon: TrendingDown,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: t("operatingProfit"),
      value: summaryData.operatingProfit,
      change: summaryData.operatingProfitChange,
      icon: BarChart3,
      color: "text-success",
      bg: "bg-success/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
              <div className={cn("rounded-lg p-2", card.bg)}>
                <card.icon size={18} className={card.color} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(card.value, language)}</p>
            <p className={cn("mt-1 text-xs font-medium", card.change >= 0 ? "text-success" : "text-destructive")}>
              {card.change >= 0 ? "+" : ""}
              {card.change}% {t("vsLastMonth")}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
