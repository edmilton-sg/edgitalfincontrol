import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/i18n/LanguageContext";
import { transactions } from "@/data/mockData";
import { cn } from "@/lib/utils";

export function RecentTransactions() {
  const { t, language } = useLanguage();

  const fmt = (v: number) =>
    new Intl.NumberFormat(language === "pt-BR" ? "pt-BR" : "en-US", {
      style: "currency",
      currency: "BRL",
    }).format(v);

  const fmtDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString(language === "pt-BR" ? "pt-BR" : "en-US");

  const statusVariant = (s: string) => {
    if (s === "paid") return "default";
    if (s === "pending") return "secondary";
    return "destructive";
  };

  const statusLabel = (s: string) => t(s as "paid" | "pending" | "overdue");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{t("recentTransactions")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("date")}</TableHead>
              <TableHead className="text-right">{t("amount")}</TableHead>
              <TableHead className="text-center">{t("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-medium">{tx.name}</TableCell>
                <TableCell className="text-muted-foreground">{fmtDate(tx.date)}</TableCell>
                <TableCell className={cn("text-right font-semibold", tx.amount >= 0 ? "text-success" : "text-destructive")}>
                  {fmt(tx.amount)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={statusVariant(tx.status)}>{statusLabel(tx.status)}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
