import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { differenceInDays, parseISO, isBefore } from "date-fns";
import type { CompanyDocument } from "@/data/mockData";

export function DocumentAlerts() {
  const { t } = useLanguage();
  const { selectedCompanyId } = useCompany();

  const { data: alerts = [] } = useQuery({
    queryKey: ["document_alerts", selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_documents")
        .select("*")
        .eq("company_id", selectedCompanyId!)
        .not("expires_at", "is", null)
        .order("expires_at");
      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return (data as CompanyDocument[]).filter((doc) => {
        const expiry = parseISO(doc.expires_at!);
        const daysLeft = differenceInDays(expiry, today);
        return daysLeft <= doc.alert_days_before;
      });
    },
  });

  if (alerts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-5 w-5 text-warning" />
          {t("documentAlerts")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((doc) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const expiry = parseISO(doc.expires_at!);
          const diff = differenceInDays(expiry, today);
          const isExpired = isBefore(expiry, today);

          return (
            <div key={doc.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
              <span className="font-medium truncate">{doc.title}</span>
              <Badge className={isExpired ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground"}>
                {isExpired ? `${Math.abs(diff)} ${t("daysOverdue")}` : diff === 0 ? t("expired") : `${diff} ${t("daysRemaining")}`}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
