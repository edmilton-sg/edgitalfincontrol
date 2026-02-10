import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";
import { ExpenseFilters } from "@/components/expenses/ExpenseFilters";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Expense, ExpenseCategory } from "@/data/mockData";

export default function ExpensesPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { selectedCompanyId } = useCompany();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "all">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "fixed" | "variable">("all");
  const [periodFilter, setPeriodFilter] = useState("all");

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return [];
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("company_id", selectedCompanyId)
        .order("date", { ascending: false });
      if (error) throw error;
      return data.map((e) => ({
        id: e.id,
        date: e.date,
        description: e.description,
        category: e.category || "rent",
        cost_center: e.cost_center || "",
        amount: Number(e.amount),
        payment_method: e.payment_method || "pix",
        installments: e.installments || 1,
        installment_number: e.installment_number || 1,
        installment_total: e.installment_total || 1,
        is_fixed: e.is_fixed || false,
        is_personal: e.is_personal || false,
      })) as Expense[];
    },
    enabled: !!selectedCompanyId,
  });

  const createExpense = useMutation({
    mutationFn: async (expense: Omit<Expense, "id">) => {
      const { error } = await supabase.from("expenses").insert({
        company_id: selectedCompanyId!,
        date: expense.date,
        description: expense.description,
        category: expense.category,
        cost_center: expense.cost_center,
        amount: expense.amount,
        payment_method: expense.payment_method,
        installments: expense.installments,
        installment_number: expense.installment_number,
        installment_total: expense.installment_total,
        is_fixed: expense.is_fixed,
        is_personal: expense.is_personal,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (err) => {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    },
  });

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "all" || e.category === categoryFilter;
      const matchType = typeFilter === "all" || (typeFilter === "fixed" ? e.is_fixed : !e.is_fixed);
      const matchPeriod = periodFilter === "all" || e.date.startsWith(periodFilter);
      return matchSearch && matchCategory && matchType && matchPeriod;
    });
  }, [expenses, search, categoryFilter, typeFilter, periodFilter]);

  const handleSave = (expense: Expense) => {
    createExpense.mutate(expense);
  };

  if (!selectedCompanyId) {
    return <div className="text-center text-muted-foreground py-12">{t("selectCompanyFirst")}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("expenses")}</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("newExpense")}
        </Button>
      </div>

      <ExpenseFilters
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        periodFilter={periodFilter}
        onPeriodChange={setPeriodFilter}
      />

      <ExpenseTable data={filtered} />

      <ExpenseForm open={formOpen} onOpenChange={setFormOpen} onSave={handleSave} />
    </div>
  );
}
