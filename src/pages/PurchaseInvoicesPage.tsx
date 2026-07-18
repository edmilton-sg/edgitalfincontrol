import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDateString as formatDate } from "@/lib/formatDate";
import { formatCurrency } from "@/lib/formatCurrency";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";

type Item = { product_id: string; description: string; quantity: number; unit_cost: number };

export default function PurchaseInvoicesPage() {
  const { t, language } = useLanguage();
  const { selectedCompanyId } = useCompany();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState<any>(null);
  const [form, setForm] = useState<any>({ invoice_number: "", supplier_id: "", issue_date: new Date().toISOString().slice(0, 10), due_date: "", freight_amount: 0, taxes_amount: 0, other_costs: 0 });
  const [items, setItems] = useState<Item[]>([{ product_id: "", description: "", quantity: 1, unit_cost: 0 }]);

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers", selectedCompanyId], enabled: !!selectedCompanyId,
    queryFn: async () => (await supabase.from("suppliers").select("id,name").eq("company_id", selectedCompanyId!).eq("is_active", true).order("name")).data ?? [],
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products", selectedCompanyId], enabled: !!selectedCompanyId,
    queryFn: async () => (await supabase.from("products").select("id,name,cost_price,current_stock").eq("company_id", selectedCompanyId!).order("name")).data ?? [],
  });
  const { data: rows = [] } = useQuery({
    queryKey: ["purchase_invoices", selectedCompanyId], enabled: !!selectedCompanyId,
    queryFn: async () => (await supabase.from("purchase_invoices").select("*, suppliers(name)").eq("company_id", selectedCompanyId!).order("issue_date", { ascending: false })).data ?? [],
  });

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_cost, 0);
  const total = subtotal + Number(form.freight_amount || 0) + Number(form.taxes_amount || 0) + Number(form.other_costs || 0);

  const save = useMutation({
    mutationFn: async () => {
      if (!form.supplier_id) throw new Error("Selecione o fornecedor");
      if (items.some((i) => !i.product_id || !i.quantity)) throw new Error("Preencha todos os itens");
      const { data: inv, error } = await supabase.from("purchase_invoices").insert({
        company_id: selectedCompanyId, supplier_id: form.supplier_id, invoice_number: form.invoice_number,
        issue_date: form.issue_date, due_date: form.due_date || null,
        freight_amount: Number(form.freight_amount || 0), taxes_amount: Number(form.taxes_amount || 0),
        other_costs: Number(form.other_costs || 0), total_amount: total, status: "pending",
      }).select("id").single();
      if (error) throw error;
      const overhead = Number(form.freight_amount || 0) + Number(form.taxes_amount || 0) + Number(form.other_costs || 0);
      for (const item of items) {
        const itemSubtotal = item.quantity * item.unit_cost;
        const overheadShare = subtotal > 0 ? (overhead * itemSubtotal) / subtotal : 0;
        const realUnitCost = item.unit_cost + overheadShare / item.quantity;
        await supabase.from("purchase_invoice_items").insert({
          invoice_id: inv.id, product_id: item.product_id,
          description: item.description || (products.find((p: any) => p.id === item.product_id) as any)?.name || "",
          quantity: item.quantity, unit_cost: item.unit_cost, total_cost: itemSubtotal + overheadShare,
        });
        await supabase.from("stock_movements").insert({
          company_id: selectedCompanyId, product_id: item.product_id, type: "in",
          quantity: item.quantity, unit_cost: realUnitCost, reference_type: "purchase_invoice", reference_id: inv.id, date: form.issue_date,
        });
        const p: any = products.find((x: any) => x.id === item.product_id);
        if (p) {
          const currentStock = Number(p.current_stock); const currentCost = Number(p.cost_price);
          const newStock = currentStock + item.quantity;
          const newCost = newStock > 0 ? ((currentStock * currentCost) + (item.quantity * realUnitCost)) / newStock : realUnitCost;
          await supabase.from("products").update({ cost_price: Number(newCost.toFixed(4)) }).eq("id", item.product_id);
        }
      }
      await supabase.from("expenses").insert({
        company_id: selectedCompanyId, date: form.issue_date,
        description: `Compra NF ${form.invoice_number || inv.id.slice(0,8)}`,
        category: "Compras", cost_center: "Operacional",
        amount: total, payment_method: "transfer", installments: 1, installment_number: 1, installment_total: 1,
        is_fixed: false, is_personal: false, is_recurring: false,
        source_type: "purchase_invoice", source_id: inv.id,
      } as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase_invoices"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["stock_movements"] });
      setOpen(false); setItems([{ product_id: "", description: "", quantity: 1, unit_cost: 0 }]);
      toast.success("Nota registrada, estoque atualizado e despesa criada");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeInv = useMutation({
    mutationFn: async (inv: any) => {
      await supabase.from("stock_movements").delete().eq("reference_type", "purchase_invoice").eq("reference_id", inv.id);
      await supabase.from("expenses").delete().eq("source_type", "purchase_invoice").eq("source_id", inv.id);
      const { error } = await supabase.from("purchase_invoices").delete().eq("id", inv.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase_invoices"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock_movements"] });
      qc.invalidateQueries({ queryKey: ["expenses"] });
      setDel(null); toast.success("Nota removida");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("purchaseInvoices")}</h1>
        <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />Nova Entrada</Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nº</TableHead><TableHead>Data</TableHead><TableHead>Fornecedor</TableHead>
              <TableHead className="text-right">Total</TableHead><TableHead>Status</TableHead><TableHead className="w-16" />
            </TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma nota registrada</TableCell></TableRow>
              ) : rows.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{r.invoice_number ?? "—"}</TableCell>
                  <TableCell>{formatDate(r.issue_date)}</TableCell>
                  <TableCell>{r.suppliers?.name ?? "—"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(r.total_amount), language)}</TableCell>
                  <TableCell><Badge>{r.status}</Badge></TableCell>
                  <TableCell><Button size="icon" variant="ghost" onClick={() => setDel(r)}><Trash2 size={14} /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Nova Entrada de Nota</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Número da NF</Label><Input value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} /></div>
              <div className="col-span-2"><Label>Fornecedor *</Label>
                <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Emissão</Label><Input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} /></div>
              <div><Label>Vencimento</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            </div>
            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label>Itens</Label>
                <Button size="sm" variant="outline" onClick={() => setItems([...items, { product_id: "", description: "", quantity: 1, unit_cost: 0 }])}><Plus size={14} /></Button>
              </div>
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Select value={it.product_id} onValueChange={(v) => {
                      const p: any = products.find((x: any) => x.id === v);
                      const n = [...items];
                      n[idx] = { ...it, product_id: v, unit_cost: it.unit_cost || Number(p?.cost_price || 0), description: p?.name ?? "" };
                      setItems(n);
                    }}>
                      <SelectTrigger><SelectValue placeholder="Produto" /></SelectTrigger>
                      <SelectContent>{products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2"><Input type="number" step="0.01" placeholder="Qtd" value={it.quantity} onChange={(e) => { const n = [...items]; n[idx].quantity = Number(e.target.value); setItems(n); }} /></div>
                  <div className="col-span-3"><Input type="number" step="0.01" placeholder="Custo unit." value={it.unit_cost} onChange={(e) => { const n = [...items]; n[idx].unit_cost = Number(e.target.value); setItems(n); }} /></div>
                  <div className="col-span-1 text-right text-sm">{(it.quantity * it.unit_cost).toFixed(2)}</div>
                  <div className="col-span-1"><Button size="icon" variant="ghost" onClick={() => setItems(items.filter((_, i) => i !== idx))}><Trash2 size={14} /></Button></div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Frete</Label><Input type="number" step="0.01" value={form.freight_amount} onChange={(e) => setForm({ ...form, freight_amount: e.target.value })} /></div>
              <div><Label>Impostos</Label><Input type="number" step="0.01" value={form.taxes_amount} onChange={(e) => setForm({ ...form, taxes_amount: e.target.value })} /></div>
              <div><Label>Outros custos</Label><Input type="number" step="0.01" value={form.other_costs} onChange={(e) => setForm({ ...form, other_costs: e.target.value })} /></div>
            </div>
            <div className="text-right text-lg font-semibold">Total: {formatCurrency(total, language)}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>Registrar Entrada</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DeleteConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} onConfirm={() => del && removeInv.mutate(del)}
        details="A nota, seus itens, as movimentações de estoque geradas e a despesa vinculada serão removidos. O estoque dos produtos será revertido." />
    </div>
  );
}