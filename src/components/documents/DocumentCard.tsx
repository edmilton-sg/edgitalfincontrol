import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Pencil, Trash2, FileText, Image, File } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { differenceInDays, parseISO, isAfter, isBefore } from "date-fns";
import type { CompanyDocument } from "@/data/mockData";

interface DocumentCardProps {
  document: CompanyDocument;
  onDownload: (doc: CompanyDocument) => void;
  onEdit: (doc: CompanyDocument) => void;
  onDelete: (doc: CompanyDocument) => void;
  onClick: (doc: CompanyDocument) => void;
}

function getDocumentStatus(doc: CompanyDocument) {
  if (!doc.expires_at) return "no-expiry";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = parseISO(doc.expires_at);
  if (isBefore(expiryDate, today)) return "expired";
  const daysLeft = differenceInDays(expiryDate, today);
  if (daysLeft <= doc.alert_days_before) return "expiring";
  return "valid";
}

function getFileIcon(contentType: string) {
  if (contentType.startsWith("image/")) return Image;
  if (contentType === "application/pdf") return FileText;
  return File;
}

export function DocumentCard({ document: doc, onDownload, onEdit, onDelete, onClick }: DocumentCardProps) {
  const { t } = useLanguage();
  const status = getDocumentStatus(doc);
  const FileIcon = getFileIcon(doc.content_type);

  const statusConfig = {
    "no-expiry": { label: t("noExpiry"), variant: "secondary" as const, className: "bg-muted text-muted-foreground" },
    valid: { label: t("valid"), variant: "default" as const, className: "bg-success text-success-foreground" },
    expiring: { label: t("expiringSoon"), variant: "default" as const, className: "bg-warning text-warning-foreground" },
    expired: { label: t("expired"), variant: "destructive" as const, className: "bg-destructive text-destructive-foreground" },
  };

  const cfg = statusConfig[status];

  const daysInfo = (() => {
    if (!doc.expires_at) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = parseISO(doc.expires_at);
    const diff = differenceInDays(expiryDate, today);
    if (diff < 0) return `${Math.abs(diff)} ${t("daysOverdue")}`;
    if (diff === 0) return t("expired");
    return `${diff} ${t("daysRemaining")}`;
  })();

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick(doc)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FileIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
            <h3 className="font-semibold truncate">{doc.title}</h3>
          </div>
          <Badge className={cfg.className}>{cfg.label}</Badge>
        </div>

        {doc.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{doc.description}</p>
        )}

        {daysInfo && (
          <p className="text-xs text-muted-foreground">{daysInfo}</p>
        )}

        <div className="flex gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDownload(doc)}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(doc)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(doc)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { getDocumentStatus };
