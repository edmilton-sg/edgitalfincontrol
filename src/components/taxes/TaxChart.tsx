import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency } from "@/lib/formatCurrency";
import type { TaxGuideRow } from "./TaxTable";

interface TaxChartProps {
  data: TaxGuideRow[];
}

export function TaxChart({ data }: TaxChartProps) {
  const { t, language } = useLanguage();
  const fmt = (v: number) => formatCurrency(v, language);

  const chartData = data.map((row) => ({
    month: row.referenceMonth.slice(0, 7),
    estimated: row.estimatedAmount,
    paid: row.paidAmount ?? 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("estimatedVsPaid")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis tickFormatter={(v) => fmt(v)} className="text-xs" />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Bar dataKey="estimated" name={t("estimatedTax")} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="paid" name={t("paidAmount")} fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
