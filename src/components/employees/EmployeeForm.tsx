import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageContext";
import type { EmployeeRow } from "./EmployeeTable";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<EmployeeRow, "id" | "created_at" | "company_id" | "status" | "termination_date">) => void;
  editItem?: EmployeeRow | null;
}

export function EmployeeForm({ open, onOpenChange, onSubmit, editItem }: Props) {
  const { t } = useLanguage();
  const { register, handleSubmit, reset, watch, setValue } = useForm<{
    name: string;
    cpf: string;
    position: string;
    department: string;
    salary: number;
    hire_date: string;
    notes: string;
    employment_type: string;
    cnpj: string;
  }>();

  const employmentType = watch("employment_type") || "clt";

  useEffect(() => {
    if (editItem) {
      reset({
        name: editItem.name,
        cpf: editItem.cpf || "",
        position: editItem.position || "",
        department: editItem.department || "",
        salary: editItem.salary,
        hire_date: editItem.hire_date,
        notes: editItem.notes || "",
        employment_type: (editItem as any).employment_type || "clt",
        cnpj: (editItem as any).cnpj || "",
      });
    } else {
      reset({ name: "", cpf: "", position: "", department: "", salary: 0, hire_date: "", notes: "", employment_type: "clt", cnpj: "" });
    }
  }, [editItem, open, reset]);

  const handleFormSubmit = (data: any) => {
    onSubmit({
      ...data,
      salary: Number(data.salary),
      cnpj: data.employment_type === "pj" ? data.cnpj : null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editItem ? t("editEmployee") : t("newEmployee")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>{t("employeeName")}</Label>
              <Input {...register("name", { required: true })} />
            </div>
            <div>
              <Label>{t("employmentType")}</Label>
              <Select value={employmentType} onValueChange={(v) => setValue("employment_type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clt">{t("clt")}</SelectItem>
                  <SelectItem value="pj">{t("pj")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("cpf")}</Label>
              <Input {...register("cpf")} />
            </div>
            {employmentType === "pj" && (
              <div>
                <Label>{t("employeeCnpj")}</Label>
                <Input {...register("cnpj")} />
              </div>
            )}
            <div>
              <Label>{t("employeePosition")}</Label>
              <Input {...register("position")} />
            </div>
            <div>
              <Label>{t("employeeDepartment")}</Label>
              <Input {...register("department")} />
            </div>
            <div>
              <Label>{t("employeeSalary")}</Label>
              <Input type="number" step="0.01" min="0" {...register("salary", { required: true })} />
            </div>
            <div>
              <Label>{t("employeeHireDate")}</Label>
              <Input type="date" {...register("hire_date", { required: true })} />
            </div>
          </div>
          <div>
            <Label>{t("proLaboreNotes")}</Label>
            <Textarea {...register("notes")} rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
            <Button type="submit">{t("save")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
