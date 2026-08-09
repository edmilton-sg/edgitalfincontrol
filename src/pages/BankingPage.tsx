import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PluggyConnect } from "react-pluggy-connect";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, RefreshCw, Trash2, Link2, Landmark, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatDateString } from "@/lib/formatDate";
import { useLanguage } from "@/i18n/LanguageContext";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";

type Connection = {
  id: string; company_id: string; pluggy_item_id: string; institution_name: string;
  institution_logo: string | null; status: string; status_detail: string | null; last_synced_at: string | null;
};
type Account = { id: string; connection_id: string; name: string; type: string | null; number: string | null; balance: number; };
type BankTx = {
  id: string; account_id: string; date: string; description: string; amount: number;
  type: string; category: string | null; status: string; linked_record_type: string | null; linked_record_id: string | null;
};

export default function BankingPage() {
  const { selectedCompanyId } = useCompany();
  const { language } = useLanguage();
  const qc = useQueryClient();

  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [updateItemId, setUpdateItemId] = useState<string | undefined>(undefined);
  const [opening, setOpening] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Connection | null>(null);
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selected, setSelected] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const { data: connections = [] } = useQuery({
    queryKey: ["bank_connections", selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("bank_connections").select("*")
        .eq("company_id", selectedCompanyId!).order("created_at");
      if (error) throw error;
      return (data ?? []) as Connection[];
    },
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["bank_accounts", selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("bank_accounts").select("*")
        .eq("company_id", selectedCompanyId!).order("name");
      if (error) throw error;
      return (data ?? []) as Account[];
    },
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["bank_transactions", selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("bank_transactions").select("*")
        .eq("company_id", selectedCompanyId!).order("date", { ascending: false }).limit(1000);
      if (error) throw error;
      return (data ?? []) as BankTx[];
    },
  });

  const totalBalance = useMemo(() => accounts.reduce((s, a) => s + Number(a.balance ?? 0), 0), [accounts]);

  const filteredTx = useMemo(() => transactions.filter((t) =>
    (accountFilter === "all" || t.account_id === accountFilter) &&
    (statusFilter === "all" || t.status === statusFilter)
  ), [transactions, accountFilter, statusFilter]);

  const openWidget = async (itemId?: string) => {
    setOpening(true);
    try {
      const { data, error } = await supabase.functions.invoke("pluggy-connect-token", { body: { itemId } });
      if (error) throw error;
      if (!data?.accessToken) throw new Error("Token não recebido");
      setUpdateItemId(itemId);
      setConnectToken(data.accessToken);
    } catch (e: any) {
      toast.error("Não foi possível abrir a conexão", { description: e?.message });
    } finally {
      setOpening(false);
    }
  };

  const runSync = async (connectionId?: string) => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("pluggy-sync", {
        body: { companyId: selectedCompanyId, connectionId },
      });
      if (error) throw error;
      toast.success(`Sincronização concluída`, { description: `${data?.imported ?? 0} transações processadas.` });
      qc.invalidateQueries({ queryKey: ["bank_connections"] });
      qc.invalidateQueries({ queryKey: ["bank_accounts"] });
      qc.invalidateQueries({ queryKey: ["bank_transactions"] });
    } catch (e: any) {
      toast.error("Falha na sincronização", { description: e?.message });
    } finally {
      setSyncing(false);
    }
  };

  const onWidgetSuccess = async (itemData: any) => {
    const item = itemData?.item ?? itemData;
    setConnectToken(null);
    if (!item?.id || !selectedCompanyId) return;
    const { error } = await supabase.from("bank_connections").upsert({
      company_id: selectedCompanyId,
      pluggy_item_id: item.id,
      institution_name: item.connector?.name ?? "Banco",
      institution_logo: item.connector?.imageUrl ?? null,
      status: item.status ?? "UPDATING",
    }, { onConflict: "company_id,pluggy_item_id" });
    if (error) { toast.error("Erro ao salvar conexão", { description: error.message }); return; }
    toast.success("Banco conectado! Sincronizando...");
    await qc.invalidateQueries({ queryKey: ["bank_connections"] });
    runSync();
  };

  const handleDelete = async (conn: Connection) => {
    const { error } = await supabase.from("bank_connections").delete().eq("id", conn.id);
    if (error) { toast.error("Erro ao remover", { description: error.message }); return; }
    toast.success("Conexão removida");
    qc.invalidateQueries({ queryKey: ["bank_connections"] });
    qc.invalidateQueries({ queryKey: ["bank_accounts"] });
    qc.invalidateQueries({ queryKey: ["bank_transactions"] });
    setDeleteItem(null);
  };

  const importSelected = async () => {
    if (!selectedCompanyId || selected.length === 0) return;
    setImporting(true);
    try {
      const items = transactions.filter((t) => selected.includes(t.id) && t.status === "pending");
      for (const t of items) {
        if (t.type === "credit") {
          const { data, error } = await supabase.from("revenues").insert({
            company_id: selectedCompanyId, date: t.date, description: t.description,
            gross_amount: t.amount, fee_amount: 0, net_amount: t.amount, status: "received",
          }).select("id").single();
          if (error) throw error;
          await supabase.from("bank_transactions").update({
            status: "imported", linked_record_type: "revenue", linked_record_id: data.id,
          }).eq("id", t.id);
        } else {
          const { data, error } = await supabase.from("expenses").insert({
            company_id: selectedCompanyId, date: t.date, description: t.description,
            amount: t.amount, category: t.category ?? null,
            source_type: "bank_transaction", source_id: t.id,
          }).select("id").single();
          if (error) throw error;
          await supabase.from("bank_transactions").update({
            status: "imported", linked_record_type: "expense", linked_record_id: data.id,
          }).eq("id", t.id);
        }
      }
      toast.success(`${items.length} transações importadas`);
      setSelected([]);
      qc.invalidateQueries({ queryKey: ["bank_transactions"] });
      qc.invalidateQueries({ queryKey: ["revenues"] });
      qc.invalidateQueries({ queryKey: ["expenses"] });
    } catch (e: any) {
      toast.error("Erro ao importar", { description: e?.message });
    } finally {
      setImporting(false);
    }
  };

  const ignoreSelected = async () => {
    if (selected.length === 0) return;
    await supabase.from("bank_transactions").update({ status: "ignored" }).in("id", selected);
    setSelected([]);
    qc.invalidateQueries({ queryKey: ["bank_transactions"] });
    toast.success("Transações ignoradas");
  };

  const pendingCount = transactions.filter((t) => t.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Bancos</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => runSync()} disabled={syncing || connections.length === 0}>
            {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Sincronizar tudo
          </Button>
          <Button onClick={() => openWidget()} disabled={opening}>
            {opening ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Conectar banco
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Saldo consolidado</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(totalBalance, language)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Bancos conectados</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{connections.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pendentes de conciliação</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{pendingCount}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="connections">
        <TabsList>
          <TabsTrigger value="connections">Conexões</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4 pt-4">
          {connections.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center py-16 text-center">
              <Landmark size={48} className="mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum banco conectado ainda.</p>
              <Button className="mt-4" onClick={() => openWidget()} disabled={opening}>Conectar meu primeiro banco</Button>
            </CardContent></Card>
          ) : connections.map((c) => {
            const connAccounts = accounts.filter((a) => a.connection_id === c.id);
            return (
              <Card key={c.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
                  <div className="flex items-center gap-3">
                    {c.institution_logo ? (
                      <img src={c.institution_logo} alt={`Logo ${c.institution_name}`} className="h-10 w-10 rounded-md object-contain" />
                    ) : <Landmark className="h-10 w-10 text-muted-foreground" />}
                    <div>
                      <p className="font-semibold">{c.institution_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.last_synced_at ? `Última sincronização: ${formatDateString(c.last_synced_at.slice(0, 10), language)}` : "Nunca sincronizado"}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge variant={c.status === "UPDATED" ? "default" : "secondary"}>{c.status}</Badge>
                        {connAccounts.map((a) => (
                          <Badge key={a.id} variant="outline">{a.name || a.type}: {formatCurrency(Number(a.balance), language)}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => runSync(c.id)} disabled={syncing}>
                      <RefreshCw className="mr-1 h-4 w-4" />Sincronizar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openWidget(c.pluggy_item_id)}>
                      <Link2 className="mr-1 h-4 w-4" />Reconectar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteItem(c)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Conta" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as contas</SelectItem>
                {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name || a.type}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="imported">Importadas</SelectItem>
                <SelectItem value="ignored">Ignoradas</SelectItem>
                <SelectItem value="all">Todas</SelectItem>
              </SelectContent>
            </Select>
            {selected.length > 0 && (
              <div className="flex gap-2">
                <Button size="sm" onClick={importSelected} disabled={importing}>
                  {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Importar {selected.length}
                </Button>
                <Button size="sm" variant="outline" onClick={ignoreSelected}>Ignorar</Button>
              </div>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTx.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Nenhuma transação.</TableCell></TableRow>
                  )}
                  {filteredTx.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <Checkbox
                          checked={selected.includes(t.id)}
                          disabled={t.status !== "pending"}
                          onCheckedChange={(v) => setSelected((s) => v ? [...s, t.id] : s.filter((i) => i !== t.id))}
                        />
                      </TableCell>
                      <TableCell>{formatDateString(t.date, language)}</TableCell>
                      <TableCell className="max-w-md truncate">{t.description}</TableCell>
                      <TableCell className="text-muted-foreground">{t.category ?? "—"}</TableCell>
                      <TableCell className={`text-right font-medium ${t.type === "credit" ? "text-success" : "text-destructive"}`}>
                        {t.type === "credit" ? "+" : "-"}{formatCurrency(Number(t.amount), language)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.status === "imported" ? "default" : t.status === "ignored" ? "outline" : "secondary"}>
                          {t.status === "imported" ? "Importada" : t.status === "ignored" ? "Ignorada" : "Pendente"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          updateItem={updateItemId}
          includeSandbox
          onSuccess={onWidgetSuccess}
          onError={(err: any) => { console.error("Pluggy widget error:", err); toast.error("Erro na conexão com o banco"); }}
          onClose={() => setConnectToken(null)}
        />
      )}

      {deleteItem && (
        <DeleteConfirmDialog
          open={!!deleteItem}
          onOpenChange={(o) => !o && setDeleteItem(null)}
          details={`Conexão "${deleteItem.institution_name}": ${accounts.filter((a) => a.connection_id === deleteItem.id).length} conta(s) e ${transactions.filter((t) => accounts.some((a) => a.id === t.account_id && a.connection_id === deleteItem.id)).length} transação(ões) bancária(s) serão removidas. Receitas e despesas já criadas a partir delas permanecem no sistema.`}
          onConfirm={() => handleDelete(deleteItem)}
        />      )}
    </div>
  );
}
