import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface TaxGuide {
  referenceMonth: string;
  estimatedAmount: number;
  dueDate: string;
  paymentId?: string;
}

interface TaxPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guide: TaxGuide | null;
  onSaved: () => void;
}

export function TaxPaymentDialog({ open, onOpenChange, guide, onSaved }: TaxPaymentDialogProps) {
  const { t } = useLanguage();
  const { selectedCompanyId } = useCompany();
  const [paidAmount, setPaidAmount] = useState("");
  const [paidDate, setPaidDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedCompanyId || !guide) return;
    setSaving(true);

    const amount = parseFloat(paidAmount) || guide.estimatedAmount;

    if (guide.paymentId) {
      await supabase.from("tax_payments" as any).update({
        paid_amount: amount,
        paid_date: paidDate,
        status: "paid",
      }).eq("id", guide.paymentId);
    } else {
      await supabase.from("tax_payments" as any).insert({
        company_id: selectedCompanyId,
        reference_month: guide.referenceMonth,
        tax_type: "DAS",
        estimated_amount: guide.estimatedAmount,
        paid_amount: amount,
        due_date: guide.dueDate,
        paid_date: paidDate,
        status: "paid",
      });
    }

    setSaving(false);
    toast.success(t("paymentRegistered"));
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("markAsPaid")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t("paidAmount")}</Label>
            <Input
              type="number"
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder={guide?.estimatedAmount.toFixed(2)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("paymentDate")}</Label>
            <Input
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
            <Button onClick={handleSave} disabled={saving}>{t("save")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
