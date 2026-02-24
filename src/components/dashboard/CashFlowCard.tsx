import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, format } from "date-fns";

export function CashFlowCard() {
  const { t, language } = useLanguage();
  const { selectedCompanyId } = useCompany();

  const now = new Date();
  const curStart = format(startOfMonth(now), "yyyy-MM-dd");
  const curEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-cashflow", selectedCompanyId, curStart],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data: revs } = await supabase
        .from("revenues")
        .select("net_amount, status")
        .eq("company_id", selectedCompanyId!)
        .gte("date", curStart)
        .lte("date", curEnd);

      const rows = revs ?? [];
      const projected = rows.reduce((s, r) => s + Number(r.net_amount), 0);
      const realized = rows.filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.net_amount), 0);
      return { projected, realized };
    },
  });

  const projected = data?.projected ?? 0;
  const realized = data?.realized ?? 0;
  const pct = projected > 0 ? Math.round((realized / projected) * 100) : 0;

  const fmt = (v: number) =>
    new Intl.NumberFormat(language === "pt-BR" ? "pt-BR" : "en-US", {
      style: "currency",
      currency: "BRL",
    }).format(v);

  if (isLoading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{t("cashFlowProjection")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("nextDays")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("realized")}</span>
          <span className="font-semibold">{fmt(realized)}</span>
        </div>
        <Progress value={pct} className="h-2" />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("projected")}</span>
          <span className="font-semibold">{fmt(projected)}</span>
        </div>
        <p className="text-center text-lg font-bold text-primary">{pct}%</p>
      </CardContent>
    </Card>
  );
}
