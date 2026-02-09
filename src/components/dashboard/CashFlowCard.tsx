import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/i18n/LanguageContext";
import { cashFlowData } from "@/data/mockData";

export function CashFlowCard() {
  const { t, language } = useLanguage();
  const pct = Math.round((cashFlowData.realized / cashFlowData.projected) * 100);

  const fmt = (v: number) =>
    new Intl.NumberFormat(language === "pt-BR" ? "pt-BR" : "en-US", {
      style: "currency",
      currency: "BRL",
    }).format(v);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{t("cashFlowProjection")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("nextDays")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("realized")}</span>
          <span className="font-semibold">{fmt(cashFlowData.realized)}</span>
        </div>
        <Progress value={pct} className="h-2" />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("projected")}</span>
          <span className="font-semibold">{fmt(cashFlowData.projected)}</span>
        </div>
        <p className="text-center text-lg font-bold text-primary">{pct}%</p>
      </CardContent>
    </Card>
  );
}
