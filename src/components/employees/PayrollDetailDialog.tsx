import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatMonthYear } from "@/lib/formatDate";
import { FileAttachments } from "@/components/shared/FileAttachments";
import type { PayrollRow } from "./PayrollTable";
import type { Attachment } from "@/data/mockData";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payroll: PayrollRow | null;
  employeeName?: string;
  attachments: Attachment[];
  companyId: string;
}

export function PayrollDetailDialog({ open, onOpenChange, payroll, employeeName, attachments, companyId }: Props) {
  const { t, language } = useLanguage();
  if (!payroll) return null;

  const rows = [
    { label: t("employee"), value: employeeName ?? "—" },
    { label: t("referenceMonth"), value: formatMonthYear(payroll.reference_month, language) },
    { label: t("grossAmount"), value: formatCurrency(payroll.gross_salary, language) },
    { label: "INSS", value: formatCurrency(payroll.inss_amount, language) },
    { label: "IRRF", value: formatCurrency(payroll.irrf_amount, language) },
    { label: "FGTS", value: formatCurrency(payroll.fgts_amount, language) },
    { label: t("netAmount"), value: formatCurrency(payroll.net_salary, language) },
    { label: t("paymentDate"), value: payroll.payment_date ?? "—" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t("payrollDetails")}
            <Badge variant={payroll.status === "paid" ? "default" : "secondary"}>
              {t(payroll.status === "paid" ? "paid" : "pending")}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-medium">{r.value}</span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t">
          <FileAttachments
            attachments={attachments}
            recordId={payroll.id}
            recordType="payroll"
            companyId={companyId}
            readOnly
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
