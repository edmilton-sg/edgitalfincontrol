import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatCurrency";
import type { Language } from "@/i18n/translations";

export type BomRow = {
  id?: string;
  component_product_id: string | null;
  description: string;
  quantity: number;
  unit_cost: number;
};

type CatalogItem = { id: string; name: string; cost_price: number };

/**
 * Ficha técnica: os insumos que compõem um produto montado.
 * Cada linha pode apontar para um produto do catálogo (e herdar o custo dele)
 * ou ser digitada livremente.
 */
export function BomEditor({
  rows, onChange, catalog, language,
}: {
  rows: BomRow[];
  onChange: (rows: BomRow[]) => void;
  catalog: CatalogItem[];
  language: Language;
}) {
  const total = useMemo(
    () => rows.reduce((s, r) => s + (Number(r.quantity) || 0) * (Number(r.unit_cost) || 0), 0),
    [rows]
  );

  const add = () =>
    onChange([...rows, { component_product_id: null, description: "", quantity: 1, unit_cost: 0 }]);

  const update = (i: number, patch: Partial<BomRow>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));

  const pickCatalog = (i: number, value: string) => {
    if (value === "__free__") {
      update(i, { component_product_id: null });
      return;
    }
    const item = catalog.find((c) => c.id === value);
    if (item) {
      update(i, {
        component_product_id: item.id,
        description: item.name,
        unit_cost: Number(item.cost_price) || 0,
      });
    }
  };

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[220px]">Insumo do catálogo</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="w-24 text-right">Qtd</TableHead>
            <TableHead className="w-32 text-right">Custo un.</TableHead>
            <TableHead className="w-32 text-right">Subtotal</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                Nenhum insumo. Adicione as peças que compõem este produto.
              </TableCell>
            </TableRow>
          )}
          {rows.map((r, i) => (
            <TableRow key={r.id ?? i}>
              <TableCell>
                <Select value={r.component_product_id ?? "__free__"} onValueChange={(v) => pickCatalog(i, v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__free__">— digitar manualmente —</SelectItem>
                    {catalog.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  value={r.description}
                  placeholder="Ex.: Monitor 21,5&quot;"
                  onChange={(e) => update(i, { description: e.target.value })}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number" step="0.01" className="text-right"
                  value={r.quantity}
                  onChange={(e) => update(i, { quantity: Number(e.target.value) })}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number" step="0.01" className="text-right"
                  value={r.unit_cost}
                  onChange={(e) => update(i, { unit_cost: Number(e.target.value) })}
                />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency((Number(r.quantity) || 0) * (Number(r.unit_cost) || 0), language)}
              </TableCell>
              <TableCell>
                <Button size="icon" variant="ghost" onClick={() => remove(i)} aria-label="Remover insumo">
                  <Trash2 size={14} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        {rows.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} className="font-medium">Total de materiais</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatCurrency(total, language)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        )}
      </Table>
      <Button size="sm" variant="outline" onClick={add}>
        <Plus size={14} className="mr-1" />Adicionar insumo
      </Button>
    </div>
  );
}
