import { Card, CardContent } from "@/components/ui/card";
import { Receipt, CheckCircle, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency } from "@/lib/formatCurrency";

interface TaxSummaryCardsProps {
  currentMonthDas: number;
  totalPaidYear: number;
  overdueAmount: number;
  taxMode: string;
  taxPercentage: number;
  fixedAmount: number;
}

export function TaxSummaryCards({ currentMonthDas, totalPaidYear, overdueAmount, taxMode, taxPercentage, fixedAmount }: TaxSummaryCardsProps) {
  const { t, language } = useLanguage();
  const fmt = (v: number) => formatCurrency(v, language);

  const modeLabel = taxMode === "fixed"
    ? `${t("configuredFixedValue")}: ${fmt(fixedAmount)}`
    : `${t("configuredRate")}: ${taxPercentage}%`;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("dasCurrentMonth")}</p>
            <p className="text-xl font-bold">{fmt(currentMonthDas)}</p>
            <p className="text-xs text-muted-foreground">{modeLabel}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-lg bg-emerald-500/10 p-2.5">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("totalPaidYear")}</p>
            <p className="text-xl font-bold">{fmt(totalPaidYear)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-lg bg-destructive/10 p-2.5">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("overdueGuides")}</p>
            <p className="text-xl font-bold">{fmt(overdueAmount)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
