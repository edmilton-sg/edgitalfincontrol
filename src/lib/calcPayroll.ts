/**
 * Cálculo de encargos trabalhistas CLT - Faixas 2025
 */

// --- INSS CLT 2025 (alíquotas progressivas) ---
const INSS_BRACKETS = [
  { limit: 1518.00, rate: 0.075 },
  { limit: 2793.88, rate: 0.09 },
  { limit: 5585.76, rate: 0.12 },
  { limit: 8157.41, rate: 0.14 },
];

export function calcINSS_CLT(gross: number): number {
  if (gross <= 0) return 0;
  let total = 0;
  let prev = 0;
  for (const bracket of INSS_BRACKETS) {
    const base = Math.min(gross, bracket.limit) - prev;
    if (base <= 0) break;
    total += base * bracket.rate;
    prev = bracket.limit;
  }
  return Math.round(total * 100) / 100;
}

// --- IRRF 2025 (mesmas faixas do módulo pro-labore) ---
const IRRF_BRACKETS = [
  { limit: 2259.20, rate: 0, deduction: 0 },
  { limit: 2826.65, rate: 0.075, deduction: 169.44 },
  { limit: 3751.05, rate: 0.15, deduction: 381.44 },
  { limit: 4664.68, rate: 0.225, deduction: 662.77 },
  { limit: Infinity, rate: 0.275, deduction: 896.00 },
];

export function calcIRRF_CLT(gross: number, inss: number): number {
  const base = gross - inss;
  if (base <= 0) return 0;
  for (const b of IRRF_BRACKETS) {
    if (base <= b.limit) {
      const tax = base * b.rate - b.deduction;
      return Math.max(0, Math.round(tax * 100) / 100);
    }
  }
  return 0;
}

// --- FGTS (8%) ---
export function calcFGTS(gross: number): number {
  if (gross <= 0) return 0;
  return Math.round(gross * 0.08 * 100) / 100;
}

export function calcPayroll(gross: number, otherAdditions = 0, otherDeductions = 0) {
  const totalGross = gross + otherAdditions;
  const inss = calcINSS_CLT(totalGross);
  const irrf = calcIRRF_CLT(totalGross, inss);
  const fgts = calcFGTS(totalGross);
  const net = totalGross - inss - irrf - otherDeductions;
  return { inss, irrf, fgts, net: Math.round(net * 100) / 100 };
}
