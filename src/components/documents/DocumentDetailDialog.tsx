import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { format, parseISO } from "date-fns";
import { getDocumentStatus } from "./DocumentCard";
import type { CompanyDocument } from "@/data/mockData";

interface DocumentDetailDialogProps {
  document: CompanyDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (doc: CompanyDocument) => void;
}

export function DocumentDetailDialog({ document: doc, open, onOpenChange, onDownload }: DocumentDetailDialogProps) {
  const { t } = useLanguage();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
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

          {isImage && (
            <img
              src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/authenticated/${doc.file_path}`}
              alt={doc.title}
              className="rounded-md max-h-64 object-contain w-full"
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
