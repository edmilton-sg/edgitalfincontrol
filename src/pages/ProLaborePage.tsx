import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { ProLaboreTable, type ProLaboreRow } from "@/components/prolabore/ProLaboreTable";
import { ProLaboreForm } from "@/components/prolabore/ProLaboreForm";
import { ProLaboreDetailDialog } from "@/components/prolabore/ProLaboreDetailDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function ProLaborePage() {
  const { t } = useLanguage();
  const { selectedCompanyId } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProLaboreRow | null>(null);
  const [viewing, setViewing] = useState<ProLaboreRow | null>(null);
  const [deleting, setDeleting] = useState<ProLaboreRow | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: items = [] } = useQuery({
    queryKey: ["pro-labore", selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pro_labore")
        .select("*")
        .eq("company_id", selectedCompanyId!)
        .order("reference_month", { ascending: false });
      if (error) throw error;
      return data as ProLaboreRow[];
    },
  });

  const filtered = useMemo(() => {
    let result = items;
    if (statusFilter !== "all") result = result.filter((r) => r.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.member_name.toLowerCase().includes(q));
    }
    return result;
  }, [items, statusFilter, search]);

  const upsertMutation = useMutation({
    mutationFn: async (data: Partial<ProLaboreRow>) => {
      // Convert month input (YYYY-MM) to date (YYYY-MM-01)
      const refMonth = data.reference_month?.length === 7 ? data.reference_month + "-01" : data.reference_month;

      const payload = {
        company_id: selectedCompanyId!,
        member_name: data.member_name!,
        cpf: data.cpf || null,
        amount: data.amount!,
        inss_amount: data.inss_amount || 0,
        irrf_amount: data.irrf_amount || 0,
        net_amount: data.net_amount!,
        reference_month: refMonth!,
        notes: data.notes || null,
      };

      if (data.id) {
        const { error } = await supabase.from("pro_labore").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pro_labore").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pro-labore"] });
      toast({ title: t("save"), description: "✓" });
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (row: ProLaboreRow) => {
      const today = format(new Date(), "yyyy-MM-dd");
      // Update pro_labore status
      const { error: updateError } = await supabase
        .from("pro_labore")
        .update({ status: "paid", payment_date: today })
        .eq("id", row.id);
      if (updateError) throw updateError;

      // Create linked expense
      const { error: expError } = await supabase.from("expenses").insert({
        company_id: row.company_id,
        description: `${t("proLaboreExpense")} - ${row.member_name}`,
        amount: Number(row.net_amount),
        date: today,
        category: t("proLaboreExpense"),
        source_type: "pro_labore",
        source_id: row.id,
        is_personal: false,
        payment_method: "transfer",
      });
      if (expError) throw expError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pro-labore"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: t("markAsPaid"), description: "✓" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (row: ProLaboreRow) => {
      // Delete linked expense first
      await supabase.from("expenses").delete().eq("source_type", "pro_labore").eq("source_id", row.id);
      const { error } = await supabase.from("pro_labore").delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pro-labore"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: t("delete"), description: "✓" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("proLaboreTitle")}</h1>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> {t("newProLabore")}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t("search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            <SelectItem value="pending">{t("pending")}</SelectItem>
            <SelectItem value="paid">{t("paid")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ProLaboreTable
        data={filtered}
        onView={(r) => setViewing(r)}
        onEdit={(r) => { setEditing(r); setFormOpen(true); }}
        onDelete={(r) => setDeleting(r)}
        onMarkAsPaid={(r) => markAsPaidMutation.mutate(r)}
      />

      <ProLaboreForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editingItem={editing}
        onSave={(data) => upsertMutation.mutate(data)}
      />

      <ProLaboreDetailDialog
        open={!!viewing}
        onOpenChange={() => setViewing(null)}
        item={viewing}
      />

      <DeleteConfirmDialog
        open={!!deleting}
        onOpenChange={() => setDeleting(null)}
        onConfirm={() => { if (deleting) deleteMutation.mutate(deleting); setDeleting(null); }}
      />
    </div>
  );
}
