import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency } from "@/lib/formatCurrency";
import { format, parseISO } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";

export interface TaxGuideRow {
  referenceMonth: string;
  grossRevenue: number;
  taxMode: string;
  taxPercentage: number;
  estimatedAmount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  paidAmount?: number;
  paymentId?: string;
}

interface TaxTableProps {
  data: TaxGuideRow[];
  onMarkAsPaid: (guide: TaxGuideRow) => void;
}

export function TaxTable({ data, onMarkAsPaid }: TaxTableProps) {
  const { t, language } = useLanguage();
  const fmt = (v: number) => formatCurrency(v, language);
  const locale = language === "pt-BR" ? ptBR : enUS;

  const fmtMonth = (d: string) => {
    const date = parseISO(d);
    return format(date, "MMM/yyyy", { locale }).replace(/^\w/, (c) => c.toUpperCase());
  };

  const fmtDate = (d: string) => {
    const date = parseISO(d);
    return format(date, "dd/MM/yyyy");
  };

  const statusBadge = (s: string) => {
    if (s === "paid") return <Badge className="bg-emerald-500/15 text-emerald-600 border-0">{t("paid")}</Badge>;
    if (s === "overdue") return <Badge variant="destructive">{t("overdue")}</Badge>;
    return <Badge variant="outline" className="border-yellow-500 text-yellow-600">{t("pending")}</Badge>;
  };

  if (data.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">{t("noTaxData")}</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("referenceMonth")}</TableHead>
            <TableHead className="text-right">{t("grossRevenue")}</TableHead>
            <TableHead className="text-center">{t("taxRate")}</TableHead>
            <TableHead className="text-right">{t("estimatedTax")}</TableHead>
            <TableHead>{t("dueDate")}</TableHead>
            <TableHead className="text-center">{t("status")}</TableHead>
            <TableHead className="text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.referenceMonth}>
              <TableCell className="font-medium">{fmtMonth(row.referenceMonth)}</TableCell>
              <TableCell className="text-right">{fmt(row.grossRevenue)}</TableCell>
              <TableCell className="text-center">
                {row.taxMode === "fixed" ? t("fixedMode") : `${row.taxPercentage}%`}
              </TableCell>
              <TableCell className="text-right">{fmt(row.estimatedAmount)}</TableCell>
              <TableCell>{fmtDate(row.dueDate)}</TableCell>
              <TableCell className="text-center">{statusBadge(row.status)}</TableCell>
              <TableCell className="text-right">
                {row.status !== "paid" && (
                  <Button size="sm" variant="outline" onClick={() => onMarkAsPaid(row)}>
                    {t("markAsPaid")}
                  </Button>
                )}
                {row.status === "paid" && (
                  <span className="text-sm text-muted-foreground">{fmt(row.paidAmount ?? 0)}</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
