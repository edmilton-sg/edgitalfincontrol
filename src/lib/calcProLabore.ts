/**
 * Cálculo automático de INSS e IRRF sobre Pró-labore
 * Faixas vigentes em 2025 (válidas até atualização legal).
 */

// --- INSS Contribuinte Individual (alíquota fixa de 11% sobre o salário de contribuição) ---
// Teto INSS 2025: R$ 8.157,41
const INSS_RATE = 0.11;
const INSS_CEILING = 8157.41;

export function calcINSS(grossAmount: number): number {
  if (grossAmount <= 0) return 0;
  const base = Math.min(grossAmount, INSS_CEILING);
  return Math.round(base * INSS_RATE * 100) / 100;
}

// --- IRRF 2025 ---
// Base de cálculo = bruto - INSS
// Faixas progressivas mensais:
const IRRF_BRACKETS: { limit: number; rate: number; deduction: number }[] = [
  { limit: 2259.20, rate: 0,     deduction: 0 },
  { limit: 2826.65, rate: 0.075, deduction: 169.44 },
  { limit: 3751.05, rate: 0.15,  deduction: 381.44 },
  { limit: 4664.68, rate: 0.225, deduction: 662.77 },
  { limit: Infinity, rate: 0.275, deduction: 896.00 },
];

export function calcIRRF(grossAmount: number, inssAmount: number): number {
  const base = grossAmount - inssAmount;
  if (base <= 0) return 0;

  for (const bracket of IRRF_BRACKETS) {
    if (base <= bracket.limit) {
      const tax = base * bracket.rate - bracket.deduction;
      return Math.max(0, Math.round(tax * 100) / 100);
    }
  }
  return 0;
}
