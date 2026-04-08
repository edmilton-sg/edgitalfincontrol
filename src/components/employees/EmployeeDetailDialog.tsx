import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatDateString } from "@/lib/formatDate";
import type { EmployeeRow } from "./EmployeeTable";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: EmployeeRow | null;
}

export function EmployeeDetailDialog({ open, onOpenChange, item }: Props) {
  const { t, language } = useLanguage();
  if (!item) return null;

  const empType = (item as any).employment_type || "clt";

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: t("employeeName"), value: item.name },
    {
      label: t("employmentType"),
      value: <Badge variant={empType === "pj" ? "outline" : "default"}>{t(empType === "pj" ? "pj" : "clt")}</Badge>,
    },
    { label: t("cpf"), value: item.cpf || "—" },
  ];

  if (empType === "pj") {
    rows.push({ label: t("employeeCnpj"), value: (item as any).cnpj || "—" });
  }

  rows.push(
    { label: t("employeePosition"), value: item.position || "—" },
    { label: t("employeeDepartment"), value: item.department || "—" },
    { label: t("employeeSalary"), value: formatCurrency(item.salary, language) },
    { label: t("employeeHireDate"), value: formatDateString(item.hire_date, language) },
    { label: t("status"), value: t(item.status === "active" ? "employeeActive" : "employeeTerminated") },
  );

  if (item.termination_date) {
    rows.push({ label: t("employeeTerminationDate"), value: formatDateString(item.termination_date, language) });
  }

  rows.push({ label: t("proLaboreNotes"), value: item.notes || "—" });

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
