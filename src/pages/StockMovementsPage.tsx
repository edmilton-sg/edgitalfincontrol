import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { formatDateString as formatDate } from "@/lib/formatDate";

type Movement = { id: string; product_id: string; type: "in"|"out"|"adjustment"; quantity: number; unit_cost: number; reference_type: string | null; notes: string | null; date: string; };
type Product = { id: string; name: string; unit: string; cost_price: number };

const emptyForm = { product_id: "", type: "in" as const, quantity: 0, unit_cost: 0, notes: "", date: new Date().toISOString().slice(0, 10) };

export default function StockMovementsPage() {
  const { t } = useLanguage();
  const { selectedCompanyId } = useCompany();
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [deleteItem, setDeleteItem] = useState<Movement | null>(null);
  const [productFilter, setProductFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: products = [] } = useQuery({
    queryKey: ["products", selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => (await supabase.from("products").select("id,name,unit,cost_price").eq("company_id", selectedCompanyId!).order("name")).data as Product[] ?? [],
  });

  const { data: rows = [] } = useQuery({
    queryKey: ["stock_movements", selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => (await supabase.from("stock_movements").select("*").eq("company_id", selectedCompanyId!).order("date", { ascending: false }).limit(500)).data as Movement[] ?? [],
  });

  const filtered = useMemo(() => rows.filter((r) =>
    (productFilter === "all" || r.product_id === productFilter) && (typeFilter === "all" || r.type === typeFilter)
  ), [rows, productFilter, typeFilter]);

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? "—";

  const save = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from("stock_movements").insert({ ...payload, company_id: selectedCompanyId, reference_type: "manual", quantity: Number(payload.quantity), unit_cost: Number(payload.unit_cost) });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stock_movements"] }); qc.invalidateQueries({ queryKey: ["products"] }); setFormOpen(false); setForm(emptyForm); toast.success("Movimentação registrada"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("stock_movements").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stock_movements"] }); qc.invalidateQueries({ queryKey: ["products"] }); setDeleteItem(null); toast.success("Removido"); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("stockMovements")}</h1>
        <Button onClick={() => setFormOpen(true)}><Plus size={16} className="mr-2" />Nova Movimentação</Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3">
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os produtos</SelectItem>
                {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="in">Entrada</SelectItem>
                <SelectItem value="out">Saída</SelectItem>
                <SelectItem value="adjustment">Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Data</TableHead><TableHead>Produto</TableHead><TableHead>Tipo</TableHead>
              <TableHead className="text-right">Qtd</TableHead><TableHead className="text-right">Custo Unit.</TableHead>
              <TableHead>Origem</TableHead><TableHead className="w-16" />
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma movimentação</TableCell></TableRow>
              ) : filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{formatDate(m.date)}</TableCell>
                  <TableCell className="font-medium">{productName(m.product_id)}</TableCell>
                  <TableCell><Badge variant={m.type === "in" ? "default" : m.type === "out" ? "destructive" : "secondary"}>{m.type === "in" ? "Entrada" : m.type === "out" ? "Saída" : "Ajuste"}</Badge></TableCell>
                  <TableCell className="text-right">{Number(m.quantity).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-right">{Number(m.unit_cost).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.reference_type ?? "—"}</TableCell>
                  <TableCell>{m.reference_type === "manual" && (<Button size="icon" variant="ghost" onClick={() => setDeleteItem(m)}><Trash2 size={14} /></Button>)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Movimentação</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Produto *</Label>
              <Select value={form.product_id} onValueChange={(v) => { const p = products.find((x) => x.id === v); setForm({ ...form, product_id: v, unit_cost: p?.cost_price ?? 0 }); }}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="in">Entrada</SelectItem><SelectItem value="out">Saída</SelectItem><SelectItem value="adjustment">Ajuste</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Quantidade</Label><Input type="number" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
              <div><Label>Custo Unit.</Label><Input type="number" step="0.01" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Data</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={() => save.mutate(form)} disabled={!form.product_id || !form.quantity || save.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DeleteConfirmDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)} onConfirm={() => deleteItem && del.mutate(deleteItem.id)} details="A movimentação será removida e o estoque do produto será revertido." />
    </div>
  );
}