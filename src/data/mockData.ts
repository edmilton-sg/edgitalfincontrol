export const summaryData = {
  currentBalance: 84520.0,
  currentBalanceChange: 12.5,
  monthlyRevenue: 32450.0,
  monthlyRevenueChange: 8.2,
  monthlyExpense: 18930.0,
  monthlyExpenseChange: -3.1,
  operatingProfit: 13520.0,
  operatingProfitChange: 15.7,
};

export const monthlyData = [
  { month: "jan", revenue: 28000, expense: 19000 },
  { month: "feb", revenue: 31000, expense: 17500 },
  { month: "mar", revenue: 26500, expense: 20000 },
  { month: "apr", revenue: 29000, expense: 18000 },
  { month: "may", revenue: 34000, expense: 21000 },
  { month: "jun", revenue: 32450, expense: 18930 },
  { month: "jul", revenue: 30000, expense: 17000 },
  { month: "aug", revenue: 35000, expense: 19500 },
  { month: "sep", revenue: 33000, expense: 20500 },
  { month: "oct", revenue: 31500, expense: 18500 },
  { month: "nov", revenue: 36000, expense: 22000 },
  { month: "dec", revenue: 38000, expense: 21000 },
];

export const balanceData = [
  { month: "jan", balance: 65000 },
  { month: "feb", balance: 68500 },
  { month: "mar", balance: 72000 },
  { month: "apr", balance: 74200 },
  { month: "may", balance: 78500 },
  { month: "jun", balance: 84520 },
  { month: "jul", balance: 87000 },
  { month: "aug", balance: 91500 },
  { month: "sep", balance: 94000 },
  { month: "oct", balance: 97500 },
  { month: "nov", balance: 101000 },
  { month: "dec", balance: 108000 },
];

export const cashFlowData = {
  projected: 45000,
  realized: 32450,
};

export const taxData = {
  nextDasAmount: 1250.0,
  dueDate: "2026-03-20",
};

export const transactions = [
  { id: 1, name: "Cliente Alpha Ltda", date: "2026-02-08", amount: 8500.0, status: "paid" as const },
  { id: 2, name: "Aluguel Escritório", date: "2026-02-05", amount: -3200.0, status: "paid" as const },
  { id: 3, name: "Serviço de Consultoria", date: "2026-02-10", amount: 12000.0, status: "pending" as const },
  { id: 4, name: "Fornecedor Beta", date: "2026-02-01", amount: -4500.0, status: "paid" as const },
  { id: 5, name: "Fatura Energia", date: "2026-01-28", amount: -890.0, status: "overdue" as const },
  { id: 6, name: "Projeto Gamma", date: "2026-02-12", amount: 15000.0, status: "pending" as const },
];

// Revenue types
export type PaymentMethod = "pix" | "bankSlip" | "creditCard" | "transfer" | "cash";
export type TransactionStatus = "paid" | "pending" | "overdue";

export interface Revenue {
  id: number;
  date: string;
  description: string;
  client: string;
  gross_amount: number;
  fee_amount: number;
  net_amount: number;
  payment_method: PaymentMethod;
  status: TransactionStatus;
}

export const revenuesData: Revenue[] = [
  { id: 1, date: "2026-02-08", description: "Consultoria financeira", client: "Cliente Alpha Ltda", gross_amount: 8500, fee_amount: 170, net_amount: 8330, payment_method: "pix", status: "paid" },
  { id: 2, date: "2026-02-05", description: "Projeto web", client: "Beta Soluções", gross_amount: 15000, fee_amount: 525, net_amount: 14475, payment_method: "transfer", status: "paid" },
  { id: 3, date: "2026-02-10", description: "Serviço de consultoria", client: "Gamma Corp", gross_amount: 12000, fee_amount: 360, net_amount: 11640, payment_method: "bankSlip", status: "pending" },
  { id: 4, date: "2026-01-28", description: "Manutenção mensal", client: "Delta Tech", gross_amount: 3500, fee_amount: 105, net_amount: 3395, payment_method: "creditCard", status: "paid" },
  { id: 5, date: "2026-01-20", description: "Treinamento equipe", client: "Epsilon SA", gross_amount: 6000, fee_amount: 180, net_amount: 5820, payment_method: "pix", status: "overdue" },
  { id: 6, date: "2026-02-12", description: "Desenvolvimento app", client: "Zeta Digital", gross_amount: 22000, fee_amount: 770, net_amount: 21230, payment_method: "transfer", status: "pending" },
  { id: 7, date: "2026-02-01", description: "Licença software", client: "Eta Sistemas", gross_amount: 4800, fee_amount: 144, net_amount: 4656, payment_method: "bankSlip", status: "paid" },
  { id: 8, date: "2026-01-15", description: "Consultoria tributária", client: "Theta Contábil", gross_amount: 7200, fee_amount: 216, net_amount: 6984, payment_method: "cash", status: "paid" },
];

// Expense types
export type ExpenseCategory = "rent" | "energy" | "internet" | "officeSupplies" | "marketing" | "transport" | "food" | "software";

export interface Expense {
  id: number;
  date: string;
  description: string;
  category: ExpenseCategory;
  cost_center: string;
  amount: number;
  payment_method: PaymentMethod;
  installments: number;
  installment_number: number;
  installment_total: number;
  is_fixed: boolean;
  is_personal: boolean;
}

export const expensesData: Expense[] = [
  { id: 1, date: "2026-02-05", description: "Aluguel escritório", category: "rent", cost_center: "Administrativo", amount: 3200, payment_method: "transfer", installments: 1, installment_number: 1, installment_total: 1, is_fixed: true, is_personal: false },
  { id: 2, date: "2026-02-10", description: "Conta de energia", category: "energy", cost_center: "Administrativo", amount: 890, payment_method: "bankSlip", installments: 1, installment_number: 1, installment_total: 1, is_fixed: true, is_personal: false },
  { id: 3, date: "2026-02-08", description: "Internet fibra", category: "internet", cost_center: "Administrativo", amount: 250, payment_method: "creditCard", installments: 1, installment_number: 1, installment_total: 1, is_fixed: true, is_personal: false },
  { id: 4, date: "2026-02-03", description: "Papel e toner", category: "officeSupplies", cost_center: "Operacional", amount: 450, payment_method: "pix", installments: 1, installment_number: 1, installment_total: 1, is_fixed: false, is_personal: false },
  { id: 5, date: "2026-01-28", description: "Google Ads", category: "marketing", cost_center: "Marketing", amount: 2800, payment_method: "creditCard", installments: 3, installment_number: 2, installment_total: 3, is_fixed: false, is_personal: false },
  { id: 6, date: "2026-02-07", description: "Uber corporativo", category: "transport", cost_center: "Operacional", amount: 380, payment_method: "creditCard", installments: 1, installment_number: 1, installment_total: 1, is_fixed: false, is_personal: true },
  { id: 7, date: "2026-02-06", description: "Almoço cliente", category: "food", cost_center: "Comercial", amount: 320, payment_method: "cash", installments: 1, installment_number: 1, installment_total: 1, is_fixed: false, is_personal: false },
  { id: 8, date: "2026-02-01", description: "Licença Adobe CC", category: "software", cost_center: "Operacional", amount: 280, payment_method: "creditCard", installments: 12, installment_number: 5, installment_total: 12, is_fixed: true, is_personal: false },
  { id: 9, date: "2026-01-25", description: "Material limpeza", category: "officeSupplies", cost_center: "Administrativo", amount: 150, payment_method: "pix", installments: 1, installment_number: 1, installment_total: 1, is_fixed: false, is_personal: false },
  { id: 10, date: "2026-02-09", description: "Slack Business", category: "software", cost_center: "Operacional", amount: 520, payment_method: "creditCard", installments: 1, installment_number: 1, installment_total: 1, is_fixed: true, is_personal: false },
];
