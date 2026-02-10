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

    // Revenue module
    newRevenue: "Nova Receita",
    editRevenue: "Editar Receita",
    description: "Descrição",
    client: "Cliente",
    grossAmount: "Valor Bruto",
    feeAmount: "Taxa",
    netAmount: "Valor Líquido",
    paymentMethod: "Método de Pagamento",
    allStatuses: "Todos os Status",
    searchRevenue: "Buscar por descrição ou cliente...",
    totalNetAmount: "Total Líquido",

    // Expense module
    newExpense: "Nova Despesa",
    editExpense: "Editar Despesa",
    category: "Categoria",
    costCenter: "Centro de Custo",
    installments: "Parcelas",
    installment: "Parcela",
    fixed: "Fixa",
    personal: "Pessoal",
    allCategories: "Todas as Categorias",
    allTypes: "Todos os Tipos",
    fixedExpenses: "Fixas",
    variableExpenses: "Variáveis",
    searchExpense: "Buscar por descrição...",
    totalAmount: "Total",
    yes: "Sim",
    no: "Não",

    // Payment methods
    pix: "PIX",
    bankSlip: "Boleto",
    creditCard: "Cartão de Crédito",
    transfer: "Transferência",
    cash: "Dinheiro",

    // Expense categories
    rent: "Aluguel",
    energy: "Energia",
    internet: "Internet",
    officeSupplies: "Material de Escritório",
    marketing: "Marketing",
    transport: "Transporte",
    food: "Alimentação",
    software: "Software/SaaS",

    // Form
    save: "Salvar",
    cancel: "Cancelar",
    filterByPeriod: "Período",
    allPeriods: "Todos os Períodos",
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

    // Revenue module
    newRevenue: "New Revenue",
    editRevenue: "Edit Revenue",
    description: "Description",
    client: "Client",
    grossAmount: "Gross Amount",
    feeAmount: "Fee",
    netAmount: "Net Amount",
    paymentMethod: "Payment Method",
    allStatuses: "All Statuses",
    searchRevenue: "Search by description or client...",
    totalNetAmount: "Total Net",

    // Expense module
    newExpense: "New Expense",
    editExpense: "Edit Expense",
    category: "Category",
    costCenter: "Cost Center",
    installments: "Installments",
    installment: "Installment",
    fixed: "Fixed",
    personal: "Personal",
    allCategories: "All Categories",
    allTypes: "All Types",
    fixedExpenses: "Fixed",
    variableExpenses: "Variable",
    searchExpense: "Search by description...",
    totalAmount: "Total",
    yes: "Yes",
    no: "No",

    // Payment methods
    pix: "PIX",
    bankSlip: "Bank Slip",
    creditCard: "Credit Card",
    transfer: "Transfer",
    cash: "Cash",

    // Expense categories
    rent: "Rent",
    energy: "Energy",
    internet: "Internet",
    officeSupplies: "Office Supplies",
    marketing: "Marketing",
    transport: "Transport",
    food: "Food",
    software: "Software/SaaS",

    // Form
    save: "Save",
    cancel: "Cancel",
    filterByPeriod: "Period",
    allPeriods: "All Periods",
  },
} as const;

export type TranslationKey = keyof typeof translations["pt-BR"];
