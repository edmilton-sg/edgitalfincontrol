import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { expensesData, type Expense, type ExpenseCategory } from "@/data/mockData";
import { ExpenseFilters } from "@/components/expenses/ExpenseFilters";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

export default function ExpensesPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<Expense[]>(expensesData);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "all">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "fixed" | "variable">("all");
  const [periodFilter, setPeriodFilter] = useState("all");

  const filtered = useMemo(() => {
    return data.filter((e) => {
      const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "all" || e.category === categoryFilter;
      const matchType = typeFilter === "all" || (typeFilter === "fixed" ? e.is_fixed : !e.is_fixed);
      const matchPeriod = periodFilter === "all" || e.date.startsWith(periodFilter);
      return matchSearch && matchCategory && matchType && matchPeriod;
    });
  }, [data, search, categoryFilter, typeFilter, periodFilter]);

  const handleSave = (expense: Expense) => {
    setData((prev) => [expense, ...prev]);
  };

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
