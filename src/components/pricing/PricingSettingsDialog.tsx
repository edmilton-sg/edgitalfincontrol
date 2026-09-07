import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumField } from "./PricingUI";
import { toast } from "sonner";

export type PricingSettings = {
  hourly_rate: number;
  default_tax_percent: number;
  default_commission_percent: number;
  default_target_margin: number;
  payment_terms_days: number[];
  supplier_payment_days: number;
};

const empty: PricingSettings = {
  hourly_rate: 0, default_tax_percent: 0, default_commission_percent: 0,
  default_target_margin: 30, payment_terms_days: [30], supplier_payment_days: 0,
};

/** Parâmetros que valem para toda a empresa e alimentam os cálculos de todos os produtos. */
export function PricingSettingsDialog({
  open, onOpenChange, companyId, initial, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyId: string;
  initial?: PricingSettings;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<PricingSettings>(empty);
  const [termsText, setTermsText] = useState("30");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const s = { ...empty, ...(initial ?? {}) };
    s.hourly_rate = Number(s.hourly_rate);
    s.default_tax_percent = Number(s.default_tax_percent);
    s.default_commission_percent = Number(s.default_commission_percent);
    s.default_target_margin = Number(s.default_target_margin);
    s.supplier_payment_days = Number(s.supplier_payment_days);
    setForm(s);
    setTermsText((s.payment_terms_days ?? [30]).join("/"));
  }, [open, initial]);

  const parseTerms = (txt: string): number[] => {
    const arr = txt.split(/[^0-9]+/).map((x) => parseInt(x, 10)).filter((n) => Number.isFinite(n) && n >= 0);
    return arr.length > 0 ? Array.from(new Set(arr)).sort((a, b) => a - b) : [30];
  };

  const save = async () => {
    if (!companyId) return;
    setSaving(true);
    const payload = { ...form, company_id: companyId, payment_terms_days: parseTerms(termsText) };
    const { error } = await supabase.from("pricing_settings").upsert(payload, { onConflict: "company_id" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Parâmetros salvos");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Parâmetros de precificação</DialogTitle>
          <DialogDescription>
            Valem para todos os produtos. Cada produto pode sobrescrever a margem e as deduções na sua própria configuração.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <NumField
            label="Valor da hora técnica" value={form.hourly_rate}
            onChange={(v) => setForm({ ...form, hourly_rate: v })} suffix="R$"
            hint="Usado nos produtos com mão de obra por hora"
          />
          <NumField
            label="Imposto padrão" value={form.default_tax_percent}
            onChange={(v) => setForm({ ...form, default_tax_percent: v })} suffix="%"
            hint="Alíquota efetiva sobre a venda"
          />
          <NumField
            label="Comissão padrão" value={form.default_commission_percent}
            onChange={(v) => setForm({ ...form, default_commission_percent: v })} suffix="%"
          />
          <NumField
            label="Margem alvo padrão" value={form.default_target_margin}
            onChange={(v) => setForm({ ...form, default_target_margin: v })} suffix="%"
          />
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Prazos de recebimento</Label>
            <Input
              value={termsText}
              placeholder="30/60/90"
              onChange={(e) => setTermsText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Dias após o faturamento, separados por barra. Ex.: <code>30/60/90</code> ou <code>30</code>.
            </p>
          </div>
          <NumField
            label="Prazo do fornecedor" value={form.supplier_payment_days}
            onChange={(v) => setForm({ ...form, supplier_payment_days: Math.max(0, Math.floor(v)) })}
            step="1" suffix="dias" hint="0 = pagamento à vista"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
