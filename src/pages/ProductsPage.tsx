import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, Tag as TagIcon, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/formatCurrency";

type Product = {
  id: string; company_id: string; sku: string | null; name: string;
  description: string | null; unit: string; category: string | null;
  cost_price: number; sale_price: number; current_stock: number; min_stock: number; is_active: boolean;
};
const emptyForm: Partial<Product> = { name: "", sku: "", unit: "un", category: "", cost_price: 0, sale_price: 0, current_stock: 0, min_stock: 0, is_active: true };

export default function ProductsPage() {
  const { t, language } = useLanguage();
  const { selectedCompanyId } = useCompany();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [deleteItem, setDeleteItem] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>(emptyForm);
  const [search, setSearch] = useState("");

  const { data: rows = [] } = useQuery({
    queryKey: ["products", selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*")
        .eq("company_id", selectedCompanyId!).order("name");
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const filtered = useMemo(() => rows.filter((r) =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || (r.sku ?? "").toLowerCase().includes(search.toLowerCase())
  ), [rows, search]);

  const save = useMutation({
    mutationFn: async (payload: Partial<Product>) => {
      const body: any = { ...payload,
        cost_price: Number(payload.cost_price ?? 0),
        sale_price: Number(payload.sale_price ?? 0),
        current_stock: Number(payload.current_stock ?? 0),
        min_stock: Number(payload.min_stock ?? 0),
      };
      if (editItem) {
        const { error } = await supabase.from("products").update(body).eq("id", editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert({ ...body, company_id: selectedCompanyId });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setFormOpen(false); setEditItem(null); setForm(emptyForm); toast.success("Salvo"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setDeleteItem(null); toast.success("Produto removido"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("products")}</h1>
        <Button onClick={() => { setEditItem(null); setForm(emptyForm); setFormOpen(true); }}><Plus size={16} className="mr-2" />Novo Produto</Button>
      </div>
      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Venda</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum produto cadastrado</TableCell></TableRow>
              ) : filtered.map((p) => {
                const low = Number(p.current_stock) <= Number(p.min_stock);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.sku ?? "—"}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.category ?? "—"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(p.cost_price), language)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(p.sale_price), language)}</TableCell>
                    <TableCell className="text-right">
                      <span className={low ? "text-destructive font-semibold" : ""}>
                        {Number(p.current_stock).toLocaleString(language)} {p.unit}
                      </span>
                      {low && <AlertTriangle size={14} className="inline ml-1 text-destructive" />}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" title="Precificação" onClick={() => navigate(`/pricing?product=${p.id}`)}><TagIcon size={14} /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { setEditItem(p); setForm(p); setFormOpen(true); }}><Pencil size={14} /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteItem(p)}><Trash2 size={14} /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editItem ? "Editar" : "Novo"} Produto</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2"><Label>Nome *</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>SKU</Label><Input value={form.sku ?? ""} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Unidade</Label><Input value={form.unit ?? "un"} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
              <div className="col-span-2"><Label>Categoria</Label><Input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            </div>
            <div><Label>Descrição</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-4 gap-3">
              <div><Label>Custo</Label><Input type="number" step="0.01" value={form.cost_price ?? 0} onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })} /></div>
              <div><Label>Preço Venda</Label><Input type="number" step="0.01" value={form.sale_price ?? 0} onChange={(e) => setForm({ ...form, sale_price: Number(e.target.value) })} /></div>
              <div><Label>Estoque</Label><Input type="number" step="0.01" value={form.current_stock ?? 0} onChange={(e) => setForm({ ...form, current_stock: Number(e.target.value) })} disabled={!!editItem} /></div>
              <div><Label>Est. Mínimo</Label><Input type="number" step="0.01" value={form.min_stock ?? 0} onChange={(e) => setForm({ ...form, min_stock: Number(e.target.value) })} /></div>
            </div>
            {editItem && <p className="text-xs text-muted-foreground">O estoque só pode ser alterado via Movimentações ou Entrada de Nota.</p>}
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active ?? true} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={() => save.mutate(form)} disabled={!form.name || save.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteItem}
        onOpenChange={(o) => !o && setDeleteItem(null)}
        onConfirm={() => deleteItem && del.mutate(deleteItem.id)}
        details={`O produto "${deleteItem?.name}" e todas suas movimentações serão removidos permanentemente.`}
      />
    </div>
  );
}