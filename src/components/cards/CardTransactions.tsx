import { useState } from "react";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
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
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { InvoiceImportDialog } from "@/components/cards/InvoiceImportDialog";
import { format } from "date-fns";

interface CardTransactionsProps {
  cardId: string;
  companyId: string;
}

interface TransactionForm {
  date: string;
  description: string;
  amount: string;
  category: string;
  installment_number: string;
  installment_total: string;
}

const emptyForm: TransactionForm = { date: "", description: "", amount: "", category: "", installment_number: "1", installment_total: "1" };

export function CardTransactions({ cardId, companyId }: CardTransactionsProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<string | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [form, setForm] = useState<TransactionForm>(emptyForm);
  const [importOpen, setImportOpen] = useState(false);

  // Fetch card name for expense description
  const { data: cardData } = useQuery({
    queryKey: ["credit_card_name", cardId],
    queryFn: async () => {
      const { data } = await supabase.from("credit_cards").select("name").eq("id", cardId).single();
      return data;
    },
  });

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
      const { data: inserted, error } = await supabase.from("card_transactions").insert({
        card_id: cardId,
        company_id: companyId,
        date: form.date,
        description: form.description,
        amount: parseFloat(form.amount),
        category: form.category || null,
        installment_number: parseInt(form.installment_number),
        installment_total: parseInt(form.installment_total),
      }).select("id").single();
      if (error) throw error;

      // Create linked expense
      if (inserted) {
        const cardName = cardData?.name || "Cartão";
        await supabase.from("expenses").insert({
          company_id: companyId,
          date: form.date,
          description: `${form.description} (${cardName})`,
          category: form.category || null,
          amount: parseFloat(form.amount),
          payment_method: "creditCard",
          installment_number: parseInt(form.installment_number),
          installment_total: parseInt(form.installment_total),
          is_personal: false,
          is_recurring: false,
          source_type: "card_transaction",
          source_id: inserted.id,
        } as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card_transactions", cardId] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      closeDialog();
      toast({ title: t("transactionAdded") });
    },
  });

  const updateTx = useMutation({
    mutationFn: async () => {
      if (!editingTx) return;
      const { error } = await supabase.from("card_transactions").update({
        date: form.date,
        description: form.description,
        amount: parseFloat(form.amount),
        category: form.category || null,
        installment_number: parseInt(form.installment_number),
        installment_total: parseInt(form.installment_total),
      }).eq("id", editingTx);
      if (error) throw error;

      // Update linked expense
      const cardName = cardData?.name || "Cartão";
      await (supabase.from("expenses") as any).update({
        date: form.date,
        description: `${form.description} (${cardName})`,
        category: form.category || null,
        amount: parseFloat(form.amount),
        installment_number: parseInt(form.installment_number),
        installment_total: parseInt(form.installment_total),
      })
        .eq("source_type", "card_transaction")
        .eq("source_id", editingTx);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card_transactions", cardId] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      closeDialog();
      toast({ title: t("transactionUpdated") });
    },
  });

  const deleteTx = useMutation({
    mutationFn: async (id: string) => {
      // Delete linked expense first
      await (supabase.from("expenses") as any).delete()
        .eq("source_type", "card_transaction")
        .eq("source_id", id);

      const { error } = await supabase.from("card_transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card_transactions", cardId] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setDeletingTxId(null);
      toast({ title: t("transactionDeleted") });
    },
  });

  function openNew() {
    setEditingTx(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(tx: typeof transactions[0]) {
    setEditingTx(tx.id);
    setForm({
      date: tx.date,
      description: tx.description,
      amount: String(tx.amount),
      category: tx.category || "",
      installment_number: String(tx.installment_number ?? 1),
      installment_total: String(tx.installment_total ?? 1),
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingTx(null);
    setForm(emptyForm);
  }

  function handleSave() {
    if (editingTx) {
      updateTx.mutate();
    } else {
      addTx.mutate();
    }
  }

  const total = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{t("cardTransactions")}</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-1 h-3 w-3" />
            {t("importInvoice")}
          </Button>
          <Button size="sm" onClick={openNew}>
            <Plus className="mr-1 h-3 w-3" />
            {t("newTransaction")}
          </Button>
        </div>
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
              <TableHead className="w-20">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(tx)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeletingTxId(tx.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeDialog(); else setDialogOpen(true); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingTx ? t("editTransaction") : t("newTransaction")}</DialogTitle>
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
              <Button variant="outline" onClick={closeDialog}>{t("cancel")}</Button>
              <Button onClick={handleSave} disabled={!form.date || !form.description || !form.amount}>
                {t("save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <InvoiceImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        cardId={cardId}
        companyId={companyId}
      />

      <DeleteConfirmDialog
        open={!!deletingTxId}
        onOpenChange={(o) => { if (!o) setDeletingTxId(null); }}
        onConfirm={() => deletingTxId && deleteTx.mutate(deletingTxId)}
        loading={deleteTx.isPending}
      />
    </Card>
  );
}
