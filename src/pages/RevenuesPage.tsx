import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { revenuesData, type Revenue, type TransactionStatus } from "@/data/mockData";
import { RevenueFilters } from "@/components/revenues/RevenueFilters";
import { RevenueTable } from "@/components/revenues/RevenueTable";
import { RevenueForm } from "@/components/revenues/RevenueForm";

export default function RevenuesPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<Revenue[]>(revenuesData);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "all">("all");
  const [periodFilter, setPeriodFilter] = useState("all");

  const filtered = useMemo(() => {
    return data.filter((r) => {
      const matchSearch = !search || r.description.toLowerCase().includes(search.toLowerCase()) || r.client.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchPeriod = periodFilter === "all" || r.date.startsWith(periodFilter);
      return matchSearch && matchStatus && matchPeriod;
    });
  }, [data, search, statusFilter, periodFilter]);

  const handleSave = (revenue: Revenue) => {
    setData((prev) => [revenue, ...prev]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("revenues")}</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("newRevenue")}
        </Button>
      </div>

      <RevenueFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        periodFilter={periodFilter}
        onPeriodChange={setPeriodFilter}
      />

      <RevenueTable data={filtered} />

      <RevenueForm open={formOpen} onOpenChange={setFormOpen} onSave={handleSave} />
    </div>
  );
}
