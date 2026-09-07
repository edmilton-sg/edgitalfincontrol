import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db, type ProductComponentRow } from "@/integrations/supabase/pricingDb";
import { useCompany } from "@/contexts/CompanyContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, Settings2, AlertTriangle, Package, Wrench } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/formatCurrency";
import { BomEditor, type BomRow } from "@/components/pricing/BomEditor";
import { Metric, NumField, BreakdownRow } from "@/components/pricing/PricingUI";
import { PricingSettingsDialog, type PricingSettings } from "@/components/pricing/PricingSettingsDialog";
import { QuotePanel } from "@/components/pricing/QuotePanel";
import { computeCost, computePrice, computeBatch, computeRental, type LaborMode, type PricingMode } from "@/lib/pricing";

type Product = {
  id: string; name: string; sku: string | null; unit: string;
  cost_price: number; sale_price: number;
  product_type: "resale" | "assembled";
  labor_mode: LaborMode; labor_hours: number; labor_fixed_cost: number;
};

type Config = {
  id?: string;
  pricing_mode: PricingMode;
  fixed_sale_price: number;
  target_margin_percent: number;
  inbound_freight: number; outbound_freight: number;
  installation_cost: number; packaging_cost: number;
  tax_percent: number; commission_percent: number;
  other_percent: number; other_fixed: number;
  batch_units: number;
  rental_months: number; rental_markup: number; rental_support_cost: number;
};

const emptyConfig: Config = {
  pricing_mode: "target_margin", fixed_sale_price: 0, target_margin_percent: 30,
  inbound_freight: 0, outbound_freight: 0, installation_cost: 0, packaging_cost: 0,
  tax_percent: 0, commission_percent: 0, other_percent: 0, other_fixed: 0,
  batch_units: 1, rental_months: 12, rental_markup: 1.5, rental_support_cost: 0,
};

export default function PricingPage() {
  const { t, language } = useLanguage();
  const { selectedCompanyId } = useCompany();
  const qc = useQueryClient();
  const [params] = useSearchParams();

  const [productId, setProductId] = useState(params.get("product") ?? "");
  const [cfg, setCfg] = useState<Config>(emptyConfig);
  const [bom, setBom] = useState<BomRow[]>([]);
  const [labor, setLabor] = useState({ mode: "none" as LaborMode, hours: 0, fixed: 0 });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const money = (v: number) => formatCurrency(v, language);
  const pct = (v: number) => `${v.toFixed(2)}%`;

  const { data: products = [] } = useQuery({
    queryKey: ["products", selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data, error } = await db.from("products")
        .select("id,name,sku,unit,cost_price,sale_price,product_type,labor_mode,labor_hours,labor_fixed_cost")
        .eq("company_id", selectedCompanyId!).eq("is_active", true).order("name");
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["pricing_settings", selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data } = await db.from("pricing_settings").select("*").eq("company_id", selectedCompanyId!).maybeSingle();
      return data ?? { hourly_rate: 0, default_tax_percent: 0, default_commission_percent: 0, default_target_margin: 30, payment_terms_days: [30], supplier_payment_days: 0 };
    },
  });

  const product = products.find((p) => p.id === productId);
  const isAssembled = product?.product_type === "assembled";

  // carrega ficha técnica e configuração ao trocar de produto
  useEffect(() => {
    if (!productId || !selectedCompanyId) return;
    let cancelled = false;
    (async () => {
      const [{ data: comps }, { data: conf }] = await Promise.all([
        db.from("product_components").select("*").eq("parent_product_id", productId).order("order_index"),
        db.from("pricing_configs").select("*").eq("product_id", productId).eq("is_active", true).maybeSingle(),
      ]);
      if (cancelled) return;
      setBom(((comps ?? []) as ProductComponentRow[]).map((c) => ({
        id: c.id, component_product_id: c.component_product_id,
        description: c.description, quantity: Number(c.quantity), unit_cost: Number(c.unit_cost),
      })));
      setCfg(conf ? { ...emptyConfig, ...numify(conf) } : {
        ...emptyConfig,
        tax_percent: Number(settings?.default_tax_percent ?? 0),
        commission_percent: Number(settings?.default_commission_percent ?? 0),
        target_margin_percent: Number(settings?.default_target_margin ?? 30),
      });
      const p = products.find((x) => x.id === productId);
      setLabor({ mode: (p?.labor_mode ?? "none") as LaborMode, hours: Number(p?.labor_hours ?? 0), fixed: Number(p?.labor_fixed_cost ?? 0) });
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, selectedCompanyId, products.length]);

  const cost = useMemo(() => computeCost({
    bom: isAssembled ? bom : [],
    purchaseCost: isAssembled ? 0 : Number(product?.cost_price ?? 0),
    inboundFreight: cfg.inbound_freight, outboundFreight: cfg.outbound_freight,
    installation: cfg.installation_cost, packaging: cfg.packaging_cost, extraCost: 0,
    laborMode: labor.mode, laborHours: labor.hours,
    hourlyRate: Number(settings?.hourly_rate ?? 0), laborFixed: labor.fixed,
  }), [bom, isAssembled, product, cfg, labor, settings]);

  const price = useMemo(() => computePrice({
    cost: cost.total,
    taxPercent: cfg.tax_percent, commissionPercent: cfg.commission_percent,
    otherPercent: cfg.other_percent, otherFixed: cfg.other_fixed,
    mode: cfg.pricing_mode, targetMargin: cfg.target_margin_percent, fixedPrice: cfg.fixed_sale_price,
  }), [cost.total, cfg]);

  const batch = useMemo(() => computeBatch({
    units: cfg.batch_units, unitCost: cost.total, unitNetProfit: price.netProfit,
    salePrice: price.salePrice,
    paymentTerms: settings?.payment_terms_days ?? [30],
    supplierDays: Number(settings?.supplier_payment_days ?? 0),
  }), [cfg.batch_units, cost.total, price, settings]);

  const rental = useMemo(() => computeRental({
    unitCost: cost.total, units: cfg.batch_units,
    months: cfg.rental_months, markup: cfg.rental_markup, supportCost: cfg.rental_support_cost,
  }), [cost.total, cfg]);

  const save = useMutation({
    mutationFn: async () => {
      if (!productId || !selectedCompanyId) throw new Error("Selecione um produto");

      if (isAssembled) {
        await db.from("product_components").delete().eq("parent_product_id", productId);
        if (bom.length > 0) {
          const { error } = await db.from("product_components").insert(
            bom.map((r, idx) => ({
              company_id: selectedCompanyId, parent_product_id: productId,
              component_product_id: r.component_product_id, description: r.description || "Insumo",
              quantity: r.quantity, unit_cost: r.unit_cost, order_index: idx,
            }))
          );
          if (error) throw error;
        }
      }

      const { error: pe } = await db.from("products").update({
        labor_mode: labor.mode, labor_hours: labor.hours, labor_fixed_cost: labor.fixed,
        sale_price: Number(price.salePrice.toFixed(2)),
      }).eq("id", productId);
      if (pe) throw pe;

      const { id: _configId, ...cfgFields } = cfg;
      const payload = { ...cfgFields, company_id: selectedCompanyId, product_id: productId, is_active: true };
      if (cfg.id) {
        const { error } = await db.from("pricing_configs").update(payload).eq("id", cfg.id);
        if (error) throw error;
      } else {
        const { data, error } = await db.from("pricing_configs").insert({ ...payload, name: "Padrão" }).select("id").single();
        if (error) throw error;
        setCfg((c) => ({ ...c, id: data.id }));
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Precificação salva. Custo e preço do produto atualizados.");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha ao salvar"),
  });

  const set = <K extends keyof Config>(k: K, v: Config[K]) => setCfg((c) => ({ ...c, [k]: v }));
  const catalog = products.filter((p) => p.id !== productId).map((p) => ({ id: p.id, name: p.name, cost_price: Number(p.cost_price) }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("pricing")}</h1>
          <p className="text-sm text-muted-foreground">
            Custo real, preço, margem e capital de giro — para produtos montados e de revenda.
          </p>
        </div>
        <Button variant="outline" onClick={() => setSettingsOpen(true)}>
          <Settings2 size={14} className="mr-1" />Parâmetros da empresa
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Produto</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger className="max-w-md"><SelectValue placeholder="Selecione um produto..." /></SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}{p.sku ? ` · ${p.sku}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {product && (
            <Badge variant={isAssembled ? "default" : "secondary"} className="gap-1">
              {isAssembled ? <Wrench size={12} /> : <Package size={12} />}
              {isAssembled ? "Montado" : "Revenda"}
            </Badge>
          )}
          {product && (
            <Button className="ml-auto" onClick={() => save.mutate()} disabled={save.isPending}>
              <Save size={14} className="mr-1" />Salvar
            </Button>
          )}
        </CardContent>
      </Card>

      {!product && (
        <Alert>
          <AlertDescription>
            Escolha um produto para precificar. O tipo — <strong>montado</strong> (com ficha técnica de insumos)
            ou <strong>revenda</strong> (comprado pronto) — é definido no cadastro do produto.
          </AlertDescription>
        </Alert>
      )}

      {product && (
        <Tabs defaultValue="cost">
          <TabsList>
            <TabsTrigger value="cost">Custo</TabsTrigger>
            <TabsTrigger value="price">Preço e margem</TabsTrigger>
            <TabsTrigger value="batch">Lote e caixa</TabsTrigger>
            <TabsTrigger value="rental">Locação</TabsTrigger>
            <TabsTrigger value="quote">Orçamento</TabsTrigger>
          </TabsList>

          {/* ---------------- CUSTO ---------------- */}
          <TabsContent value="cost" className="space-y-4 pt-4">
            {isAssembled ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Ficha técnica</CardTitle>
                  <CardDescription>
                    Os insumos que compõem uma unidade. Escolher um insumo do catálogo traz o custo cadastrado dele.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BomEditor rows={bom} onChange={setBom} catalog={catalog} language={language} />
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <Package className="h-4 w-4" />
                <AlertDescription>
                  Produto de revenda: o custo de materiais é o <strong>custo de aquisição</strong> cadastrado
                  no produto ({money(Number(product.cost_price))}). Os custos abaixo somam a ele.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Mão de obra</CardTitle>
                  <CardDescription>Definida por produto: por hora ou valor fixo por unidade.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Forma de cálculo</Label>
                    <Select value={labor.mode} onValueChange={(v) => setLabor({ ...labor, mode: v as LaborMode })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem mão de obra</SelectItem>
                        <SelectItem value="hourly">Por hora</SelectItem>
                        <SelectItem value="fixed">Valor fixo por unidade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {labor.mode === "hourly" && (
                    <div className="grid grid-cols-2 gap-3">
                      <NumField label="Horas por unidade" value={labor.hours} onChange={(v) => setLabor({ ...labor, hours: v })} suffix="h" />
                      <NumField
                        label="Valor da hora" value={Number(settings?.hourly_rate ?? 0)} onChange={() => {}}
                        suffix="R$" disabled hint="Definido nos parâmetros da empresa"
                      />
                    </div>
                  )}
                  {labor.mode === "fixed" && (
                    <NumField label="Custo de montagem por unidade" value={labor.fixed} onChange={(v) => setLabor({ ...labor, fixed: v })} suffix="R$" />
                  )}
                  {labor.mode === "hourly" && Number(settings?.hourly_rate ?? 0) === 0 && (
                    <Alert variant="destructive" className="py-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        O valor da hora está zerado — a mão de obra não entra no custo. Defina em Parâmetros da empresa.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Outros custos por unidade</CardTitle>
                  <CardDescription>Tudo que sai do caixa e não está na ficha técnica.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <NumField label="Frete de compra" value={cfg.inbound_freight} onChange={(v) => set("inbound_freight", v)} suffix="R$" hint="Frete pago para receber os insumos" />
                  <NumField label="Frete de entrega" value={cfg.outbound_freight} onChange={(v) => set("outbound_freight", v)} suffix="R$" hint="Frete para levar ao cliente" />
                  <NumField label="Instalação" value={cfg.installation_cost} onChange={(v) => set("installation_cost", v)} suffix="R$" hint="Deslocamento e horas em campo" />
                  <NumField label="Embalagem" value={cfg.packaging_cost} onChange={(v) => set("packaging_cost", v)} suffix="R$" />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Composição do custo unitário</CardTitle></CardHeader>
              <CardContent>
                <BreakdownRow label="Materiais" value={money(cost.materials)} />
                <BreakdownRow label="Mão de obra" value={money(cost.labor)} muted={cost.labor === 0} />
                <BreakdownRow label="Frete de compra" value={money(cost.inboundFreight)} muted={cost.inboundFreight === 0} />
                <BreakdownRow label="Frete de entrega" value={money(cost.outboundFreight)} muted={cost.outboundFreight === 0} />
                <BreakdownRow label="Instalação" value={money(cost.installation)} muted={cost.installation === 0} />
                <BreakdownRow label="Embalagem" value={money(cost.packaging)} muted={cost.packaging === 0} />
                <BreakdownRow label="Custo total por unidade" value={money(cost.total)} strong />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- PREÇO ---------------- */}
          <TabsContent value="price" className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Como definir o preço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={cfg.pricing_mode} onValueChange={(v) => set("pricing_mode", v as PricingMode)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="target_margin">Pela margem desejada → calcula o preço</SelectItem>
                      <SelectItem value="fixed_price">Pelo preço praticado → calcula a margem</SelectItem>
                    </SelectContent>
                  </Select>
                  {cfg.pricing_mode === "target_margin" ? (
                    <NumField
                      label="Margem líquida desejada" value={cfg.target_margin_percent}
                      onChange={(v) => set("target_margin_percent", v)} suffix="%"
                      hint="Sobre o preço de venda, já descontados imposto e comissão"
                    />
                  ) : (
                    <NumField
                      label="Preço de venda praticado" value={cfg.fixed_sale_price}
                      onChange={(v) => set("fixed_sale_price", v)} suffix="R$"
                      hint="A margem resultante aparece ao lado"
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Deduções sobre a venda</CardTitle>
                  <CardDescription>Incidem sobre o preço, não sobre o custo.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <NumField label="Imposto" value={cfg.tax_percent} onChange={(v) => set("tax_percent", v)} suffix="%" hint="Alíquota efetiva" />
                  <NumField label="Comissão" value={cfg.commission_percent} onChange={(v) => set("commission_percent", v)} suffix="%" />
                  <NumField label="Outras taxas" value={cfg.other_percent} onChange={(v) => set("other_percent", v)} suffix="%" hint="Cartão, marketplace…" />
                  <NumField label="Dedução fixa" value={cfg.other_fixed} onChange={(v) => set("other_fixed", v)} suffix="R$" />
                </CardContent>
              </Card>
            </div>

            {price.impossible && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Margem desejada somada às deduções chega a 100% ou mais — não existe preço que atenda.
                  Reduza a margem alvo ou as deduções.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader className="pb-3"><CardTitle className="text-base">Do preço ao lucro</CardTitle></CardHeader>
                <CardContent>
                  <BreakdownRow label="Preço de venda" value={money(price.salePrice)} strong />
                  <BreakdownRow label="(−) Custo unitário" value={`− ${money(cost.total)}`} indent negative />
                  <BreakdownRow label="(−) Imposto" value={`− ${money(price.taxAmount)}`} indent negative muted={price.taxAmount === 0} />
                  <BreakdownRow label="(−) Comissão" value={`− ${money(price.commissionAmount)}`} indent negative muted={price.commissionAmount === 0} />
                  <BreakdownRow label="(−) Outras deduções" value={`− ${money(price.otherAmount)}`} indent negative muted={price.otherAmount === 0} />
                  <BreakdownRow label="= Lucro líquido por unidade" value={money(price.netProfit)} strong />
                </CardContent>
              </Card>
              <div className="grid gap-3 content-start">
                <Metric
                  label={cfg.pricing_mode === "target_margin" ? "Preço calculado" : "Preço praticado"}
                  value={money(price.salePrice)} tone="primary" large
                />
                <Metric
                  label="Margem líquida" value={pct(price.netMarginPercent)}
                  tone={price.netMarginPercent < 0 ? "negative" : price.netMarginPercent >= 20 ? "positive" : "neutral"}
                  hint="Do preço de venda"
                />
                <Metric label="Markup" value={pct(price.markupPercent)} hint="Quanto o preço supera o custo" />
                <Metric label="ROI por unidade" value={pct(price.roiPercent)} hint="Lucro sobre o capital investido" />
              </div>
            </div>
          </TabsContent>

          {/* ---------------- LOTE E CAIXA ---------------- */}
          <TabsContent value="batch" className="space-y-4 pt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Simulação de lote</CardTitle>
                <CardDescription>
                  Prazos de recebimento e de pagamento a fornecedores vêm dos parâmetros da empresa.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-end gap-4">
                <div className="w-40">
                  <NumField label="Quantidade" value={cfg.batch_units} onChange={(v) => set("batch_units", Math.max(1, Math.floor(v)))} step="1" suffix="un" />
                </div>
                <div className="text-sm text-muted-foreground">
                  Recebimento em {(settings?.payment_terms_days ?? [30]).join("/")} dias ·
                  fornecedor em {Number(settings?.supplier_payment_days ?? 0)} dias
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-4">
              <Metric label="Custo de produção" value={money(batch.totalCost)} hint={`${cfg.batch_units} un × ${money(cost.total)}`} />
              <Metric label="Receita do lote" value={money(batch.totalRevenue)} tone="primary" />
              <Metric label="Lucro líquido" value={money(batch.totalNetProfit)} tone={batch.totalNetProfit < 0 ? "negative" : "positive"} />
              <Metric label="Capital de giro" value={money(batch.workingCapital)} tone={batch.workingCapital > 0 ? "negative" : "neutral"} hint="Sai do caixa antes do 1º recebimento" />
            </div>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Quando o dinheiro entra</CardTitle></CardHeader>
              <CardContent>
                {batch.installments.map((p, i) => (
                  <BreakdownRow
                    key={i}
                    label={`Parcela ${i + 1} de ${batch.installments.length} — ${p.days} dias após o faturamento`}
                    value={money(p.amount)}
                  />
                ))}
                <BreakdownRow label="Total a receber" value={money(batch.totalRevenue)} strong />
                {batch.workingCapital > 0 && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      É preciso desembolsar <strong>{money(batch.totalCost)}</strong> antes de receber a primeira parcela,
                      que só entra {batch.installments[0]?.days} dias após o faturamento.
                      Confirme se o caixa suporta antes de fechar o pedido.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- LOCAÇÃO ---------------- */}
          <TabsContent value="rental" className="space-y-4 pt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Parâmetros da locação</CardTitle>
                <CardDescription>O equipamento é depreciado no prazo escolhido e o markup remunera o capital.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <NumField label="Prazo de depreciação" value={cfg.rental_months} onChange={(v) => set("rental_months", Math.max(1, Math.floor(v)))} step="1" suffix="meses" />
                <NumField label="Markup" value={cfg.rental_markup} onChange={(v) => set("rental_markup", v)} suffix="×" hint="1,5 = 50% sobre a depreciação" />
                <NumField label="Suporte mensal" value={cfg.rental_support_cost} onChange={(v) => set("rental_support_cost", v)} suffix="R$" hint="Por unidade" />
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-4">
              <Metric label="Mensalidade por unidade" value={money(rental.monthlyPerUnit)} tone="primary" />
              <Metric label={`Mensal (${cfg.batch_units} un)`} value={money(rental.monthlyTotal)} />
              <Metric label="Anual" value={money(rental.annualTotal)} />
              <Metric label="Payback" value={`${rental.paybackMonths.toFixed(1)} meses`} hint="Até cobrir o custo do equipamento" />
            </div>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Venda × locação</CardTitle></CardHeader>
              <CardContent>
                <BreakdownRow label={`Venda — lucro imediato (${cfg.batch_units} un)`} value={money(batch.totalNetProfit)} />
                <BreakdownRow label={`Locação — resultado em 12 meses (${cfg.batch_units} un)`} value={money(rental.annualResult)} />
                <BreakdownRow
                  label="Diferença em 12 meses"
                  value={money(rental.annualResult - batch.totalNetProfit)}
                  strong
                  negative={rental.annualResult - batch.totalNetProfit < 0}
                />
                <p className="mt-3 text-xs text-muted-foreground">
                  Na locação o equipamento continua sendo seu e gera receita depois do payback — mas o capital fica
                  imobilizado. Na venda o caixa volta rápido, e acaba ali.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- ORÇAMENTO ---------------- */}
          <TabsContent value="quote" className="pt-4">
            <QuotePanel
              productName={product.name}
              unit={product.unit}
              units={cfg.batch_units}
              unitPrice={price.salePrice}
              installments={batch.installments}
              language={language}
            />
          </TabsContent>
        </Tabs>
      )}

      <PricingSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        companyId={selectedCompanyId ?? ""}
        initial={settings as PricingSettings | undefined}
        onSaved={() => qc.invalidateQueries({ queryKey: ["pricing_settings"] })}
      />
    </div>
  );
}

/** Converte os numéricos que o Supabase devolve como string. */
function numify(row: Record<string, unknown>): Partial<Config> {
  const out: Record<string, unknown> = {
    id: row.id,
    pricing_mode: (row.pricing_mode as PricingMode) ?? "target_margin",
  };
  for (const k of ["fixed_sale_price","target_margin_percent","inbound_freight","outbound_freight",
    "installation_cost","packaging_cost","tax_percent","commission_percent","other_percent",
    "other_fixed","batch_units","rental_months","rental_markup","rental_support_cost"]) {
    if (row[k] !== undefined && row[k] !== null) out[k] = Number(row[k]);
  }
  return out as Partial<Config>;
}
