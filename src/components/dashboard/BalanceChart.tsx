import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, subMonths, endOfMonth, format } from "date-fns";
import type { TranslationKey } from "@/i18n/translations";

const monthKeys: TranslationKey[] = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

export function BalanceChart() {
  const { t, language } = useLanguage();
  const { selectedCompanyId } = useCompany();

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i);
    return { start: format(startOfMonth(d), "yyyy-MM-dd"), end: format(endOfMonth(d), "yyyy-MM-dd"), month: d.getMonth() };
  });

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-balance-chart", selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const sixMonthsAgo = months[0].start;
      const endDate = months[5].end;

      const [revRes, expRes] = await Promise.all([
        supabase.from("revenues").select("date, net_amount").eq("company_id", selectedCompanyId!).gte("date", sixMonthsAgo).lte("date", endDate),
        supabase.from("expenses").select("date, amount").eq("company_id", selectedCompanyId!).gte("date", sixMonthsAgo).lte("date", endDate),
      ]);

      let accumulated = 0;
      return months.map((m) => {
        const revs = (revRes.data ?? []).filter((r) => r.date >= m.start && r.date <= m.end);
        const exps = (expRes.data ?? []).filter((e) => e.date >= m.start && e.date <= m.end);
        const net = revs.reduce((s, r) => s + Number(r.net_amount), 0) - exps.reduce((s, e) => s + Number(e.amount), 0);
        accumulated += net;
        return { month: t(monthKeys[m.month]), balance: accumulated };
      });
    },
  });

  if (isLoading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-[300px] w-full" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{t("accumulatedBalance")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data ?? []}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
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
            <Area type="monotone" dataKey="balance" stroke="hsl(var(--chart-1))" fill="url(#balanceGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
