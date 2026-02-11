import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageContext";
import type { ExpenseCategory } from "@/data/mockData";
import { useCategories } from "@/hooks/useCategories";

interface ExpenseFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  categoryFilter: ExpenseCategory | "all";
  onCategoryChange: (v: ExpenseCategory | "all") => void;
  typeFilter: "all" | "fixed" | "variable";
  onTypeChange: (v: "all" | "fixed" | "variable") => void;
  periodFilter: string;
  onPeriodChange: (v: string) => void;
}

export function ExpenseFilters({ search, onSearchChange, categoryFilter, onCategoryChange, typeFilter, onTypeChange, periodFilter, onPeriodChange }: ExpenseFiltersProps) {
  const { t } = useLanguage();
  const { categories } = useCategories();

  return (
    <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
      <Input
        placeholder={t("searchExpense")}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="sm:max-w-[250px]"
      />
      <Select value={categoryFilter} onValueChange={(v) => onCategoryChange(v as ExpenseCategory | "all")}>
        <SelectTrigger className="sm:w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allCategories")}</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={typeFilter} onValueChange={(v) => onTypeChange(v as "all" | "fixed" | "variable")}>
        <SelectTrigger className="sm:w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allTypes")}</SelectItem>
          <SelectItem value="fixed">{t("fixedExpenses")}</SelectItem>
          <SelectItem value="variable">{t("variableExpenses")}</SelectItem>
        </SelectContent>
      </Select>
      <Select value={periodFilter} onValueChange={onPeriodChange}>
        <SelectTrigger className="sm:w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allPeriods")}</SelectItem>
          <SelectItem value="2026-01">01/2026</SelectItem>
          <SelectItem value="2026-02">02/2026</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
