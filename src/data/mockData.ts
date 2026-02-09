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
