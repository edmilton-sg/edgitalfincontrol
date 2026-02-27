import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, Repeat } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatDateString } from "@/lib/formatDate";
import type { Revenue } from "@/data/mockData";
import type { TranslationKey } from "@/i18n/translations";

interface RevenueTableProps {
  data: Revenue[];
  onView?: (revenue: Revenue) => void;
  onEdit?: (revenue: Revenue) => void;
  onDelete?: (revenue: Revenue) => void;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  paid: "default",
  pending: "secondary",
  overdue: "destructive",
};

export function RevenueTable({ data, onView, onEdit, onDelete }: RevenueTableProps) {
  const { t, language } = useLanguage();
  const totalNet = data.reduce((sum, r) => sum + r.net_amount, 0);

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("date")}</TableHead>
            <TableHead>{t("description")}</TableHead>
            <TableHead>{t("client")}</TableHead>
            <TableHead className="text-right">{t("grossAmount")}</TableHead>
            <TableHead className="text-right">{t("feeAmount")}</TableHead>
            <TableHead className="text-right">{t("netAmount")}</TableHead>
            <TableHead>{t("paymentMethod")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead className="text-center">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground py-8">—</TableCell>
            </TableRow>
          ) : (
            data.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap">{formatDateString(r.date, language)}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1">
                    {r.description}
                    {r.is_recurring && <Repeat className="h-3.5 w-3.5 text-primary" />}
                  </span>
                </TableCell>
                <TableCell>{r.client}</TableCell>
                <TableCell className="text-right">{formatCurrency(r.gross_amount, language)}</TableCell>
                <TableCell className="text-right">{formatCurrency(r.fee_amount, language)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(r.net_amount, language)}</TableCell>
                <TableCell>{t(r.payment_method as TranslationKey)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[r.status]}>{t(r.status as TranslationKey)}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView?.(r)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit?.(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete?.(r)}>
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
              <TableCell colSpan={5} className="font-semibold">{t("totalNetAmount")}</TableCell>
              <TableCell className="text-right font-bold">{formatCurrency(totalNet, language)}</TableCell>
              <TableCell colSpan={3} />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
