import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatMonthYear, formatDateString } from "@/lib/formatDate";
import { Badge } from "@/components/ui/badge";
import type { ProLaboreRow } from "./ProLaboreTable";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ProLaboreRow | null;
}

export function ProLaboreDetailDialog({ open, onOpenChange, item }: Props) {
  const { t, language } = useLanguage();
  if (!item) return null;

  const rows = [
    { label: t("memberName"), value: item.member_name },
    { label: t("cpf"), value: item.cpf || "—" },
    { label: t("referenceMonth"), value: formatMonthYear(item.reference_month, language) },
    { label: t("grossAmount"), value: formatCurrency(Number(item.amount), language) },
    { label: t("inssAmount"), value: formatCurrency(Number(item.inss_amount), language) },
    { label: t("irrfAmount"), value: formatCurrency(Number(item.irrf_amount), language) },
    { label: t("netAmount"), value: formatCurrency(Number(item.net_amount), language), bold: true },
    { label: t("status"), value: <Badge variant={item.status === "paid" ? "default" : "secondary"}>{item.status === "paid" ? t("paid") : t("pending")}</Badge> },
    { label: t("paymentDate"), value: item.payment_date ? formatDateString(item.payment_date, language) : "—" },
    { label: t("proLaboreNotes"), value: item.notes || "—" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("proLaboreDetail")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="flex justify-between items-center py-1 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground">{r.label}</span>
              <span className={`text-sm ${r.bold ? "font-bold" : ""}`}>{r.value}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
