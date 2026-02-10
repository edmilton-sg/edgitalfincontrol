import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency } from "@/lib/formatCurrency";
import type { Expense } from "@/data/mockData";
import type { TranslationKey } from "@/i18n/translations";

interface ExpenseTableProps {
  data: Expense[];
}

export function ExpenseTable({ data }: ExpenseTableProps) {
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
            <TableHead className="text-center">{t("fixed")}</TableHead>
            <TableHead className="text-center">{t("personal")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                —
              </TableCell>
            </TableRow>
          ) : (
            data.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="whitespace-nowrap">{new Date(e.date).toLocaleDateString(language)}</TableCell>
                <TableCell>{e.description}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{t(e.category as TranslationKey)}</Badge>
                </TableCell>
                <TableCell>{e.cost_center}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(e.amount, language)}</TableCell>
                <TableCell>{t(e.payment_method as TranslationKey)}</TableCell>
                <TableCell>
                  {e.installment_total > 1 ? `${e.installment_number}/${e.installment_total}` : "—"}
                </TableCell>
                <TableCell className="text-center">
                  {e.is_fixed ? <Check className="h-4 w-4 text-success mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />}
                </TableCell>
                <TableCell className="text-center">
                  {e.is_personal ? <Check className="h-4 w-4 text-warning mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />}
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
