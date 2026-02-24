import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, addMonths, format } from "date-fns";

export function TaxCard() {
  const { t, language } = useLanguage();
  const { selectedCompanyId } = useCompany();

  const now = new Date();
  const curStart = format(startOfMonth(now), "yyyy-MM-dd");
  const curEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-tax", selectedCompanyId, curStart],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data: revs } = await supabase
        .from("revenues")
        .select("gross_amount")
        .eq("company_id", selectedCompanyId!)
        .gte("date", curStart)
        .lte("date", curEnd);

      const gross = (revs ?? []).reduce((s, r) => s + Number(r.gross_amount), 0);
      const dasEstimate = gross * 0.06; // Simples Nacional ~6%
      const nextMonth = addMonths(now, 1);
      const dueDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 20);
      return { dasEstimate, dueDate: format(dueDate, "yyyy-MM-dd") };
    },
  });

  const fmt = (v: number) =>
    new Intl.NumberFormat(language === "pt-BR" ? "pt-BR" : "en-US", {
      style: "currency",
      currency: "BRL",
    }).format(v);

  const fmtDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString(language === "pt-BR" ? "pt-BR" : "en-US");

  if (isLoading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{t("upcomingTaxes")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg bg-warning/10 p-3">
          <Receipt className="text-warning" size={24} />
          <div>
            <p className="text-sm font-medium">{t("nextDas")}</p>
            <p className="text-xl font-bold">{fmt(data?.dasEstimate ?? 0)}</p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {t("dueDate")}: <span className="font-medium text-foreground">{data?.dueDate ? fmtDate(data.dueDate) : "-"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
