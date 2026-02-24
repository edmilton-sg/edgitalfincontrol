import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency } from "@/lib/formatCurrency";
import type { TranslationKey } from "@/i18n/translations";

export interface DreMonthData {
  month: string; // "jan", "feb", etc.
  year: number;
  netRevenue: number;
  totalExpenses: number;
  netResult: number;
}

interface DreChartProps {
  data: DreMonthData[];
}

const monthKeys: TranslationKey[] = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

export function DreChart({ data }: DreChartProps) {
  const { t, language } = useLanguage();

  const chartData = data.map((d) => ({
    label: `${t(d.month as TranslationKey)}/${d.year}`,
    [t("netRevenue")]: d.netRevenue,
    [t("expenses")]: d.totalExpenses,
    [t("netResult")]: d.netResult,
  }));

  if (chartData.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{t("monthlyComparison")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                color: "hsl(var(--card-foreground))",
              }}
              formatter={(value: number) => formatCurrency(value, language)}
            />
            <Legend />
            <Bar dataKey={t("netRevenue")} fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            <Bar dataKey={t("expenses")} fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
            <Bar dataKey={t("netResult")} fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
