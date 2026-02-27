import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { DreTable, type DreLine } from "@/components/dre/DreTable";
import { DreChart, type DreMonthData } from "@/components/dre/DreChart";
import { DrePeriodFilter } from "@/components/dre/DrePeriodFilter";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import type { TranslationKey } from "@/i18n/translations";

const monthKeys: TranslationKey[] = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

export default function DrePage() {
  const { t } = useLanguage();
  const { selectedCompanyId } = useCompany();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const periodStart = format(startOfMonth(new Date(year, month)), "yyyy-MM-dd");
  const periodEnd = format(endOfMonth(new Date(year, month)), "yyyy-MM-dd");

  // Current period data
  const { data: revenues } = useQuery({
    queryKey: ["dre-revenues", selectedCompanyId, periodStart],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("revenues")
        .select("gross_amount, fee_amount, net_amount")
        .eq("company_id", selectedCompanyId!)
        .gte("date", periodStart)
        .lte("date", periodEnd);
      return data ?? [];
    },
  });

  const { data: expenses } = useQuery({
    queryKey: ["dre-expenses", selectedCompanyId, periodStart],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("expenses")
        .select("amount, category, is_personal, source_type")
        .eq("company_id", selectedCompanyId!)
        .gte("date", periodStart)
        .lte("date", periodEnd);
      return data ?? [];
    },
  });

  const { data: proLabore } = useQuery({
    queryKey: ["dre-prolabore", selectedCompanyId, periodStart],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("pro_labore")
        .select("net_amount")
        .eq("company_id", selectedCompanyId!)
        .eq("status", "paid")
        .gte("reference_month", periodStart)
        .lte("reference_month", periodEnd);
      return data ?? [];
    },
  });

  // Last 6 months for chart
  const chartMonths = useMemo(() => {
    const months: { start: string; end: string; month: number; year: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(year, month), i);
      months.push({
        start: format(startOfMonth(d), "yyyy-MM-dd"),
        end: format(endOfMonth(d), "yyyy-MM-dd"),
        month: d.getMonth(),
        year: d.getFullYear(),
      });
    }
    return months;
  }, [month, year]);

  const { data: chartRevenues } = useQuery({
    queryKey: ["dre-chart-rev", selectedCompanyId, chartMonths[0]?.start],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("revenues")
        .select("date, net_amount")
        .eq("company_id", selectedCompanyId!)
        .gte("date", chartMonths[0].start)
        .lte("date", chartMonths[5].end);
      return data ?? [];
    },
  });

  const { data: chartExpenses } = useQuery({
    queryKey: ["dre-chart-exp", selectedCompanyId, chartMonths[0]?.start],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("expenses")
        .select("date, amount")
        .eq("company_id", selectedCompanyId!)
        .gte("date", chartMonths[0].start)
        .lte("date", chartMonths[5].end);
      return data ?? [];
    },
  });

  // Build DRE lines
  const dreLines = useMemo<DreLine[]>(() => {
    if (!revenues || !expenses) return [];

    const grossRevenue = revenues.reduce((s, r) => s + Number(r.gross_amount), 0);
    const deductions = revenues.reduce((s, r) => s + Number(r.fee_amount), 0);
    const netRevenue = revenues.reduce((s, r) => s + Number(r.net_amount), 0);

    // Exclude pro_labore-sourced expenses from operating expenses (they're shown separately)
    const opExpenses = expenses.filter((e) => !e.is_personal && e.source_type !== "pro_labore");
    const personalExpenses = expenses.filter((e) => e.is_personal);

    const totalOpExpenses = opExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const totalPersonal = personalExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const totalProLabore = (proLabore ?? []).reduce((s, p) => s + Number(p.net_amount), 0);

    const operatingResult = netRevenue - totalOpExpenses;
    const netResult = operatingResult - totalPersonal - totalProLabore;

    const pct = (v: number) => (grossRevenue === 0 ? 0 : (v / grossRevenue) * 100);

    // Group operating expenses by category
    const byCat: Record<string, number> = {};
    opExpenses.forEach((e) => {
      const cat = e.category || t("uncategorized");
      byCat[cat] = (byCat[cat] || 0) + Number(e.amount);
    });

    const lines: DreLine[] = [
      { label: `(+) ${t("grossRevenue")}`, value: grossRevenue, percent: 100, type: "subtotal" },
      { label: `(-) ${t("deductions")}`, value: -deductions, percent: pct(-deductions), type: "item" },
      { label: `(=) ${t("netRevenue")}`, value: netRevenue, percent: pct(netRevenue), type: "subtotal" },
      { label: t("operatingExpenses"), value: 0, percent: 0, type: "header" },
      ...Object.entries(byCat)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, val]) => ({
          label: cat,
          value: -val,
          percent: pct(-val),
          type: "item" as const,
          indent: true,
        })),
      { label: `(=) ${t("operatingResult")}`, value: operatingResult, percent: pct(operatingResult), type: "subtotal" },
      { label: `(-) ${t("personalExpenses")}`, value: -totalPersonal, percent: pct(-totalPersonal), type: "item" },
      { label: `(-) ${t("proLaboreWithdrawals")}`, value: -totalProLabore, percent: pct(-totalProLabore), type: "item" },
      { label: `(=) ${t("netResult")}`, value: netResult, percent: pct(netResult), type: "total" },
    ];

    return lines;
  }, [revenues, expenses, proLabore, t]);

  // Build chart data
  const chartData = useMemo<DreMonthData[]>(() => {
    if (!chartRevenues || !chartExpenses) return [];

    return chartMonths.map((cm) => {
      const rev = chartRevenues
        .filter((r) => r.date >= cm.start && r.date <= cm.end)
        .reduce((s, r) => s + Number(r.net_amount), 0);
      const exp = chartExpenses
        .filter((e) => e.date >= cm.start && e.date <= cm.end)
        .reduce((s, e) => s + Number(e.amount), 0);
      return {
        month: monthKeys[cm.month],
        year: cm.year,
        netRevenue: rev,
        totalExpenses: exp,
        netResult: rev - exp,
      };
    });
  }, [chartRevenues, chartExpenses, chartMonths]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("incomeStatement")}</h1>
        <DrePeriodFilter month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
      </div>

      <Card>
        <CardContent className="p-0">
          <DreTable lines={dreLines} />
        </CardContent>
      </Card>

      <DreChart data={chartData} />
    </div>
  );
}
