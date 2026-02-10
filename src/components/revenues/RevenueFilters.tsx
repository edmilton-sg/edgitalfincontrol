import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TransactionStatus } from "@/data/mockData";

interface RevenueFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: TransactionStatus | "all";
  onStatusChange: (v: TransactionStatus | "all") => void;
  periodFilter: string;
  onPeriodChange: (v: string) => void;
}

export function RevenueFilters({ search, onSearchChange, statusFilter, onStatusChange, periodFilter, onPeriodChange }: RevenueFiltersProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Input
        placeholder={t("searchRevenue")}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="sm:max-w-[280px]"
      />
      <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as TransactionStatus | "all")}>
        <SelectTrigger className="sm:w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allStatuses")}</SelectItem>
          <SelectItem value="paid">{t("paid")}</SelectItem>
          <SelectItem value="pending">{t("pending")}</SelectItem>
          <SelectItem value="overdue">{t("overdue")}</SelectItem>
        </SelectContent>
      </Select>
      <Select value={periodFilter} onValueChange={onPeriodChange}>
        <SelectTrigger className="sm:w-[180px]">
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
