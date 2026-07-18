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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDateString as formatDate } from "@/lib/formatDate";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";

export default function QuotationsPage() {
  const { t } = useLanguage();
  const { selectedCompanyId } = useCompany();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ code: "", date: new Date().toISOString().slice(0, 10), valid_until: "", notes: "", status: "draft" });
  const [del, setDel] = useState<any>(null);

  const { data: rows = [] } = useQuery({
    queryKey: ["quotations", selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => (await supabase.from("quotations").select("*").eq("company_id", selectedCompanyId!).order("date", { ascending: false })).data ?? [],
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("quotations").insert({ ...form, company_id: selectedCompanyId, valid_until: form.valid_until || null });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quotations"] }); setOpen(false); toast.success("Cotação criada"); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("quotations").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quotations"] }); setDel(null); toast.success("Removido"); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("quotations")}</h1>
        <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />Nova Cotação</Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Código</TableHead><TableHead>Data</TableHead><TableHead>Validade</TableHead>
              <TableHead>Status</TableHead><TableHead>Observações</TableHead><TableHead className="w-16" />
            </TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma cotação</TableCell></TableRow>
              ) : rows.map((q: any) => (
                <TableRow key={q.id}>
                  <TableCell>{q.code ?? "—"}</TableCell>
                  <TableCell>{formatDate(q.date)}</TableCell>
                  <TableCell>{q.valid_until ? formatDate(q.valid_until) : "—"}</TableCell>
                  <TableCell><Badge>{q.status}</Badge></TableCell>
                  <TableCell className="max-w-xs truncate">{q.notes ?? "—"}</TableCell>
                  <TableCell><Button size="icon" variant="ghost" onClick={() => setDel(q)}><Trash2 size={14} /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-4 text-xs text-muted-foreground">Registre cotações e compare propostas. Comparação lado a lado por item será habilitada em breve.</p>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Cotação</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Código</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><Label>Válida até</Label><Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} /></div>
            </div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => save.mutate()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DeleteConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} onConfirm={() => del && remove.mutate(del.id)} details="A cotação e seus itens serão removidos." />
    </div>
  );
}