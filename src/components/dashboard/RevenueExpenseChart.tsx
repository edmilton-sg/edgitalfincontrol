import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, subMonths, endOfMonth, format } from "date-fns";
import type { TranslationKey } from "@/i18n/translations";

const monthKeys: TranslationKey[] = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

export function RevenueExpenseChart() {
  const { t, language } = useLanguage();
  const { selectedCompanyId } = useCompany();

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i);
    return { start: format(startOfMonth(d), "yyyy-MM-dd"), end: format(endOfMonth(d), "yyyy-MM-dd"), month: d.getMonth() };
  });

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-rev-exp-chart", selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const sixMonthsAgo = months[0].start;
      const endDate = months[5].end;

      const [revRes, expRes] = await Promise.all([
        supabase.from("revenues").select("date, net_amount").eq("company_id", selectedCompanyId!).gte("date", sixMonthsAgo).lte("date", endDate),
        supabase.from("expenses").select("date, amount").eq("company_id", selectedCompanyId!).gte("date", sixMonthsAgo).lte("date", endDate),
      ]);

      return months.map((m) => {
        const revs = (revRes.data ?? []).filter((r) => r.date >= m.start && r.date <= m.end);
        const exps = (expRes.data ?? []).filter((e) => e.date >= m.start && e.date <= m.end);
        return {
          month: t(monthKeys[m.month]),
          [t("revenues")]: revs.reduce((s, r) => s + Number(r.net_amount), 0),
          [t("expenses")]: exps.reduce((s, e) => s + Number(e.amount), 0),
        };
      });
    },
  });

  if (isLoading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-[300px] w-full" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{t("revenueVsExpense")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data ?? []} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                color: "hsl(var(--card-foreground))",
              }}
              formatter={(value: number) =>
                new Intl.NumberFormat(language === "pt-BR" ? "pt-BR" : "en-US", { style: "currency", currency: "BRL" }).format(value)
              }
            />
            <Legend />
            <Bar dataKey={t("revenues")} fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            <Bar dataKey={t("expenses")} fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
