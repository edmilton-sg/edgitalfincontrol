import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/formatCurrency";

type Product = { id: string; name: string; cost_price: number; sale_price: number };
type Component = { id?: string; kind: string; label: string; value_type: "percent" | "fixed"; value: number; order_index: number };

const defaultComponents: Component[] = [
  { kind: "cost",    label: "Custo do produto",  value_type: "fixed",   value: 0,   order_index: 0 },
  { kind: "freight", label: "Frete",             value_type: "fixed",   value: 0,   order_index: 1 },
  { kind: "tax",     label: "Simples Nacional",  value_type: "percent", value: 6,   order_index: 2 },
  { kind: "fee",     label: "Taxa cartão",       value_type: "percent", value: 3.5, order_index: 3 },
  { kind: "margin",  label: "Margem de lucro",   value_type: "percent", value: 30,  order_index: 4 },
];

export default function PricingPage() {
  const { t, language } = useLanguage();
  const { selectedCompanyId } = useCompany();
  const qc = useQueryClient();
  const [params] = useSearchParams();

  const [productId, setProductId] = useState<string>(params.get("product") ?? "");
  const [components, setComponents] = useState<Component[]>(defaultComponents);
  const [units, setUnits] = useState<number>(1);
  const [configId, setConfigId] = useState<string | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["products", selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => (await supabase.from("products").select("id,name,cost_price,sale_price").eq("company_id", selectedCompanyId!).order("name")).data as Product[] ?? [],
  });

  const product = products.find((p) => p.id === productId);

  useEffect(() => {
    if (!productId || !selectedCompanyId) return;
    (async () => {
      const { data: cfg } = await supabase.from("pricing_configs").select("*").eq("product_id", productId).eq("is_active", true).maybeSingle();
      if (cfg) {
        setConfigId(cfg.id);
        const { data: comps } = await supabase.from("pricing_components").select("*").eq("config_id", cfg.id).order("order_index");
        if (comps && comps.length > 0) {
          setComponents(comps.map((c: any) => ({ id: c.id, kind: c.kind, label: c.label, value_type: c.value_type, value: Number(c.value), order_index: c.order_index })));
          return;
        }
      } else { setConfigId(null); }
      if (product) setComponents(defaultComponents.map((c) => c.kind === "cost" ? { ...c, value: Number(product.cost_price) } : c));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, selectedCompanyId]);

  const calc = useMemo(() => {
    const costBase = components.filter((c) => c.kind === "cost" || c.kind === "freight" || c.kind === "other")
      .reduce((s, c) => s + (c.value_type === "fixed" ? c.value : 0), 0);
    const marginPct = components.filter((c) => c.kind === "margin").reduce((s, c) => s + (c.value_type === "percent" ? c.value : 0), 0);
    const taxFeePct = components.filter((c) => c.kind === "tax" || c.kind === "fee").reduce((s, c) => s + (c.value_type === "percent" ? c.value : 0), 0);
    const taxFeeFixed = components.filter((c) => c.kind === "tax" || c.kind === "fee").reduce((s, c) => s + (c.value_type === "fixed" ? c.value : 0), 0);
    const denom = 1 - (marginPct + taxFeePct) / 100;
    const salePrice = denom > 0 ? (costBase + taxFeeFixed) / denom : 0;
    const totalTaxesFees = salePrice * (taxFeePct / 100) + taxFeeFixed;
    const grossProfit = salePrice - costBase;
    const netProfit = salePrice - costBase - totalTaxesFees;
    const markup = costBase > 0 ? ((salePrice / costBase) - 1) * 100 : 0;
    const marginRealPct = salePrice > 0 ? (netProfit / salePrice) * 100 : 0;
    const roi = costBase > 0 ? (netProfit / costBase) * 100 : 0;
    return { costBase, salePrice, grossProfit, netProfit, totalTaxesFees, markup, marginRealPct, roi,
      totalUnits: salePrice * units, totalCostUnits: costBase * units, totalProfitUnits: netProfit * units };
  }, [components, units]);

  const save = useMutation({
    mutationFn: async () => {
      if (!productId || !selectedCompanyId) throw new Error("Selecione um produto");
      let cid = configId;
      if (!cid) {
        const { data, error } = await supabase.from("pricing_configs").insert({ company_id: selectedCompanyId, product_id: productId, name: "Padrão", is_active: true }).select("id").single();
        if (error) throw error;
        cid = data.id;
      }
      await supabase.from("pricing_components").delete().eq("config_id", cid);
      const { error: e2 } = await supabase.from("pricing_components").insert(
        components.map((c, idx) => ({ config_id: cid, kind: c.kind, label: c.label, value_type: c.value_type, value: c.value, order_index: idx }))
      );
      if (e2) throw e2;
      await supabase.from("products").update({ sale_price: Number(calc.salePrice.toFixed(2)) }).eq("id", productId);
      setConfigId(cid);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success("Precificação salva e preço do produto atualizado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const addComp = () => setComponents([...components, { kind: "other", label: "Novo", value_type: "percent", value: 0, order_index: components.length }]);
  const updComp = (i: number, patch: Partial<Component>) => setComponents(components.map((c, idx) => idx === i ? { ...c, ...patch } : c));
  const rmComp = (i: number) => setComponents(components.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("pricing")}</h1>
      <Card>
        <CardHeader><CardTitle>Produto</CardTitle></CardHeader>
        <CardContent>
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger className="max-w-md"><SelectValue placeholder="Selecione um produto..." /></SelectTrigger>
            <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>
      {productId && (<>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Componentes</CardTitle>
            <Button size="sm" variant="outline" onClick={addComp}><Plus size={14} className="mr-1" />Adicionar</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Descrição</TableHead><TableHead>Formato</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
              <TableBody>
                {components.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Select value={c.kind} onValueChange={(v) => updComp(i, { kind: v })}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cost">Custo</SelectItem><SelectItem value="freight">Frete</SelectItem>
                          <SelectItem value="tax">Imposto</SelectItem><SelectItem value="fee">Taxa</SelectItem>
                          <SelectItem value="margin">Margem</SelectItem><SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><Input value={c.label} onChange={(e) => updComp(i, { label: e.target.value })} /></TableCell>
                    <TableCell>
                      <Select value={c.value_type} onValueChange={(v) => updComp(i, { value_type: v as any })}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="percent">%</SelectItem><SelectItem value="fixed">R$</SelectItem></SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><Input type="number" step="0.01" className="text-right" value={c.value} onChange={(e) => updComp(i, { value: Number(e.target.value) })} /></TableCell>
                    <TableCell><Button size="icon" variant="ghost" onClick={() => rmComp(i)}><Trash2 size={14} /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Resultado</CardTitle>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Unidades:</Label>
              <Input type="number" className="w-24" value={units} onChange={(e) => setUnits(Number(e.target.value) || 1)} />
              <Button onClick={() => save.mutate()} disabled={save.isPending}><Save size={14} className="mr-1" />Salvar</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Metric label="Custo Unitário" value={formatCurrency(calc.costBase, language)} />
              <Metric label="Preço de Venda" value={formatCurrency(calc.salePrice, language)} highlight />
              <Metric label="Lucro Bruto" value={formatCurrency(calc.grossProfit, language)} />
              <Metric label="Lucro Líquido" value={formatCurrency(calc.netProfit, language)} />
              <Metric label="Markup" value={`${calc.markup.toFixed(2)}%`} />
              <Metric label="Margem Real" value={`${calc.marginRealPct.toFixed(2)}%`} />
              <Metric label="ROI" value={`${calc.roi.toFixed(2)}%`} />
              <Metric label="Impostos + Taxas" value={formatCurrency(calc.totalTaxesFees, language)} />
            </div>
            <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4">
              <Metric label={`Custo total (${units}u)`} value={formatCurrency(calc.totalCostUnits, language)} />
              <Metric label={`Receita total (${units}u)`} value={formatCurrency(calc.totalUnits, language)} />
              <Metric label={`Lucro total (${units}u)`} value={formatCurrency(calc.totalProfitUnits, language)} highlight />
            </div>
          </CardContent>
        </Card>
      </>)}
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? "bg-primary/5 border-primary/30" : ""}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${highlight ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}