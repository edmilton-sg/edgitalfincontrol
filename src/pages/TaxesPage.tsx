import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfMonth, subMonths, addMonths, format, isBefore } from "date-fns";
import { TaxSummaryCards } from "@/components/taxes/TaxSummaryCards";
import { TaxTable, type TaxGuideRow } from "@/components/taxes/TaxTable";
import { TaxChart } from "@/components/taxes/TaxChart";
import { TaxSettingsDialog } from "@/components/taxes/TaxSettingsDialog";
import { TaxPaymentDialog } from "@/components/taxes/TaxPaymentDialog";

export default function TaxesPage() {
  const { t } = useLanguage();
  const { selectedCompanyId } = useCompany();
  const now = new Date();
  const currentYear = now.getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paymentGuide, setPaymentGuide] = useState<TaxGuideRow | null>(null);

  // Fetch tax settings
  const { data: taxSettings, refetch: refetchSettings } = useQuery({
    queryKey: ["tax-settings", selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("tax_settings" as any)
        .select("*")
        .eq("company_id", selectedCompanyId!)
        .maybeSingle();
      return data as unknown as { tax_mode: string; tax_percentage: number; fixed_amount: number; due_day?: number } | null;
    },
  });

  const taxMode = taxSettings?.tax_mode ?? "percentage";
  const taxPercentage = taxSettings?.tax_percentage ?? 6;
  const fixedAmount = taxSettings?.fixed_amount ?? 0;
  const dueDay = taxSettings?.due_day ?? 20;

  // Fetch monthly revenues for the year
  const { data: monthlyRevenues, isLoading: loadingRevenues } = useQuery({
    queryKey: ["tax-revenues", selectedCompanyId, year],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data: revs } = await supabase
        .from("revenues")
        .select("date, gross_amount")
        .eq("company_id", selectedCompanyId!)
        .gte("date", `${year}-01-01`)
        .lte("date", `${year}-12-31`);

      const byMonth: Record<string, number> = {};
      (revs ?? []).forEach((r) => {
        const m = (r.date as string).slice(0, 7);
        byMonth[m] = (byMonth[m] ?? 0) + Number(r.gross_amount);
      });
      return byMonth;
    },
  });

  // Fetch tax payments for the year
  const { data: payments, isLoading: loadingPayments, refetch: refetchPayments } = useQuery({
    queryKey: ["tax-payments", selectedCompanyId, year],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("tax_payments" as any)
        .select("*")
        .eq("company_id", selectedCompanyId!)
        .gte("reference_month", `${year}-01-01`)
        .lte("reference_month", `${year}-12-31`);
      return (data ?? []) as unknown as Array<{
        id: string;
        reference_month: string;
        estimated_amount: number;
        paid_amount: number | null;
        due_date: string;
        status: string;
      }>;
    },
  });

  // Build guide rows
  const guideRows: TaxGuideRow[] = useMemo(() => {
    const rows: TaxGuideRow[] = [];
    const today = now;

    for (let m = 0; m < 12; m++) {
      const monthDate = new Date(parseInt(year), m, 1);
      if (isBefore(today, monthDate) && m > now.getMonth() && parseInt(year) >= currentYear) {
        // don't show future months beyond current
        break;
      }
      const monthKey = format(monthDate, "yyyy-MM");
      const refMonth = format(monthDate, "yyyy-MM-dd");
      const grossRevenue = monthlyRevenues?.[monthKey] ?? 0;
      const estimated = taxMode === "fixed" ? fixedAmount : grossRevenue * (taxPercentage / 100);

      const nextMonth = addMonths(monthDate, 1);
      const dueDate = format(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), dueDay), "yyyy-MM-dd");

      const payment = payments?.find((p) => p.reference_month === refMonth);

      let status: "pending" | "paid" | "overdue" = "pending";
      if (payment?.status === "paid") {
        status = "paid";
      } else if (isBefore(new Date(dueDate), today)) {
        status = "overdue";
      }

      rows.push({
        referenceMonth: refMonth,
        grossRevenue,
        taxMode,
        taxPercentage,
        estimatedAmount: estimated,
        dueDate,
        status,
        paidAmount: payment?.paid_amount ?? undefined,
        paymentId: payment?.id,
      });
    }
    return rows;
  }, [monthlyRevenues, payments, taxMode, taxPercentage, fixedAmount, dueDay, year]);

  const currentMonthDas = guideRows.find(
    (r) => r.referenceMonth === format(startOfMonth(now), "yyyy-MM-dd")
  )?.estimatedAmount ?? 0;

  const totalPaidYear = guideRows
    .filter((r) => r.status === "paid")
    .reduce((s, r) => s + (r.paidAmount ?? 0), 0);

  const overdueAmount = guideRows
    .filter((r) => r.status === "overdue")
    .reduce((s, r) => s + r.estimatedAmount, 0);

  const handleRefresh = () => {
    refetchSettings();
    refetchPayments();
  };

  const years = Array.from({ length: 3 }, (_, i) => String(currentYear - i));

  if (loadingRevenues || loadingPayments) {
    return (
      <div className="space-y-6 p-1">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("taxManagement")}</h1>
        <div className="flex items-center gap-2">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <TaxSummaryCards
        currentMonthDas={currentMonthDas}
        totalPaidYear={totalPaidYear}
        overdueAmount={overdueAmount}
        taxMode={taxMode}
        taxPercentage={taxPercentage}
        fixedAmount={fixedAmount}
      />

      <TaxTable data={guideRows} onMarkAsPaid={(g) => setPaymentGuide(g)} />

      <TaxChart data={guideRows} />

      <TaxSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        currentSettings={taxSettings ?? null}
        onSaved={handleRefresh}
      />

      <TaxPaymentDialog
        open={!!paymentGuide}
        onOpenChange={(open) => { if (!open) setPaymentGuide(null); }}
        guide={paymentGuide ? {
          referenceMonth: paymentGuide.referenceMonth,
          estimatedAmount: paymentGuide.estimatedAmount,
          dueDate: paymentGuide.dueDate,
          paymentId: paymentGuide.paymentId,
        } : null}
        onSaved={handleRefresh}
      />
    </div>
  );
}
