import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, CheckCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatMonthYear } from "@/lib/formatDate";

export interface ProLaboreRow {
  id: string;
  company_id: string;
  member_name: string;
  cpf: string | null;
  amount: number;
  inss_amount: number;
  irrf_amount: number;
  net_amount: number;
  reference_month: string;
  payment_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface Props {
  data: ProLaboreRow[];
  onView?: (row: ProLaboreRow) => void;
  onEdit?: (row: ProLaboreRow) => void;
  onDelete?: (row: ProLaboreRow) => void;
  onMarkAsPaid?: (row: ProLaboreRow) => void;
}

export function ProLaboreTable({ data, onView, onEdit, onDelete, onMarkAsPaid }: Props) {
  const { t, language } = useLanguage();
  const total = data.reduce((sum, r) => sum + Number(r.net_amount), 0);

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("referenceMonth")}</TableHead>
            <TableHead>{t("memberName")}</TableHead>
            <TableHead className="text-right">{t("grossAmount")}</TableHead>
            <TableHead className="text-right">{t("inssAmount")}</TableHead>
            <TableHead className="text-right">{t("irrfAmount")}</TableHead>
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
            data.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap">
                  {formatMonthYear(row.reference_month, language)}
                </TableCell>
                <TableCell>{row.member_name}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(row.amount), language)}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(row.inss_amount), language)}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(row.irrf_amount), language)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(Number(row.net_amount), language)}</TableCell>
                <TableCell>
                  <Badge variant={row.status === "paid" ? "default" : "secondary"}>
                    {row.status === "paid" ? t("paid") : t("pending")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView?.(row)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit?.(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {row.status !== "paid" && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => onMarkAsPaid?.(row)}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete?.(row)}>
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
              <TableCell colSpan={5} className="font-semibold">{t("totalAmount")}</TableCell>
              <TableCell className="text-right font-bold">{formatCurrency(total, language)}</TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
