import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { format, parseISO } from "date-fns";
import { getDocumentStatus } from "./DocumentCard";
import { supabase } from "@/integrations/supabase/client";
import * as pdfjsLib from "pdfjs-dist";
import type { CompanyDocument } from "@/data/mockData";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface DocumentDetailDialogProps {
  document: CompanyDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (doc: CompanyDocument) => void;
}

function PdfViewer({ url }: { url: string }) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [rendering, setRendering] = useState(true);
  const canvasRef = { current: null as HTMLCanvasElement | null };

  const setCanvasRef = (el: HTMLCanvasElement | null) => {
    canvasRef.current = el;
  };

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    const renderPage = async () => {
      setRendering(true);
      try {
        const pdf = await pdfjsLib.getDocument(url).promise;
        if (cancelled) return;
        setNumPages(pdf.numPages);

        const page = await pdf.getPage(currentPage);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const viewport = page.getViewport({ scale: 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (e) {
        console.error("PDF render error", e);
      } finally {
        if (!cancelled) setRendering(false);
      }
    };

    renderPage();
    return () => { cancelled = true; };
  }, [url, currentPage]);

  return (
    <div className="space-y-2">
      <div className="relative flex justify-center bg-muted rounded-md overflow-auto max-h-[500px]">
        {rendering && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <canvas ref={setCanvasRef} className="max-w-full" />
      </div>
      {numPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{currentPage} / {numPages}</span>
          <Button variant="outline" size="icon" disabled={currentPage >= numPages} onClick={() => setCurrentPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
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
            <img src={signedUrl} alt={doc.title} className="rounded-md max-h-[500px] object-contain w-full" />
          )}

          {!loading && signedUrl && isPdf && (
            <PdfViewer url={signedUrl} />
          )}

          <Button variant="outline" className="w-full" onClick={() => onDownload(doc)}>
            <Download className="h-4 w-4 mr-2" /> {t("downloadDocument")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
