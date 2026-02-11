import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Repeat, Pencil } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency } from "@/lib/formatCurrency";
import { FileAttachments } from "@/components/shared/FileAttachments";
import type { Revenue, Attachment } from "@/data/mockData";
import type { TranslationKey } from "@/i18n/translations";

interface RevenueDetailDialogProps {
  revenue: Revenue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (revenue: Revenue) => void;
  attachments: Attachment[];
  companyId: string;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  paid: "default",
  pending: "secondary",
  overdue: "destructive",
};

export function RevenueDetailDialog({ revenue, open, onOpenChange, onEdit, attachments, companyId }: RevenueDetailDialogProps) {
  const { t, language } = useLanguage();
  if (!revenue) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t("details")}
            {revenue.is_recurring && <Repeat className="h-4 w-4 text-primary" />}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <Row label={t("date")} value={new Date(revenue.date).toLocaleDateString(language)} />
          <Row label={t("description")} value={revenue.description} />
          <Row label={t("client")} value={revenue.client} />
          <Row label={t("grossAmount")} value={formatCurrency(revenue.gross_amount, language)} />
          <Row label={t("feeAmount")} value={formatCurrency(revenue.fee_amount, language)} />
          <Row label={t("netAmount")} value={formatCurrency(revenue.net_amount, language)} bold />
          <Row label={t("paymentMethod")} value={t(revenue.payment_method as TranslationKey)} />
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("status")}</span>
            <Badge variant={statusVariant[revenue.status]}>{t(revenue.status as TranslationKey)}</Badge>
          </div>
          {revenue.is_recurring && (
            <Row label={t("recurrenceInterval")} value={t((revenue.recurrence_interval || "monthly") as TranslationKey)} />
          )}
        </div>

        <div className="border-t pt-4">
          <FileAttachments
            attachments={attachments}
            recordId={revenue.id as string}
            recordType="revenue"
            companyId={companyId}
            readOnly
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => { onOpenChange(false); onEdit(revenue); }}>
            <Pencil className="mr-2 h-4 w-4" /> {t("edit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}
