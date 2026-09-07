import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import { formatCurrency } from "@/lib/formatCurrency";
import type { Language } from "@/i18n/translations";

type Installment = { days: number; amount: number };

/**
 * Resumo para enviar ao cliente. Mostra apenas preço, quantidade e condição de
 * pagamento — nunca custo, margem ou qualquer número interno.
 */
export function QuotePanel({
  productName, unit, units, unitPrice, installments, language,
}: {
  productName: string; unit: string; units: number;
  unitPrice: number; installments: Installment[]; language: Language;
}) {
  const [client, setClient] = useState("");
  const [validity, setValidity] = useState(15);
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const money = (v: number) => formatCurrency(v, language);
  const total = unitPrice * units;

  const text = [
    "PROPOSTA COMERCIAL",
    client ? `Cliente: ${client}` : null,
    `Data: ${new Date().toLocaleDateString(language === "pt-BR" ? "pt-BR" : "en-US")}`,
    "",
    `${productName}`,
    `Quantidade: ${units} ${unit}`,
    `Valor unitário: ${money(unitPrice)}`,
    `Valor total: ${money(total)}`,
    "",
    "Condição de pagamento:",
    ...installments.map((p, i) =>
      installments.length === 1
        ? `  ${p.days === 0 ? "À vista" : `${p.days} dias`}: ${money(p.amount)}`
        : `  Parcela ${i + 1}/${installments.length} — ${p.days} dias: ${money(p.amount)}`
    ),
    "",
    `Validade da proposta: ${validity} dias`,
    notes ? `\nObservações:\n${notes}` : null,
  ].filter(Boolean).join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponível — o texto continua visível para seleção manual */
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dados da proposta</CardTitle>
          <CardDescription>Quantidade e preço vêm das outras abas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Cliente</Label>
            <Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nome do cliente" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Validade (dias)</Label>
            <Input type="number" value={validity} onChange={(e) => setValidity(Number(e.target.value))} className="w-32" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Prazo de entrega, garantia, instalação…" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
          <div>
            <CardTitle className="text-base">Proposta</CardTitle>
            <CardDescription>Sem custos nem margens — pronta para enviar.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={copy}>
            {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap rounded-md border bg-muted/40 p-4 text-sm leading-relaxed">
            {text}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
