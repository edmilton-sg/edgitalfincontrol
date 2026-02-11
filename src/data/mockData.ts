// Types kept as reference for the app
// Mock data arrays removed - data now comes from the database

export const summaryData = {
  currentBalance: 0,
  currentBalanceChange: 0,
  monthlyRevenue: 0,
  monthlyRevenueChange: 0,
  monthlyExpense: 0,
  monthlyExpenseChange: 0,
  operatingProfit: 0,
  operatingProfitChange: 0,
};

export const monthlyData: { month: string; revenue: number; expense: number }[] = [];
export const balanceData: { month: string; balance: number }[] = [];

export const cashFlowData = {
  projected: 0,
  realized: 0,
};

export const taxData = {
  nextDasAmount: 0,
  dueDate: "",
};

export const transactions: { id: number; name: string; date: string; amount: number; status: "paid" | "pending" | "overdue" }[] = [];

// Revenue types
export type PaymentMethod = "pix" | "bankSlip" | "creditCard" | "transfer" | "cash";
export type TransactionStatus = "paid" | "pending" | "overdue";

export interface Revenue {
  id: number | string;
  date: string;
  description: string;
  client: string;
  gross_amount: number;
  fee_amount: number;
  net_amount: number;
  payment_method: PaymentMethod;
  status: TransactionStatus;
  is_recurring: boolean;
  recurrence_interval?: string;
  recurrence_group_id?: string;
}

// Expense types
export type ExpenseCategory = string;

export interface Expense {
  id: number | string;
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
  is_recurring: boolean;
  recurrence_interval?: string;
  recurrence_group_id?: string;
}

export interface Attachment {
  id: string;
  record_type: string;
  record_id: string;
  company_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  content_type: string;
  created_at: string;
}

export const revenuesData: Revenue[] = [];
export const expensesData: Expense[] = [];
