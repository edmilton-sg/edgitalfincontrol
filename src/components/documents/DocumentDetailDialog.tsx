import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { format, parseISO } from "date-fns";
import { getDocumentStatus } from "./DocumentCard";
import { supabase } from "@/integrations/supabase/client";
import type { CompanyDocument } from "@/data/mockData";

interface DocumentDetailDialogProps {
  document: CompanyDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (doc: CompanyDocument) => void;
}

export function DocumentDetailDialog({ document: doc, open, onOpenChange, onDownload }: DocumentDetailDialogProps) {
  const { t } = useLanguage();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !doc) {
      setSignedUrl(null);
      return;
    }

    const isPreviewable = doc.content_type.startsWith("image/") || doc.content_type === "application/pdf";
    if (!isPreviewable) return;

    setLoading(true);
    supabase.storage
      .from("attachments")
      .createSignedUrl(doc.file_path, 3600)
      .then(({ data, error }) => {
        if (!error && data?.signedUrl) setSignedUrl(data.signedUrl);
      })
      .finally(() => setLoading(false));
  }, [open, doc?.id]);

  if (!doc) return null;

  const status = getDocumentStatus(doc);
  const statusConfig: Record<string, { label: string; className: string }> = {
    "no-expiry": { label: t("noExpiry"), className: "bg-muted text-muted-foreground" },
    valid: { label: t("valid"), className: "bg-success text-success-foreground" },
    expiring: { label: t("expiringSoon"), className: "bg-warning text-warning-foreground" },
    expired: { label: t("expired"), className: "bg-destructive text-destructive-foreground" },
  };
  const cfg = statusConfig[status];

  const isImage = doc.content_type.startsWith("image/");
  const isPdf = doc.content_type === "application/pdf";
  const hasPreview = isImage || isPdf;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={hasPreview ? "max-w-3xl" : "max-w-lg"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {doc.title}
            <Badge className={cfg.className}>{cfg.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {doc.description && <p className="text-sm text-muted-foreground">{doc.description}</p>}

          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">{t("uploadFile")}</span>
            <span className="truncate">{doc.file_name}</span>

            {doc.expires_at && (
              <>
                <span className="text-muted-foreground">{t("expiresAt")}</span>
                <span>{format(parseISO(doc.expires_at), "dd/MM/yyyy")}</span>
                <span className="text-muted-foreground">{t("alertDaysBefore")}</span>
                <span>{doc.alert_days_before} dias</span>
              </>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && signedUrl && isImage && (
            <img
              src={signedUrl}
              alt={doc.title}
              className="rounded-md max-h-[500px] object-contain w-full"
            />
          )}

          {!loading && signedUrl && isPdf && (
            <iframe
              src={signedUrl}
              title={doc.title}
              className="w-full h-[500px] rounded-md border"
            />
          )}

          <Button variant="outline" className="w-full" onClick={() => onDownload(doc)}>
            <Download className="h-4 w-4 mr-2" /> {t("downloadDocument")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
