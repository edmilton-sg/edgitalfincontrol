import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency } from "@/lib/formatCurrency";
import { calcPayroll } from "@/lib/calcPayroll";
import type { EmployeeRow } from "./EmployeeTable";

interface PayrollData {
  reference_month: string;
  gross_salary: number;
  other_additions: number;
  other_deductions: number;
  notes: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EmployeeRow | null;
  onSubmit: (data: {
    employee_id: string;
    reference_month: string;
    gross_salary: number;
    inss_amount: number;
    irrf_amount: number;
    fgts_amount: number;
    other_additions: number;
    other_deductions: number;
    net_salary: number;
    notes: string;
  }) => void;
}

export function PayrollDialog({ open, onOpenChange, employee, onSubmit }: Props) {
  const { t, language } = useLanguage();
  const { register, handleSubmit, reset, watch } = useForm<PayrollData>();

  useEffect(() => {
    if (employee && open) {
      const now = new Date();
      reset({
        reference_month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
        gross_salary: employee.salary,
        other_additions: 0,
        other_deductions: 0,
        notes: "",
      });
    }
  }, [employee, open, reset]);

  const gross = Number(watch("gross_salary") || 0);
  const additions = Number(watch("other_additions") || 0);
  const deductions = Number(watch("other_deductions") || 0);

  const calc = useMemo(() => calcPayroll(gross, additions, deductions), [gross, additions, deductions]);

  if (!employee) return null;

  const handleFormSubmit = (data: PayrollData) => {
    const c = calcPayroll(Number(data.gross_salary), Number(data.other_additions), Number(data.other_deductions));
    onSubmit({
      employee_id: employee.id,
      reference_month: data.reference_month,
      gross_salary: Number(data.gross_salary),
      inss_amount: c.inss,
      irrf_amount: c.irrf,
      fgts_amount: c.fgts,
      other_additions: Number(data.other_additions),
      other_deductions: Number(data.other_deductions),
      net_salary: c.net,
      notes: data.notes,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("processPayroll")} — {employee.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("referenceMonth")}</Label>
              <Input type="date" {...register("reference_month", { required: true })} />
            </div>
            <div>
              <Label>{t("grossAmount")}</Label>
              <Input type="number" step="0.01" {...register("gross_salary", { required: true })} />
            </div>
            <div>
              <Label>{t("payrollAdditions")}</Label>
              <Input type="number" step="0.01" {...register("other_additions")} />
            </div>
            <div>
              <Label>{t("payrollDeductions")}</Label>
              <Input type="number" step="0.01" {...register("other_deductions")} />
            </div>
          </div>

          {/* Encargos calculados */}
          <div className="rounded-md border p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">INSS</span>
              <span className="font-medium">{formatCurrency(calc.inss, language)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IRRF</span>
              <span className="font-medium">{formatCurrency(calc.irrf, language)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">FGTS</span>
              <span className="font-medium">{formatCurrency(calc.fgts, language)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>{t("netAmount")}</span>
              <span>{formatCurrency(calc.net, language)}</span>
            </div>
          </div>

          <div>
            <Label>{t("proLaboreNotes")}</Label>
            <Textarea {...register("notes")} rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
            <Button type="submit">{t("processPayroll")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
