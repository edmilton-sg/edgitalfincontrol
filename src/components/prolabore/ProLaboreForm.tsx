import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageContext";
import type { ProLaboreRow } from "./ProLaboreTable";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<ProLaboreRow>) => void;
  editingItem?: ProLaboreRow | null;
}

export function ProLaboreForm({ open, onOpenChange, onSave, editingItem }: Props) {
  const { t } = useLanguage();
  const { register, handleSubmit, reset, watch, setValue } = useForm<Partial<ProLaboreRow>>();

  useEffect(() => {
    if (editingItem) {
      reset({
        member_name: editingItem.member_name,
        cpf: editingItem.cpf,
        amount: Number(editingItem.amount),
        inss_amount: Number(editingItem.inss_amount),
        irrf_amount: Number(editingItem.irrf_amount),
        net_amount: Number(editingItem.net_amount),
        reference_month: editingItem.reference_month,
        notes: editingItem.notes,
      });
    } else {
      reset({ member_name: "", cpf: "", amount: 0, inss_amount: 0, irrf_amount: 0, net_amount: 0, reference_month: "", notes: "" });
    }
  }, [editingItem, open, reset]);

  const amount = watch("amount") || 0;
  const inss = watch("inss_amount") || 0;
  const irrf = watch("irrf_amount") || 0;

  const netAmount = useMemo(() => Number(amount) - Number(inss) - Number(irrf), [amount, inss, irrf]);

  useEffect(() => {
    setValue("net_amount", netAmount);
  }, [netAmount, setValue]);

  const onSubmit = (data: Partial<ProLaboreRow>) => {
    onSave({ ...data, net_amount: netAmount, id: editingItem?.id });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingItem ? t("editProLabore") : t("newProLabore")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("memberName")}</Label>
              <Input {...register("member_name", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>{t("cpf")}</Label>
              <Input {...register("cpf")} placeholder="000.000.000-00" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("referenceMonth")}</Label>
            <Input type="month" {...register("reference_month", { required: true })} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t("grossAmount")}</Label>
              <Input type="number" step="0.01" min="0" {...register("amount", { required: true, valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>{t("inssAmount")}</Label>
              <Input type="number" step="0.01" min="0" {...register("inss_amount", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>{t("irrfAmount")}</Label>
              <Input type="number" step="0.01" min="0" {...register("irrf_amount", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("netAmount")}</Label>
            <Input type="number" step="0.01" value={netAmount.toFixed(2)} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label>{t("proLaboreNotes")}</Label>
            <Textarea {...register("notes")} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
            <Button type="submit">{t("save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
