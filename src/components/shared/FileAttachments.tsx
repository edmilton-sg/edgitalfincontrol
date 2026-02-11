import { useState } from "react";
import { Paperclip, X, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Attachment } from "@/data/mockData";

interface FileAttachmentsProps {
  attachments: Attachment[];
  recordId?: string;
  recordType: "revenue" | "expense" | "credit_card" | "card_transaction" | "card_invoice";
  companyId: string;
  onAttachmentsChange?: (attachments: Attachment[]) => void;
  readOnly?: boolean;
  /** Files pending upload (for new records not yet saved) */
  pendingFiles?: File[];
  onPendingFilesChange?: (files: File[]) => void;
}

export function FileAttachments({
  attachments,
  recordId,
  recordType,
  companyId,
  onAttachmentsChange,
  readOnly = false,
  pendingFiles = [],
  onPendingFilesChange,
}: FileAttachmentsProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const totalCount = attachments.length + pendingFiles.length;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = 5 - totalCount;
    const toAdd = files.slice(0, remaining);

    for (const file of toAdd) {
      if (file.size > 20 * 1024 * 1024) {
        toast({ title: t("fileTooBig"), variant: "destructive" });
        continue;
      }

      if (recordId) {
        // Upload immediately for existing records
        await uploadFile(file);
      } else {
        // Queue for later upload
        onPendingFilesChange?.([...pendingFiles, file]);
      }
    }

    e.target.value = "";
  }

  async function uploadFile(file: File) {
    if (!recordId) return;
    setUploading(true);
    try {
      const path = `${companyId}/${recordType}/${recordId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("attachments").insert({
        record_type: recordType,
        record_id: recordId,
        company_id: companyId,
        file_name: file.name,
        file_path: path,
        file_size: file.size,
        content_type: file.type,
      });
      if (dbError) throw dbError;

      // Refresh attachments
      const { data } = await supabase
        .from("attachments")
        .select("*")
        .eq("record_id", recordId)
        .eq("record_type", recordType);
      if (data) onAttachmentsChange?.(data as unknown as Attachment[]);
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(attachment: Attachment) {
    try {
      await supabase.storage.from("attachments").remove([attachment.file_path]);
      await supabase.from("attachments").delete().eq("id", attachment.id);
      onAttachmentsChange?.(attachments.filter((a) => a.id !== attachment.id));
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    }
  }

  async function handleDownload(attachment: Attachment) {
    const { data } = await supabase.storage
      .from("attachments")
      .createSignedUrl(attachment.file_path, 60);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  }

  function removePending(index: number) {
    onPendingFilesChange?.(pendingFiles.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t("attachments")}</span>
        <span className="text-xs text-muted-foreground">{totalCount}/5</span>
      </div>

      {attachments.map((a) => (
        <div key={a.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate flex-1">{a.file_name}</span>
          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDownload(a)}>
            <Download className="h-3 w-3" />
          </Button>
          {!readOnly && (
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(a)}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}

      {pendingFiles.map((f, i) => (
        <div key={i} className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm">
          <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate flex-1">{f.name}</span>
          {!readOnly && (
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removePending(i)}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}

      {!readOnly && totalCount < 5 && (
        <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-primary hover:underline">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          {t("addAttachment")}
          <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileSelect} multiple />
        </label>
      )}

      {attachments.length === 0 && pendingFiles.length === 0 && readOnly && (
        <p className="text-sm text-muted-foreground">{t("noAttachments")}</p>
      )}
    </div>
  );
}
