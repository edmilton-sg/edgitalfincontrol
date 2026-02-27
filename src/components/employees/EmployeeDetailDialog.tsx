import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency } from "@/lib/formatCurrency";
import type { EmployeeRow } from "./EmployeeTable";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: EmployeeRow | null;
}

export function EmployeeDetailDialog({ open, onOpenChange, item }: Props) {
  const { t, language } = useLanguage();
  if (!item) return null;

  const rows = [
    { label: t("employeeName"), value: item.name },
    { label: t("cpf"), value: item.cpf || "—" },
    { label: t("employeePosition"), value: item.position || "—" },
    { label: t("employeeDepartment"), value: item.department || "—" },
    { label: t("employeeSalary"), value: formatCurrency(item.salary, language) },
    { label: t("employeeHireDate"), value: item.hire_date.split("-").reverse().join("/") },
    { label: t("status"), value: t(item.status === "active" ? "employeeActive" : "employeeTerminated") },
    { label: t("proLaboreNotes"), value: item.notes || "—" },
  ];

  if (item.termination_date) {
    rows.splice(7, 0, { label: t("employeeTerminationDate"), value: item.termination_date.split("-").reverse().join("/") });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("employeeDetails")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-medium text-right">{r.value}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
