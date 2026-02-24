import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  name: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
}

export function RecentTransactions() {
  const { t, language } = useLanguage();
  const { selectedCompanyId } = useCompany();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["dashboard-recent-tx", selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const [revRes, expRes] = await Promise.all([
        supabase.from("revenues").select("id, description, date, net_amount, status")
          .eq("company_id", selectedCompanyId!).order("date", { ascending: false }).limit(10),
        supabase.from("expenses").select("id, description, date, amount")
          .eq("company_id", selectedCompanyId!).order("date", { ascending: false }).limit(10),
      ]);

      const revs: Transaction[] = (revRes.data ?? []).map((r) => ({
        id: r.id, name: r.description, date: r.date,
        amount: Number(r.net_amount), status: r.status as Transaction["status"],
      }));
      const exps: Transaction[] = (expRes.data ?? []).map((e) => ({
        id: e.id, name: e.description, date: e.date,
        amount: -Number(e.amount), status: "paid" as const,
      }));

      return [...revs, ...exps].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
    },
  });

  const fmt = (v: number) =>
    new Intl.NumberFormat(language === "pt-BR" ? "pt-BR" : "en-US", { style: "currency", currency: "BRL" }).format(v);

  const fmtDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString(language === "pt-BR" ? "pt-BR" : "en-US");

  const statusVariant = (s: string) => {
    if (s === "paid") return "default" as const;
    if (s === "pending") return "secondary" as const;
    return "destructive" as const;
  };

  const statusLabel = (s: string) => t(s as "paid" | "pending" | "overdue");

  if (isLoading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>;
  }

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
