import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileSignature } from "lucide-react";
import { toast } from "sonner";
import { formatDateString as formatDate } from "@/lib/formatDate";
import { formatCurrency } from "@/lib/formatCurrency";
import type { TranslationKey } from "@/i18n/translations";

interface Props { type: "nfe" | "nfse"; titleKey: TranslationKey; }

export default function IssuedInvoicesPage({ type, titleKey }: Props) {
  const { t, language } = useLanguage();
  const { selectedCompanyId } = useCompany();
  const { data: rows = [] } = useQuery({
    queryKey: ["issued_invoices", selectedCompanyId, type],
    enabled: !!selectedCompanyId,
    queryFn: async () => (await supabase.from("issued_invoices").select("*").eq("company_id", selectedCompanyId!).eq("type", type).order("issue_date", { ascending: false })).data ?? [],
  });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t(titleKey)}</h1>
        <Button disabled onClick={() => toast.info("Aguardando integração com provedor (Focus NFe / PlugNotas)")}>
          <FileSignature size={16} className="mr-2" />Emitir
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Número</TableHead><TableHead>Data</TableHead><TableHead>Destinatário</TableHead>
              <TableHead className="text-right">Valor</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aguardando integração com provedor de emissão (Focus NFe / PlugNotas)</TableCell></TableRow>
              ) : rows.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{r.number ?? "—"}</TableCell>
                  <TableCell>{formatDate(r.issue_date)}</TableCell>
                  <TableCell>{r.recipient_name ?? "—"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(r.amount), language)}</TableCell>
                  <TableCell><Badge>{r.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}