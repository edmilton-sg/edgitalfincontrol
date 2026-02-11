import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Eye, Pencil, Trash2, Repeat } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency } from "@/lib/formatCurrency";
import type { Expense } from "@/data/mockData";
import type { TranslationKey } from "@/i18n/translations";

interface ExpenseTableProps {
  data: Expense[];
  onView?: (expense: Expense) => void;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
}

export function ExpenseTable({ data, onView, onEdit, onDelete }: ExpenseTableProps) {
  const { t, language } = useLanguage();
  const total = data.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("date")}</TableHead>
            <TableHead>{t("description")}</TableHead>
            <TableHead>{t("category")}</TableHead>
            <TableHead>{t("costCenter")}</TableHead>
            <TableHead className="text-right">{t("amount")}</TableHead>
            <TableHead>{t("paymentMethod")}</TableHead>
            <TableHead>{t("installment")}</TableHead>
            <TableHead className="text-center">{t("personal")}</TableHead>
            <TableHead className="text-center">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground py-8">—</TableCell>
            </TableRow>
          ) : (
            data.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="whitespace-nowrap">{new Date(e.date).toLocaleDateString(language)}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1">
                    {e.description}
                    {e.is_recurring && <Repeat className="h-3.5 w-3.5 text-primary" />}
                  </span>
                </TableCell>
                <TableCell><Badge variant="secondary">{t(e.category as TranslationKey)}</Badge></TableCell>
                <TableCell>{e.cost_center}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(e.amount, language)}</TableCell>
                <TableCell>{t(e.payment_method as TranslationKey)}</TableCell>
                <TableCell>{e.installment_total > 1 ? `${e.installment_number}/${e.installment_total}` : "—"}</TableCell>
                <TableCell className="text-center">
                  {e.is_personal ? <Check className="h-4 w-4 text-accent-foreground mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView?.(e)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit?.(e)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete?.(e)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        {data.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} className="font-semibold">{t("totalAmount")}</TableCell>
              <TableCell className="text-right font-bold">{formatCurrency(total, language)}</TableCell>
              <TableCell colSpan={4} />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
