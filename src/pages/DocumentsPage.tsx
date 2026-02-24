import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { DocumentFormDialog } from "@/components/documents/DocumentFormDialog";
import { DocumentDetailDialog } from "@/components/documents/DocumentDetailDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import type { CompanyDocument } from "@/data/mockData";

export default function DocumentsPage() {
  const { t } = useLanguage();
  const { selectedCompanyId } = useCompany();
  const qc = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<CompanyDocument | null>(null);
  const [detailDoc, setDetailDoc] = useState<CompanyDocument | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<CompanyDocument | null>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["company_documents", selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_documents")
        .select("*")
        .eq("company_id", selectedCompanyId!)
        .order("title");
      if (error) throw error;
      return data as CompanyDocument[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ formData, existingId }: { formData: any; existingId?: string }) => {
      let filePath = existingId ? undefined : "";
      let fileName = "";
      let fileSize = 0;
      let contentType = "";

      const docId = existingId || crypto.randomUUID();

      if (formData.file) {
        const file = formData.file as File;
        fileName = file.name;
        fileSize = file.size;
        contentType = file.type;
        filePath = `${selectedCompanyId}/documents/${docId}/${file.name}`;

        // Remove old file if editing
        if (existingId) {
          const existing = documents.find((d) => d.id === existingId);
          if (existing) {
            await supabase.storage.from("attachments").remove([existing.file_path]);
          }
        }

        const { error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(filePath, file, { upsert: true });
        if (uploadError) throw uploadError;
      }

      const record: any = {
        title: formData.title,
        description: formData.description || null,
        expires_at: formData.expires_at || null,
        alert_days_before: formData.alert_days_before,
      };

      if (existingId) {
        if (formData.file) {
          record.file_name = fileName;
          record.file_path = filePath;
          record.file_size = fileSize;
          record.content_type = contentType;
        }
        const { error } = await supabase.from("company_documents").update(record).eq("id", existingId);
        if (error) throw error;
      } else {
        record.id = docId;
        record.company_id = selectedCompanyId;
        record.file_name = fileName;
        record.file_path = filePath;
        record.file_size = fileSize;
        record.content_type = contentType;
        const { error } = await supabase.from("company_documents").insert(record);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company_documents"] });
      toast.success(t("save"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: CompanyDocument) => {
      await supabase.storage.from("attachments").remove([doc.file_path]);
      const { error } = await supabase.from("company_documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company_documents"] });
      toast.success(t("deleteDocument"));
      setDeleteDoc(null);
    },
  });

  const handleDownload = async (doc: CompanyDocument) => {
    const { data, error } = await supabase.storage.from("attachments").download(doc.file_path);
    if (error || !data) return toast.error(error?.message || "Download failed");
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("documents")}</h1>
        <Button onClick={() => { setEditDoc(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> {t("newDocument")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <FileText className="h-12 w-12" />
          <p>{t("noDocuments")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onDownload={handleDownload}
              onEdit={(d) => { setEditDoc(d); setFormOpen(true); }}
              onDelete={setDeleteDoc}
              onClick={setDetailDoc}
            />
          ))}
        </div>
      )}

      <DocumentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        document={editDoc}
        onSave={(formData, existingId) => saveMutation.mutate({ formData, existingId })}
      />

      <DocumentDetailDialog
        document={detailDoc}
        open={!!detailDoc}
        onOpenChange={(o) => !o && setDetailDoc(null)}
        onDownload={handleDownload}
      />

      <DeleteConfirmDialog
        open={!!deleteDoc}
        onOpenChange={(o) => !o && setDeleteDoc(null)}
        onConfirm={() => deleteDoc && deleteMutation.mutate(deleteDoc)}
        
      />
    </div>
  );
}
