export type Language = "pt-BR" | "en";

export const translations = {
  "pt-BR": {
    // Sidebar
    dashboard: "Dashboard",
    cashFlow: "Fluxo de Caixa",
    revenues: "Receitas",
    expenses: "Despesas",
    cards: "Cartões",
    dre: "DRE",
    taxes: "Impostos",
    employees: "Funcionários",
    proLabore: "Pró-labore",
    reports: "Relatórios",
    settings: "Configurações",
    documents: "Documentos",

    // Header
    search: "Buscar...",
    notifications: "Notificações",

    // Dashboard cards
    currentBalance: "Saldo Atual",
    monthlyRevenue: "Receita Mensal",
    monthlyExpense: "Despesa Mensal",
    operatingProfit: "Lucro Operacional",
    vsLastMonth: "vs mês anterior",

    // Charts
    revenueVsExpense: "Receitas vs Despesas",
    accumulatedBalance: "Saldo Acumulado",

    // Cash flow
    cashFlowProjection: "Projeção de Fluxo de Caixa",
    projected: "Projetado",
    realized: "Realizado",
    nextDays: "Próximos 30 dias",

    // Taxes
    upcomingTaxes: "Impostos Futuros",
    nextDas: "Próximo DAS",
    dueDate: "Vencimento",

    // Transactions
    recentTransactions: "Transações Recentes",
    name: "Nome",
    date: "Data",
    amount: "Valor",
    status: "Status",
    paid: "Pago",
    pending: "Pendente",
    overdue: "Atrasado",

    // Months
    jan: "Jan", feb: "Fev", mar: "Mar", apr: "Abr", may: "Mai", jun: "Jun",
    jul: "Jul", aug: "Ago", sep: "Set", oct: "Out", nov: "Nov", dec: "Dez",

    // Placeholder
    comingSoon: "Em breve",
    comingSoonDesc: "Este módulo está em desenvolvimento e estará disponível nas próximas atualizações.",

    // Theme
    lightMode: "Modo Claro",
    darkMode: "Modo Escuro",
  },
  en: {
    dashboard: "Dashboard",
    cashFlow: "Cash Flow",
    revenues: "Revenues",
    expenses: "Expenses",
    cards: "Cards",
    dre: "Income Statement",
    taxes: "Taxes",
    employees: "Employees",
    proLabore: "Pro-labore",
    reports: "Reports",
    settings: "Settings",
    documents: "Documents",

    search: "Search...",
    notifications: "Notifications",

    currentBalance: "Current Balance",
    monthlyRevenue: "Monthly Revenue",
    monthlyExpense: "Monthly Expense",
    operatingProfit: "Operating Profit",
    vsLastMonth: "vs last month",

    revenueVsExpense: "Revenue vs Expenses",
    accumulatedBalance: "Accumulated Balance",

    cashFlowProjection: "Cash Flow Projection",
    projected: "Projected",
    realized: "Realized",
    nextDays: "Next 30 days",

    upcomingTaxes: "Upcoming Taxes",
    nextDas: "Next DAS",
    dueDate: "Due Date",

    recentTransactions: "Recent Transactions",
    name: "Name",
    date: "Date",
    amount: "Amount",
    status: "Status",
    paid: "Paid",
    pending: "Pending",
    overdue: "Overdue",

    jan: "Jan", feb: "Feb", mar: "Mar", apr: "Apr", may: "May", jun: "Jun",
    jul: "Jul", aug: "Aug", sep: "Sep", oct: "Oct", nov: "Nov", dec: "Dec",

    comingSoon: "Coming Soon",
    comingSoonDesc: "This module is under development and will be available in upcoming updates.",

    lightMode: "Light Mode",
    darkMode: "Dark Mode",
  },
} as const;

export type TranslationKey = keyof typeof translations["pt-BR"];
