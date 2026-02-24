import { DollarSign, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

const formatCurrency = (value: number, lang: string) =>
  new Intl.NumberFormat(lang === "pt-BR" ? "pt-BR" : "en-US", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export function SummaryCards() {
  const { t, language } = useLanguage();
  const { selectedCompanyId } = useCompany();

  const now = new Date();
  const curStart = format(startOfMonth(now), "yyyy-MM-dd");
  const curEnd = format(endOfMonth(now), "yyyy-MM-dd");
  const prevStart = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd");
  const prevEnd = format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-summary", selectedCompanyId, curStart],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const [curRev, curExp, prevRev, prevExp] = await Promise.all([
        supabase.from("revenues").select("gross_amount, net_amount").eq("company_id", selectedCompanyId!).gte("date", curStart).lte("date", curEnd),
        supabase.from("expenses").select("amount").eq("company_id", selectedCompanyId!).gte("date", curStart).lte("date", curEnd),
        supabase.from("revenues").select("gross_amount, net_amount").eq("company_id", selectedCompanyId!).gte("date", prevStart).lte("date", prevEnd),
        supabase.from("expenses").select("amount").eq("company_id", selectedCompanyId!).gte("date", prevStart).lte("date", prevEnd),
      ]);

      const sumRev = (rows: any[]) => rows.reduce((s, r) => s + Number(r.gross_amount), 0);
      const sumNet = (rows: any[]) => rows.reduce((s, r) => s + Number(r.net_amount), 0);
      const sumExp = (rows: any[]) => rows.reduce((s, r) => s + Number(r.amount), 0);

      const curRevTotal = sumRev(curRev.data ?? []);
      const curExpTotal = sumExp(curExp.data ?? []);
      const curNetTotal = sumNet(curRev.data ?? []);
      const prevRevTotal = sumRev(prevRev.data ?? []);
      const prevExpTotal = sumExp(prevExp.data ?? []);
      const prevNetTotal = sumNet(prevRev.data ?? []);

      const pct = (cur: number, prev: number) => prev === 0 ? 0 : Math.round(((cur - prev) / prev) * 100);

      return {
        revenue: curRevTotal,
        revenueChange: pct(curRevTotal, prevRevTotal),
        expense: curExpTotal,
        expenseChange: pct(curExpTotal, prevExpTotal),
        balance: curNetTotal - curExpTotal,
        balanceChange: pct(curNetTotal - curExpTotal, prevNetTotal - prevExpTotal),
        profit: curNetTotal - curExpTotal,
        profitChange: pct(curNetTotal - curExpTotal, prevNetTotal - prevExpTotal),
      };
    },
  });

  const cards = [
    { label: t("currentBalance"), value: data?.balance ?? 0, change: data?.balanceChange ?? 0, icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
    { label: t("monthlyRevenue"), value: data?.revenue ?? 0, change: data?.revenueChange ?? 0, icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
    { label: t("monthlyExpense"), value: data?.expense ?? 0, change: data?.expenseChange ?? 0, icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10" },
    { label: t("operatingProfit"), value: data?.profit ?? 0, change: data?.profitChange ?? 0, icon: BarChart3, color: "text-success", bg: "bg-success/10" },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}><CardContent className="p-5"><Skeleton className="h-20 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

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
              {card.change >= 0 ? "+" : ""}{card.change}% {t("vsLastMonth")}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
