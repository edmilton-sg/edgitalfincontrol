import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { EmployeeTable, type EmployeeRow } from "@/components/employees/EmployeeTable";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { EmployeeDetailDialog } from "@/components/employees/EmployeeDetailDialog";
import { PayrollDialog } from "@/components/employees/PayrollDialog";
import { PayrollTable, type PayrollRow } from "@/components/employees/PayrollTable";
import { PayrollPaymentDialog } from "@/components/employees/PayrollPaymentDialog";
import { PayrollDetailDialog } from "@/components/employees/PayrollDetailDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import type { Attachment } from "@/data/mockData";

export default function EmployeesPage() {
  const { t } = useLanguage();
  const { selectedCompanyId } = useCompany();
  const qc = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<EmployeeRow | null>(null);
  const [viewItem, setViewItem] = useState<EmployeeRow | null>(null);
  const [deleteItem, setDeleteItem] = useState<EmployeeRow | null>(null);
  const [payrollEmployee, setPayrollEmployee] = useState<EmployeeRow | null>(null);
  const [deletePayroll, setDeletePayroll] = useState<PayrollRow | null>(null);
  const [paymentPayroll, setPaymentPayroll] = useState<PayrollRow | null>(null);
  const [viewPayroll, setViewPayroll] = useState<PayrollRow | null>(null);
  const [viewPayrollAttachments, setViewPayrollAttachments] = useState<Attachment[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ["employees", selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("employees")
        .select("*")
        .eq("company_id", selectedCompanyId!)
        .order("name");
      return data ?? [];
    },
  });

  // Fetch payroll
  const { data: payrollData = [] } = useQuery({
    queryKey: ["payroll", selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("payroll")
        .select("*")
        .eq("company_id", selectedCompanyId!)
        .order("reference_month", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || e.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [employees, search, statusFilter]);

  const filteredPayroll = useMemo(() => {
    if (selectedEmployee === "all") return payrollData;
    return payrollData.filter((p) => p.employee_id === selectedEmployee);
  }, [payrollData, selectedEmployee]);

  // Employee upsert
  const upsertMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editItem) {
        const { error } = await supabase.from("employees").update(data).eq("id", editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("employees").insert({ ...data, company_id: selectedCompanyId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success(editItem ? t("updated") : t("employeeSaved"));
      setEditItem(null);
    },
  });

  // Delete employee
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: ["payroll"] });
      toast.success(t("deleted"));
    },
  });

  // Process payroll
  const payrollMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("payroll").insert({
        ...data,
        company_id: selectedCompanyId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll"] });
      toast.success(t("payrollProcessed"));
    },
  });

  // Mark payroll paid + upload files + create expense
  async function handlePaymentConfirm(data: {
    payroll: PayrollRow;
    paymentDate: string;
    invoiceFile: File;
    proofFile: File;
    boletoFile?: File;
  }) {
    setPaymentLoading(true);
    try {
      const p = data.payroll;

      // Upload files helper
      const uploadFile = async (file: File, label: string) => {
        const filePath = `${selectedCompanyId}/payroll/${p.id}/${label}_${file.name}`;
        const { error: upErr } = await supabase.storage.from("attachments").upload(filePath, file);
        if (upErr) throw upErr;
        const { error: attErr } = await supabase.from("attachments").insert({
          record_type: "payroll",
          record_id: p.id,
          company_id: selectedCompanyId!,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          content_type: file.type || "application/octet-stream",
        });
        if (attErr) throw attErr;
      };

      // Upload required files
      await uploadFile(data.invoiceFile, "invoice");
      await uploadFile(data.proofFile, "proof");
      if (data.boletoFile) await uploadFile(data.boletoFile, "boleto");

      // Update payroll status
      const { error: e1 } = await supabase
        .from("payroll")
        .update({ status: "paid", payment_date: data.paymentDate })
        .eq("id", p.id);
      if (e1) throw e1;

      // Create expense
      const emp = employees.find((e) => e.id === p.employee_id);
      const desc = `${t("payrollExpense")} — ${emp?.name ?? ""}`;
      const { error: e2 } = await supabase.from("expenses").insert({
        company_id: selectedCompanyId!,
        description: desc,
        amount: p.gross_salary + p.fgts_amount,
        date: data.paymentDate,
        category: t("payrollExpense"),
        source_type: "payroll",
        source_id: p.id,
      });
      if (e2) throw e2;

      qc.invalidateQueries({ queryKey: ["payroll"] });
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success(t("paymentRegistered"));
      setPaymentPayroll(null);
    } catch (err: any) {
      toast.error(err.message ?? "Error");
    } finally {
      setPaymentLoading(false);
    }
  }

  // Delete payroll
  const deletePayrollMutation = useMutation({
    mutationFn: async (p: PayrollRow) => {
      // Delete linked expense first
      await supabase.from("expenses").delete().eq("source_type", "payroll").eq("source_id", p.id);
      const { error } = await supabase.from("payroll").delete().eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll"] });
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success(t("deleted"));
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("employees")}</h1>
        <Button onClick={() => { setEditItem(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> {t("newEmployee")}
        </Button>
      </div>

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees">{t("employees")}</TabsTrigger>
          <TabsTrigger value="payroll">{t("payrollTitle")}</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder={t("searchEmployee")} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                <SelectItem value="active">{t("employeeActive")}</SelectItem>
                <SelectItem value="terminated">{t("employeeTerminated")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <EmployeeTable
            data={filtered}
            onView={setViewItem}
            onEdit={(e) => { setEditItem(e); setFormOpen(true); }}
            onDelete={setDeleteItem}
          />
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder={t("allEmployees")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allEmployees")}</SelectItem>
                {employees.filter(e => e.status === "active").map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedEmployee !== "all" && (
              <Button onClick={() => {
                const emp = employees.find(e => e.id === selectedEmployee);
                if (emp) setPayrollEmployee(emp);
              }}>
                <Plus className="h-4 w-4 mr-2" /> {t("processPayroll")}
              </Button>
            )}
          </div>

          <PayrollTable
            data={filteredPayroll}
            onMarkPaid={(p) => setPaymentPayroll(p)}
            onDelete={setDeletePayroll}
            onView={async (p) => {
              const { data } = await supabase
                .from("attachments")
                .select("*")
                .eq("record_id", p.id)
                .eq("record_type", "payroll");
              setViewPayrollAttachments((data || []) as unknown as Attachment[]);
              setViewPayroll(p);
            }}
          />
        </TabsContent>
      </Tabs>

      <EmployeeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editItem={editItem}
        onSubmit={(data) => upsertMutation.mutate(data)}
      />

      <EmployeeDetailDialog
        open={!!viewItem}
        onOpenChange={(o) => !o && setViewItem(null)}
        item={viewItem}
      />

      <DeleteConfirmDialog
        open={!!deleteItem}
        onOpenChange={(o) => !o && setDeleteItem(null)}
        onConfirm={() => { if (deleteItem) deleteMutation.mutate(deleteItem.id); setDeleteItem(null); }}
      />

      <DeleteConfirmDialog
        open={!!deletePayroll}
        onOpenChange={(o) => !o && setDeletePayroll(null)}
        onConfirm={() => { if (deletePayroll) deletePayrollMutation.mutate(deletePayroll); setDeletePayroll(null); }}
      />

      <PayrollDialog
        open={!!payrollEmployee}
        onOpenChange={(o) => !o && setPayrollEmployee(null)}
        employee={payrollEmployee}
        onSubmit={(data) => payrollMutation.mutate(data)}
      />

      <PayrollPaymentDialog
        open={!!paymentPayroll}
        onOpenChange={(o) => !o && setPaymentPayroll(null)}
        payroll={paymentPayroll}
        onConfirm={handlePaymentConfirm}
        loading={paymentLoading}
      />

      <PayrollDetailDialog
        open={!!viewPayroll}
        onOpenChange={(o) => !o && setViewPayroll(null)}
        payroll={viewPayroll}
        employeeName={employees.find((e) => e.id === viewPayroll?.employee_id)?.name}
        attachments={viewPayrollAttachments}
        companyId={selectedCompanyId!}
      />
    </div>
  );
}
