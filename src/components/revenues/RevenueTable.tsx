import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency } from "@/lib/formatCurrency";
import type { Revenue } from "@/data/mockData";
import type { TranslationKey } from "@/i18n/translations";

interface RevenueTableProps {
  data: Revenue[];
}

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  paid: "default",
  pending: "secondary",
  overdue: "destructive",
};

export function RevenueTable({ data }: RevenueTableProps) {
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                —
              </TableCell>
            </TableRow>
          ) : (
            data.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap">{new Date(r.date).toLocaleDateString(language)}</TableCell>
                <TableCell>{r.description}</TableCell>
                <TableCell>{r.client}</TableCell>
                <TableCell className="text-right">{formatCurrency(r.gross_amount, language)}</TableCell>
                <TableCell className="text-right">{formatCurrency(r.fee_amount, language)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(r.net_amount, language)}</TableCell>
                <TableCell>{t(r.payment_method as TranslationKey)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[r.status]}>{t(r.status as TranslationKey)}</Badge>
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
              <TableCell colSpan={2} />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
