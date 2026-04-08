import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";
import { RevenueFilters } from "@/components/revenues/RevenueFilters";
import { RevenueTable } from "@/components/revenues/RevenueTable";
import { RevenueForm } from "@/components/revenues/RevenueForm";
import { RevenueDetailDialog } from "@/components/revenues/RevenueDetailDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Revenue, TransactionStatus, Attachment } from "@/data/mockData";

export default function RevenuesPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { selectedCompanyId } = useCompany();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "all">("all");
  const [periodFilter, setPeriodFilter] = useState("all");

  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null);
  const [viewingRevenue, setViewingRevenue] = useState<Revenue | null>(null);
  const [deletingRevenue, setDeletingRevenue] = useState<Revenue | null>(null);
  const [deleteDetails, setDeleteDetails] = useState("");
  const [editAttachments, setEditAttachments] = useState<Attachment[]>([]);
  const [viewAttachments, setViewAttachments] = useState<Attachment[]>([]);

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
        is_recurring: r.is_recurring || false,
        recurrence_interval: r.recurrence_interval,
        recurrence_group_id: r.recurrence_group_id,
      })) as Revenue[];
    },
    enabled: !!selectedCompanyId,
  });

  async function loadAttachments(recordId: string) {
    const { data } = await supabase
      .from("attachments")
      .select("*")
      .eq("record_id", recordId)
      .eq("record_type", "revenue");
    return (data || []) as unknown as Attachment[];
  }

  async function uploadPendingFiles(recordId: string, files: File[]) {
    for (const file of files) {
      const path = `${selectedCompanyId}/${recordId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("attachments").upload(path, file);
      if (uploadError) continue;
      await supabase.from("attachments").insert({
        record_type: "revenue",
        record_id: recordId,
        company_id: selectedCompanyId!,
        file_name: file.name,
        file_path: path,
        file_size: file.size,
        content_type: file.type,
      });
    }
  }

  const createRevenue = useMutation({
    mutationFn: async ({ revenue, files }: { revenue: Omit<Revenue, "id">; files: File[] }) => {
      const { data, error } = await supabase.from("revenues").insert({
        company_id: selectedCompanyId!,
        date: revenue.date,
        description: revenue.description,
        client: revenue.client,
        gross_amount: revenue.gross_amount,
        fee_amount: revenue.fee_amount,
        net_amount: revenue.net_amount,
        payment_method: revenue.payment_method,
        status: revenue.status,
        is_recurring: revenue.is_recurring,
        recurrence_interval: revenue.recurrence_interval,
      }).select("id").single();
      if (error) throw error;
      if (files.length > 0 && data) await uploadPendingFiles(data.id, files);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["revenues"] }),
    onError: (err) => toast({ title: "Erro", description: (err as Error).message, variant: "destructive" }),
  });

  const updateRevenue = useMutation({
    mutationFn: async ({ revenue, files }: { revenue: Revenue; files: File[] }) => {
      const { error } = await supabase.from("revenues").update({
        date: revenue.date,
        description: revenue.description,
        client: revenue.client,
        gross_amount: revenue.gross_amount,
        fee_amount: revenue.fee_amount,
        net_amount: revenue.net_amount,
        payment_method: revenue.payment_method,
        status: revenue.status,
        is_recurring: revenue.is_recurring,
        recurrence_interval: revenue.recurrence_interval,
      }).eq("id", String(revenue.id));
      if (error) throw error;
      if (files.length > 0) await uploadPendingFiles(String(revenue.id), files);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
      toast({ title: t("updated") });
    },
    onError: (err) => toast({ title: "Erro", description: (err as Error).message, variant: "destructive" }),
  });

  const deleteRevenue = useMutation({
    mutationFn: async (revenue: Revenue) => {
      // Delete attachments from storage
      const attachments = await loadAttachments(String(revenue.id));
      if (attachments.length > 0) {
        await supabase.storage.from("attachments").remove(attachments.map((a) => a.file_path));
        await supabase.from("attachments").delete().eq("record_id", String(revenue.id)).eq("record_type", "revenue");
      }
      const { error } = await supabase.from("revenues").delete().eq("id", String(revenue.id));
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
      toast({ title: t("deleted") });
      setDeletingRevenue(null);
    },
    onError: (err) => toast({ title: "Erro", description: (err as Error).message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    return revenues.filter((r) => {
      const matchSearch = !search || r.description.toLowerCase().includes(search.toLowerCase()) || r.client.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchPeriod = periodFilter === "all" || r.date.startsWith(periodFilter);
      return matchSearch && matchStatus && matchPeriod;
    });
  }, [revenues, search, statusFilter, periodFilter]);

  const handleSave = (revenue: Revenue, pendingFiles: File[]) => {
    if (editingRevenue) {
      updateRevenue.mutate({ revenue, files: pendingFiles });
      setEditingRevenue(null);
    } else {
      createRevenue.mutate({ revenue, files: pendingFiles });
    }
  };

  async function handleView(revenue: Revenue) {
    const atts = await loadAttachments(String(revenue.id));
    setViewAttachments(atts);
    setViewingRevenue(revenue);
  }

  async function handleEdit(revenue: Revenue) {
    const atts = await loadAttachments(String(revenue.id));
    setEditAttachments(atts);
    setEditingRevenue(revenue);
    setFormOpen(true);
  }

  function handleNewRevenue() {
    setEditingRevenue(null);
    setEditAttachments([]);
    setFormOpen(true);
  }

  async function handleDeleteRevenue(revenue: Revenue) {
    const atts = await loadAttachments(String(revenue.id));
    setDeleteDetails(
      t("deleteRevenueDetails").replace("{attachments}", String(atts.length))
    );
    setDeletingRevenue(revenue);
  }

  if (!selectedCompanyId) {
    return <div className="text-center text-muted-foreground py-12">{t("selectCompanyFirst")}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("revenues")}</h1>
        <Button onClick={handleNewRevenue}>
          <Plus className="mr-2 h-4 w-4" />
          {t("newRevenue")}
        </Button>
      </div>

      <RevenueFilters
        search={search} onSearchChange={setSearch}
        statusFilter={statusFilter} onStatusChange={setStatusFilter}
        periodFilter={periodFilter} onPeriodChange={setPeriodFilter}
      />

      <RevenueTable
        data={filtered}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setDeletingRevenue}
      />

      <RevenueForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={handleSave}
        revenue={editingRevenue}
        attachments={editAttachments}
        onAttachmentsChange={setEditAttachments}
        companyId={selectedCompanyId}
      />

      <RevenueDetailDialog
        revenue={viewingRevenue}
        open={!!viewingRevenue}
        onOpenChange={(open) => !open && setViewingRevenue(null)}
        onEdit={handleEdit}
        attachments={viewAttachments}
        companyId={selectedCompanyId}
      />

      <DeleteConfirmDialog
        open={!!deletingRevenue}
        onOpenChange={(open) => !open && setDeletingRevenue(null)}
        onConfirm={() => deletingRevenue && deleteRevenue.mutate(deletingRevenue)}
        loading={deleteRevenue.isPending}
      />
    </div>
  );
}
