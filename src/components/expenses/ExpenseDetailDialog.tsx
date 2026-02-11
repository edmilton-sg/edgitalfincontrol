import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Repeat, Pencil, Check, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency } from "@/lib/formatCurrency";
import { FileAttachments } from "@/components/shared/FileAttachments";
import type { Expense, Attachment } from "@/data/mockData";
import type { TranslationKey } from "@/i18n/translations";

interface ExpenseDetailDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (expense: Expense) => void;
  attachments: Attachment[];
  companyId: string;
}

export function ExpenseDetailDialog({ expense, open, onOpenChange, onEdit, attachments, companyId }: ExpenseDetailDialogProps) {
  const { t, language } = useLanguage();
  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t("details")}
            {expense.is_recurring && <Repeat className="h-4 w-4 text-primary" />}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <Row label={t("date")} value={new Date(expense.date).toLocaleDateString(language)} />
          <Row label={t("description")} value={expense.description} />
          <Row label={t("category")} value={t(expense.category as TranslationKey)} />
          <Row label={t("costCenter")} value={expense.cost_center} />
          <Row label={t("amount")} value={formatCurrency(expense.amount, language)} bold />
          <Row label={t("paymentMethod")} value={t(expense.payment_method as TranslationKey)} />
          {expense.installment_total > 1 && (
            <Row label={t("installment")} value={`${expense.installment_number}/${expense.installment_total}`} />
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("fixed")}</span>
            {expense.is_fixed ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4 text-muted-foreground" />}
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("personal")}</span>
            {expense.is_personal ? <Check className="h-4 w-4 text-accent-foreground" /> : <X className="h-4 w-4 text-muted-foreground" />}
          </div>
          {expense.is_recurring && (
            <Row label={t("recurrenceInterval")} value={t((expense.recurrence_interval || "monthly") as TranslationKey)} />
          )}
        </div>

        <div className="border-t pt-4">
          <FileAttachments
            attachments={attachments}
            recordId={expense.id as string}
            recordType="expense"
            companyId={companyId}
            readOnly
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => { onOpenChange(false); onEdit(expense); }}>
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
