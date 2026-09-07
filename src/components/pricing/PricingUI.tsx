import { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Cartão de indicador. `tone` destaca resultado bom/ruim sem depender só de cor. */
export function Metric({
  label, value, hint, tone = "neutral", large,
}: {
  label: string; value: string; hint?: string;
  tone?: "neutral" | "primary" | "positive" | "negative";
  large?: boolean;
}) {
  const toneClass =
    tone === "primary" ? "bg-primary/5 border-primary/30"
    : tone === "positive" ? "bg-emerald-500/5 border-emerald-500/30"
    : tone === "negative" ? "bg-destructive/5 border-destructive/40"
    : "";
  const valueClass =
    tone === "primary" ? "text-primary"
    : tone === "positive" ? "text-emerald-600 dark:text-emerald-400"
    : tone === "negative" ? "text-destructive"
    : "";
  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-semibold tabular-nums ${large ? "text-2xl" : "text-lg"} ${valueClass}`}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

/** Campo numérico com rótulo e sufixo (R$ / %). */
export function NumField({
  label, value, onChange, suffix, step = "0.01", hint, disabled,
}: {
  label: string; value: number; onChange: (v: number) => void;
  suffix?: string; step?: string; hint?: string; disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          type="number" step={step} value={value} disabled={disabled}
          className={`text-right tabular-nums ${suffix ? "pr-8" : ""}`}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Linha de uma tabela de composição: rótulo à esquerda, valor à direita. */
export function BreakdownRow({
  label, value, muted, strong, indent, negative,
}: {
  label: ReactNode; value: string;
  muted?: boolean; strong?: boolean; indent?: boolean; negative?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-1.5 ${strong ? "border-t mt-1 pt-2 font-semibold" : ""} ${
        muted ? "text-muted-foreground" : ""
      }`}
    >
      <span className={`text-sm ${indent ? "pl-4" : ""}`}>{label}</span>
      <span className={`text-sm tabular-nums ${negative ? "text-destructive" : ""}`}>{value}</span>
    </div>
  );
}
