import { useState } from "react";
import { Plus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CardTransactionsProps {
  cardId: string;
  companyId: string;
}

export function CardTransactions({ cardId, companyId }: CardTransactionsProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ date: "", description: "", amount: "", category: "", installment_number: "1", installment_total: "1" });

  const { data: transactions = [] } = useQuery({
    queryKey: ["card_transactions", cardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("card_transactions")
        .select("*")
        .eq("card_id", cardId)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addTx = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("card_transactions").insert({
        card_id: cardId,
        company_id: companyId,
        date: form.date,
        description: form.description,
        amount: parseFloat(form.amount),
        category: form.category || null,
        installment_number: parseInt(form.installment_number),
        installment_total: parseInt(form.installment_total),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card_transactions", cardId] });
      setAddOpen(false);
      setForm({ date: "", description: "", amount: "", category: "", installment_number: "1", installment_total: "1" });
      toast({ title: t("transactionAdded") });
    },
  });

  const total = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{t("cardTransactions")}</CardTitle>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1 h-3 w-3" />
          {t("newTransaction")}
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("description")}</TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead>{t("installment")}</TableHead>
              <TableHead className="text-right">{t("amount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {t("noTransactions")}
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{format(new Date(tx.date), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell>{tx.category || "-"}</TableCell>
                  <TableCell>{tx.installment_number}/{tx.installment_total}</TableCell>
                  <TableCell className="text-right font-medium">
                    R$ {Number(tx.amount).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {transactions.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="font-semibold">{t("totalAmount")}</TableCell>
                <TableCell className="text-right font-bold">R$ {total.toFixed(2)}</TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </CardContent>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t("newTransaction")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t("date")}</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <Label>{t("description")}</Label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} maxLength={200} />
            </div>
            <div>
              <Label>{t("amount")}</Label>
              <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <Label>{t("category")}</Label>
              <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} maxLength={100} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("installment")} #</Label>
                <Input type="number" min={1} value={form.installment_number} onChange={(e) => setForm((f) => ({ ...f, installment_number: e.target.value }))} />
              </div>
              <div>
                <Label>{t("installments")}</Label>
                <Input type="number" min={1} value={form.installment_total} onChange={(e) => setForm((f) => ({ ...f, installment_total: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>{t("cancel")}</Button>
              <Button onClick={() => addTx.mutate()} disabled={!form.date || !form.description || !form.amount}>
                {t("save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
