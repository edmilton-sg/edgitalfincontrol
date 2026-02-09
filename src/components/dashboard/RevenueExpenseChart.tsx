import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useLanguage } from "@/i18n/LanguageContext";
import { monthlyData } from "@/data/mockData";
import type { TranslationKey } from "@/i18n/translations";

export function RevenueExpenseChart() {
  const { t } = useLanguage();

  const data = monthlyData.map((d) => ({
    month: t(d.month as TranslationKey),
    [t("revenues")]: d.revenue,
    [t("expenses")]: d.expense,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{t("revenueVsExpense")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} barGap={4}>
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
                new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
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
