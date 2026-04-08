import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";
import { ExpenseFilters } from "@/components/expenses/ExpenseFilters";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { ExpenseDetailDialog } from "@/components/expenses/ExpenseDetailDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Expense, ExpenseCategory, Attachment } from "@/data/mockData";

export default function ExpensesPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { selectedCompanyId } = useCompany();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "all">("all");
  const [periodFilter, setPeriodFilter] = useState("all");

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [deleteDetails, setDeleteDetails] = useState("");
  const [editAttachments, setEditAttachments] = useState<Attachment[]>([]);
  const [viewAttachments, setViewAttachments] = useState<Attachment[]>([]);

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
      return data.map((e: any) => ({
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
        is_recurring: e.is_recurring || false,
        recurrence_interval: e.recurrence_interval,
        recurrence_group_id: e.recurrence_group_id,
        source_type: e.source_type || undefined,
        source_id: e.source_id || undefined,
      })) as Expense[];
    },
    enabled: !!selectedCompanyId,
  });

  async function loadAttachments(expense: Expense) {
    const isPayroll = expense.source_type === "payroll" && expense.source_id;
    const recordType = isPayroll ? "payroll" : "expense";
    const recordId = isPayroll ? expense.source_id! : String(expense.id);
    const { data } = await supabase
      .from("attachments")
      .select("*")
      .eq("record_id", recordId)
      .eq("record_type", recordType);
    return (data || []) as unknown as Attachment[];
  }

  async function uploadPendingFiles(recordId: string, files: File[]) {
    for (const file of files) {
      const path = `${selectedCompanyId}/${recordId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("attachments").upload(path, file);
      if (uploadError) continue;
      await supabase.from("attachments").insert({
        record_type: "expense",
        record_id: recordId,
        company_id: selectedCompanyId!,
        file_name: file.name,
        file_path: path,
        file_size: file.size,
        content_type: file.type,
      });
    }
  }

  const createExpense = useMutation({
    mutationFn: async ({ expense, files }: { expense: Omit<Expense, "id">; files: File[] }) => {
      const { data, error } = await supabase.from("expenses").insert({
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
        is_recurring: expense.is_recurring,
        recurrence_interval: expense.recurrence_interval,
      }).select("id").single();
      if (error) throw error;
      if (files.length > 0 && data) await uploadPendingFiles(data.id, files);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
    onError: (err) => toast({ title: "Erro", description: (err as Error).message, variant: "destructive" }),
  });

  const updateExpense = useMutation({
    mutationFn: async ({ expense, files }: { expense: Expense; files: File[] }) => {
      const { error } = await supabase.from("expenses").update({
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
        is_recurring: expense.is_recurring,
        recurrence_interval: expense.recurrence_interval,
      }).eq("id", String(expense.id));
      if (error) throw error;
      if (files.length > 0) await uploadPendingFiles(String(expense.id), files);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: t("updated") });
    },
    onError: (err) => toast({ title: "Erro", description: (err as Error).message, variant: "destructive" }),
  });

  const deleteExpense = useMutation({
    mutationFn: async (expense: Expense) => {
      const attachments = await loadAttachments(expense);
      if (attachments.length > 0) {
        await supabase.storage.from("attachments").remove(attachments.map((a) => a.file_path));
        await supabase.from("attachments").delete().eq("record_id", String(expense.id)).eq("record_type", "expense");
      }
      const { error } = await supabase.from("expenses").delete().eq("id", String(expense.id));
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: t("deleted") });
      setDeletingExpense(null);
    },
    onError: (err) => toast({ title: "Erro", description: (err as Error).message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "all" || e.category === categoryFilter;
      const matchPeriod = periodFilter === "all" || e.date.startsWith(periodFilter);
      return matchSearch && matchCategory && matchPeriod;
    });
  }, [expenses, search, categoryFilter, periodFilter]);

  const handleSave = (expense: Expense, pendingFiles: File[]) => {
    if (editingExpense) {
      updateExpense.mutate({ expense, files: pendingFiles });
      setEditingExpense(null);
    } else {
      createExpense.mutate({ expense, files: pendingFiles });
    }
  };

  async function handleView(expense: Expense) {
    const atts = await loadAttachments(expense);
    setViewAttachments(atts);
    setViewingExpense(expense);
  }

  async function handleEdit(expense: Expense) {
    const atts = await loadAttachments(expense);
    setEditAttachments(atts);
    setEditingExpense(expense);
    setFormOpen(true);
  }

  function handleNewExpense() {
    setEditingExpense(null);
    setEditAttachments([]);
    setFormOpen(true);
  }

  if (!selectedCompanyId) {
    return <div className="text-center text-muted-foreground py-12">{t("selectCompanyFirst")}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("expenses")}</h1>
        <Button onClick={handleNewExpense}>
          <Plus className="mr-2 h-4 w-4" />
          {t("newExpense")}
        </Button>
      </div>

      <ExpenseFilters
        search={search} onSearchChange={setSearch}
        categoryFilter={categoryFilter} onCategoryChange={setCategoryFilter}
        periodFilter={periodFilter} onPeriodChange={setPeriodFilter}
      />

      <ExpenseTable
        data={filtered}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setDeletingExpense}
      />

      <ExpenseForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={handleSave}
        expense={editingExpense}
        attachments={editAttachments}
        onAttachmentsChange={setEditAttachments}
        companyId={selectedCompanyId}
      />

      <ExpenseDetailDialog
        expense={viewingExpense}
        open={!!viewingExpense}
        onOpenChange={(open) => !open && setViewingExpense(null)}
        onEdit={handleEdit}
        attachments={viewAttachments}
        companyId={selectedCompanyId}
      />

      <DeleteConfirmDialog
        open={!!deletingExpense}
        onOpenChange={(open) => !open && setDeletingExpense(null)}
        onConfirm={() => deletingExpense && deleteExpense.mutate(deletingExpense)}
        loading={deleteExpense.isPending}
      />
    </div>
  );
}
