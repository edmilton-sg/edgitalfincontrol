import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Trash2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatMonthYear } from "@/lib/formatDate";
import type { Tables } from "@/integrations/supabase/types";

export type PayrollRow = Tables<"payroll">;

interface Props {
  data: PayrollRow[];
  onMarkPaid?: (p: PayrollRow) => void;
  onDelete?: (p: PayrollRow) => void;
}

export function PayrollTable({ data, onMarkPaid, onDelete }: Props) {
  const { t, language } = useLanguage();

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("referenceMonth")}</TableHead>
            <TableHead className="text-right">{t("grossAmount")}</TableHead>
            <TableHead className="text-right">INSS</TableHead>
            <TableHead className="text-right">IRRF</TableHead>
            <TableHead className="text-right">FGTS</TableHead>
            <TableHead className="text-right">{t("netAmount")}</TableHead>
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
            data.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{formatMonthYear(p.reference_month, language)}</TableCell>
                <TableCell className="text-right">{formatCurrency(p.gross_salary, language)}</TableCell>
                <TableCell className="text-right">{formatCurrency(p.inss_amount, language)}</TableCell>
                <TableCell className="text-right">{formatCurrency(p.irrf_amount, language)}</TableCell>
                <TableCell className="text-right">{formatCurrency(p.fgts_amount, language)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(p.net_salary, language)}</TableCell>
                <TableCell>
                  <Badge variant={p.status === "paid" ? "default" : "secondary"}>
                    {t(p.status === "paid" ? "paid" : "pending")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    {p.status === "pending" && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMarkPaid?.(p)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete?.(p)}>
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
