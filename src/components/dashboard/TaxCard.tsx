import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { taxData } from "@/data/mockData";

export function TaxCard() {
  const { t, language } = useLanguage();

  const fmt = (v: number) =>
    new Intl.NumberFormat(language === "pt-BR" ? "pt-BR" : "en-US", {
      style: "currency",
      currency: "BRL",
    }).format(v);

  const fmtDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString(language === "pt-BR" ? "pt-BR" : "en-US");

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
            <p className="text-xl font-bold">{fmt(taxData.nextDasAmount)}</p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {t("dueDate")}: <span className="font-medium text-foreground">{fmtDate(taxData.dueDate)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
