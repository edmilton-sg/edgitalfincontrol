import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency } from "@/lib/formatCurrency";
import type { Tables } from "@/integrations/supabase/types";

export type EmployeeRow = Tables<"employees">;

interface Props {
  data: EmployeeRow[];
  onView?: (e: EmployeeRow) => void;
  onEdit?: (e: EmployeeRow) => void;
  onDelete?: (e: EmployeeRow) => void;
}

export function EmployeeTable({ data, onView, onEdit, onDelete }: Props) {
  const { t, language } = useLanguage();

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("employeeName")}</TableHead>
            <TableHead>{t("cpf")}</TableHead>
            <TableHead>{t("employeePosition")}</TableHead>
            <TableHead>{t("employeeDepartment")}</TableHead>
            <TableHead className="text-right">{t("employeeSalary")}</TableHead>
            <TableHead>{t("employeeHireDate")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead className="text-center">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">—</TableCell>
            </TableRow>
          ) : (
            data.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell className="font-medium">{emp.name}</TableCell>
                <TableCell>{emp.cpf || "—"}</TableCell>
                <TableCell>{emp.position || "—"}</TableCell>
                <TableCell>{emp.department || "—"}</TableCell>
                <TableCell className="text-right">{formatCurrency(emp.salary, language)}</TableCell>
                <TableCell>{new Date(emp.hire_date).toLocaleDateString(language)}</TableCell>
                <TableCell>
                  <Badge variant={emp.status === "active" ? "default" : "secondary"}>
                    {t(emp.status === "active" ? "employeeActive" : "employeeTerminated")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView?.(emp)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit?.(emp)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete?.(emp)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
