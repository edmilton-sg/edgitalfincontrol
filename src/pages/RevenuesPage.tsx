import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";
import { RevenueFilters } from "@/components/revenues/RevenueFilters";
import { RevenueTable } from "@/components/revenues/RevenueTable";
import { RevenueForm } from "@/components/revenues/RevenueForm";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Revenue, TransactionStatus } from "@/data/mockData";

export default function RevenuesPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { selectedCompanyId } = useCompany();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "all">("all");
  const [periodFilter, setPeriodFilter] = useState("all");

  const { data: revenues = [] } = useQuery({
    queryKey: ["revenues", selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return [];
      const { data, error } = await supabase
        .from("revenues")
        .select("*")
        .eq("company_id", selectedCompanyId)
        .order("date", { ascending: false });
      if (error) throw error;
      return data.map((r) => ({
        id: r.id,
        date: r.date,
        description: r.description,
        client: r.client || "",
        gross_amount: Number(r.gross_amount),
        fee_amount: Number(r.fee_amount),
        net_amount: Number(r.net_amount),
        payment_method: r.payment_method || "pix",
        status: r.status || "pending",
      })) as Revenue[];
    },
    enabled: !!selectedCompanyId,
  });

  const createRevenue = useMutation({
    mutationFn: async (revenue: Omit<Revenue, "id">) => {
      const { error } = await supabase.from("revenues").insert({
        company_id: selectedCompanyId!,
        date: revenue.date,
        description: revenue.description,
        client: revenue.client,
        gross_amount: revenue.gross_amount,
        fee_amount: revenue.fee_amount,
        net_amount: revenue.net_amount,
        payment_method: revenue.payment_method,
        status: revenue.status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
    },
    onError: (err) => {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    },
  });

  const filtered = useMemo(() => {
    return revenues.filter((r) => {
      const matchSearch = !search || r.description.toLowerCase().includes(search.toLowerCase()) || r.client.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchPeriod = periodFilter === "all" || r.date.startsWith(periodFilter);
      return matchSearch && matchStatus && matchPeriod;
    });
  }, [revenues, search, statusFilter, periodFilter]);

  const handleSave = (revenue: Revenue) => {
    createRevenue.mutate(revenue);
  };

  if (!selectedCompanyId) {
    return <div className="text-center text-muted-foreground py-12">{t("selectCompanyFirst")}</div>;
  }

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
