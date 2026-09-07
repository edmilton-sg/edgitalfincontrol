/**
 * Motor de precificação.
 *
 * Separa com clareza três blocos que costumam ser confundidos:
 *   1. CUSTO      — o que sai do caixa para ter o produto pronto para entregar.
 *   2. DEDUÇÕES   — o que incide sobre o preço de venda (imposto, comissão, taxas).
 *   3. RESULTADO  — o que sobra, em valor e em percentual.
 *
 * A margem é sempre calculada sobre o PREÇO DE VENDA (margem líquida), não sobre o custo.
 * Markup é a relação preço/custo e aparece separado, para não confundir os dois.
 */

export type LaborMode = "none" | "hourly" | "fixed";
export type PricingMode = "target_margin" | "fixed_price";

export type BomLine = {
  description: string;
  quantity: number;
  unit_cost: number;
};

export type CostInput = {
  /** Linhas da ficha técnica. Vazio para produto de revenda. */
  bom: BomLine[];
  /** Custo de aquisição para revenda (produto comprado pronto). */
  purchaseCost: number;
  /** Frete pago na compra dos insumos, por unidade. */
  inboundFreight: number;
  /** Frete de entrega ao cliente, por unidade. */
  outboundFreight: number;
  /** Instalação, deslocamento e afins, por unidade. */
  installation: number;
  /** Embalagem e outros custos diretos, por unidade. */
  packaging: number;
  /** Custo adicional livre, por unidade. */
  extraCost: number;
  laborMode: LaborMode;
  laborHours: number;
  hourlyRate: number;
  laborFixed: number;
};

export type CostBreakdown = {
  materials: number;
  labor: number;
  inboundFreight: number;
  outboundFreight: number;
  installation: number;
  packaging: number;
  extra: number;
  /** Soma de tudo que sai do caixa por unidade. */
  total: number;
};

export function computeCost(i: CostInput): CostBreakdown {
  const materials = i.bom.length > 0
    ? i.bom.reduce((s, l) => s + num(l.quantity) * num(l.unit_cost), 0)
    : num(i.purchaseCost);

  const labor =
    i.laborMode === "hourly" ? num(i.laborHours) * num(i.hourlyRate)
    : i.laborMode === "fixed" ? num(i.laborFixed)
    : 0;

  const inboundFreight = num(i.inboundFreight);
  const outboundFreight = num(i.outboundFreight);
  const installation = num(i.installation);
  const packaging = num(i.packaging);
  const extra = num(i.extraCost);

  return {
    materials, labor, inboundFreight, outboundFreight, installation, packaging, extra,
    total: materials + labor + inboundFreight + outboundFreight + installation + packaging + extra,
  };
}

export type PriceInput = {
  cost: number;
  /** Alíquota efetiva sobre o preço de venda, em %. */
  taxPercent: number;
  /** Comissão sobre o preço de venda, em %. */
  commissionPercent: number;
  /** Outras deduções percentuais sobre o preço (taxa de cartão, marketplace…). */
  otherPercent: number;
  /** Deduções em valor fixo por unidade. */
  otherFixed: number;
  mode: PricingMode;
  /** Usado quando mode = target_margin. Margem líquida desejada, em %. */
  targetMargin: number;
  /** Usado quando mode = fixed_price. */
  fixedPrice: number;
};

export type PriceResult = {
  salePrice: number;
  /** Soma das deduções em valor. */
  deductions: number;
  taxAmount: number;
  commissionAmount: number;
  otherAmount: number;
  /** Preço − custo, antes das deduções. */
  grossProfit: number;
  /** Preço − custo − deduções. É o que de fato sobra. */
  netProfit: number;
  /** netProfit / salePrice. */
  netMarginPercent: number;
  /** (preço/custo − 1). Relação com o custo, não com o preço. */
  markupPercent: number;
  /** netProfit / custo. */
  roiPercent: number;
  /** true quando a soma de margem alvo + deduções percentuais chega a 100%. */
  impossible: boolean;
};

/**
 * Divisor de markup: preço = (custo + deduções fixas) / (1 − margem% − deduções%).
 * É a única forma correta de embutir percentuais que incidem sobre o próprio preço.
 */
export function computePrice(i: PriceInput): PriceResult {
  const cost = num(i.cost);
  const pctDeductions = num(i.taxPercent) + num(i.commissionPercent) + num(i.otherPercent);
  const fixedDeductions = num(i.otherFixed);

  let salePrice: number;
  let impossible = false;

  if (i.mode === "fixed_price") {
    salePrice = num(i.fixedPrice);
  } else {
    const denom = 1 - (pctDeductions + num(i.targetMargin)) / 100;
    if (denom <= 0) {
      impossible = true;
      salePrice = 0;
    } else {
      salePrice = (cost + fixedDeductions) / denom;
    }
  }

  const taxAmount = salePrice * (num(i.taxPercent) / 100);
  const commissionAmount = salePrice * (num(i.commissionPercent) / 100);
  const otherAmount = salePrice * (num(i.otherPercent) / 100) + fixedDeductions;
  const deductions = taxAmount + commissionAmount + otherAmount;

  const grossProfit = salePrice - cost;
  const netProfit = salePrice - cost - deductions;

  return {
    salePrice, deductions, taxAmount, commissionAmount, otherAmount,
    grossProfit, netProfit,
    netMarginPercent: salePrice > 0 ? (netProfit / salePrice) * 100 : 0,
    markupPercent: cost > 0 ? (salePrice / cost - 1) * 100 : 0,
    roiPercent: cost > 0 ? (netProfit / cost) * 100 : 0,
    impossible,
  };
}

export type BatchInput = {
  units: number;
  unitCost: number;
  unitNetProfit: number;
  salePrice: number;
  /** Prazos de recebimento em dias, ex.: [30,60,90]. */
  paymentTerms: number[];
  /** Prazo de pagamento aos fornecedores, em dias. 0 = à vista. */
  supplierDays: number;
};

export type Installment = { days: number; amount: number };

export type BatchResult = {
  totalCost: number;
  totalRevenue: number;
  totalNetProfit: number;
  installments: Installment[];
  /** Dias entre desembolsar a produção e receber a última parcela. */
  cycleDays: number;
  /** Capital que precisa estar disponível antes de qualquer recebimento. */
  workingCapital: number;
};

export function computeBatch(i: BatchInput): BatchResult {
  const units = Math.max(0, Math.floor(num(i.units)));
  const totalCost = units * num(i.unitCost);
  const totalRevenue = units * num(i.salePrice);
  const totalNetProfit = units * num(i.unitNetProfit);

  const terms = i.paymentTerms.length > 0 ? [...i.paymentTerms].sort((a, b) => a - b) : [0];
  const n = terms.length;
  const base = Math.floor((totalRevenue / n) * 100) / 100;
  const installments: Installment[] = terms.map((days, idx) => ({
    days,
    // a última parcela absorve a diferença de arredondamento
    amount: idx === n - 1 ? round2(totalRevenue - base * (n - 1)) : base,
  }));

  const lastTerm = terms[n - 1] ?? 0;
  const supplierDays = Math.max(0, num(i.supplierDays));

  return {
    totalCost, totalRevenue, totalNetProfit, installments,
    cycleDays: lastTerm + supplierDays > 0 ? lastTerm - supplierDays : lastTerm,
    // enquanto o fornecedor não é pago, o dinheiro ainda está no caixa
    workingCapital: supplierDays >= (terms[0] ?? 0) ? 0 : totalCost,
  };
}

export type RentalInput = {
  unitCost: number;
  units: number;
  /** Em quantos meses o equipamento se paga (depreciação considerada). */
  months: number;
  markup: number;
  /** Custo mensal de suporte por unidade. */
  supportCost: number;
};

export type RentalResult = {
  monthlyPerUnit: number;
  monthlyTotal: number;
  annualTotal: number;
  /** Meses até o valor recebido cobrir o custo do equipamento. */
  paybackMonths: number;
  /** Resultado mensal depois de descontar a depreciação e o suporte. */
  monthlyResult: number;
  annualResult: number;
};

export function computeRental(i: RentalInput): RentalResult {
  const months = Math.max(1, num(i.months));
  const depreciationPerUnit = num(i.unitCost) / months;
  const monthlyPerUnit = depreciationPerUnit * num(i.markup) + num(i.supportCost);
  const units = Math.max(0, num(i.units));
  const monthlyTotal = monthlyPerUnit * units;
  const monthlyResult = monthlyTotal - (depreciationPerUnit + num(i.supportCost)) * units;

  return {
    monthlyPerUnit,
    monthlyTotal,
    annualTotal: monthlyTotal * 12,
    paybackMonths: monthlyPerUnit > 0 ? num(i.unitCost) / monthlyPerUnit : 0,
    monthlyResult,
    annualResult: monthlyResult * 12,
  };
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
