import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { format, parseISO } from "date-fns";
import { getDocumentStatus } from "./DocumentCard";
import { supabase } from "@/integrations/supabase/client";
import { PdfCanvasPreview } from "./PdfCanvasPreview";
import type { CompanyDocument } from "@/data/mockData";

interface DocumentDetailDialogProps {
  document: CompanyDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (doc: CompanyDocument) => void;
}

export function DocumentDetailDialog({ document: doc, open, onOpenChange, onDownload }: DocumentDetailDialogProps) {
  const { t } = useLanguage();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const prevUrlRef = useRef<string | null>(null);

  useEffect(() => {
    // Cleanup previous blob URL
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = null;
    }

    if (!open || !doc) {
      setPreviewUrl(null);
      setPreviewError(false);
      return;
    }

    const isPreviewable = doc.content_type.startsWith("image/") || doc.content_type === "application/pdf";
    if (!isPreviewable) return;

    let cancelled = false;
    setLoading(true);
    setPreviewError(false);

    supabase.storage
      .from("attachments")
      .download(doc.file_path)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setPreviewError(true);
          setLoading(false);
          return;
        }
        const objectUrl = URL.createObjectURL(data);
        prevUrlRef.current = objectUrl;
        setPreviewUrl(objectUrl);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, doc?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = null;
      }
    };
  }, []);

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
          <DialogTitle>{doc.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
              {cfg.label}
            </span>
          </DialogDescription>
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

          {!loading && previewError && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Não foi possível carregar o preview. Use o botão abaixo para baixar o arquivo.
            </p>
          )}

          {!loading && previewUrl && isImage && (
            <img src={previewUrl} alt={doc.title} className="rounded-md max-h-[500px] object-contain w-full" />
          )}

          {!loading && previewUrl && isPdf && (
            <PdfCanvasPreview url={previewUrl} />
          )}

          <Button variant="outline" className="w-full" onClick={() => onDownload(doc)}>
            <Download className="h-4 w-4 mr-2" /> {t("downloadDocument")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
