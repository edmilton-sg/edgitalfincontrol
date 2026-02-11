export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  installment_number?: number;
  installment_total?: number;
  category: string;
  selected: boolean;
}

const DATE_ALIASES = ["data", "date", "dt", "data_compra", "data compra"];
const DESC_ALIASES = ["descricao", "descrição", "description", "desc", "estabelecimento", "merchant", "nome"];
const AMOUNT_ALIASES = ["valor", "value", "amount", "vlr", "total", "quantia"];

function detectDelimiter(firstLine: string): string {
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return semicolons >= commas ? ";" : ",";
}

function matchColumn(header: string, aliases: string[]): boolean {
  const h = header.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return aliases.some((a) => {
    const norm = a.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return h === norm || h.includes(norm);
  });
}

function normalizeDate(raw: string): string {
  raw = raw.trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  // DD/MM/YYYY or DD/MM/YY
  const m = raw.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{2,4})$/);
  if (m) {
    const year = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${year}-${m[2]}-${m[1]}`;
  }
  return raw;
}

function normalizeAmount(raw: string): number {
  let s = raw.trim().replace(/[R$\s]/g, "");
  // If has both . and , → "1.234,56" format
  if (s.includes(".") && s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : Math.abs(n);
}

function detectInstallment(desc: string): { number?: number; total?: number } {
  const patterns = [
    /(?:PARC(?:ELA)?)\s*(\d+)\s*[\/DE]+\s*(\d+)/i,
    /(\d+)\s*(?:DE|\/)\s*(\d+)\s*(?:PARC|parcela)/i,
    /(\d+)\/(\d+)$/,
  ];
  for (const p of patterns) {
    const m = desc.match(p);
    if (m && parseInt(m[2]) > 1) {
      return { number: parseInt(m[1]), total: parseInt(m[2]) };
    }
  }
  return {};
}

export function parseInvoiceCSV(text: string): ParsedTransaction[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines[0]);
  const headers = lines[0].split(delimiter);

  let dateIdx = -1, descIdx = -1, amountIdx = -1;
  headers.forEach((h, i) => {
    if (dateIdx === -1 && matchColumn(h, DATE_ALIASES)) dateIdx = i;
    if (descIdx === -1 && matchColumn(h, DESC_ALIASES)) descIdx = i;
    if (amountIdx === -1 && matchColumn(h, AMOUNT_ALIASES)) amountIdx = i;
  });

  if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) return [];

  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter);
    if (cols.length <= Math.max(dateIdx, descIdx, amountIdx)) continue;

    const rawDate = cols[dateIdx]?.trim();
    const rawDesc = cols[descIdx]?.trim();
    const rawAmount = cols[amountIdx]?.trim();

    if (!rawDate || !rawDesc || !rawAmount) continue;

    const date = normalizeDate(rawDate);
    const amount = normalizeAmount(rawAmount);
    if (amount === 0) continue;

    const installment = detectInstallment(rawDesc);

    transactions.push({
      date,
      description: rawDesc,
      amount,
      installment_number: installment.number,
      installment_total: installment.total,
      category: "",
      selected: true,
    });
  }

  return transactions;
}
