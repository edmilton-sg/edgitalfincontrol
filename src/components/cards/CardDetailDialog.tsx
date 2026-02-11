import { useLanguage } from "@/i18n/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { FileAttachments } from "@/components/shared/FileAttachments";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Attachment } from "@/data/mockData";

interface CardData {
  id: string;
  name: string;
  brand: string;
  last_digits: string | null;
  card_limit: number;
  current_balance: number;
  closing_day: number;
  due_day: number;
}

interface CardDetailDialogProps {
  card: CardData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  companyId: string;
}

export function CardDetailDialog({ card, open, onOpenChange, onEdit, companyId }: CardDetailDialogProps) {
  const { t } = useLanguage();

  const { data: attachments = [], refetch } = useQuery({
    queryKey: ["attachments", "credit_card", card?.id],
    queryFn: async () => {
      if (!card) return [];
      const { data } = await supabase
        .from("attachments")
        .select("*")
        .eq("record_id", card.id)
        .eq("record_type", "credit_card");
      return (data || []) as unknown as Attachment[];
    },
    enabled: !!card && open,
  });

  if (!card) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {t("cardDetails")}
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="mr-1 h-3 w-3" /> {t("edit")}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t("cardName")}</span>
              <p className="font-medium">{card.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t("cardBrand")}</span>
              <p className="font-medium uppercase">{card.brand}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t("lastDigits")}</span>
              <p className="font-medium">{card.last_digits || "0000"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t("cardLimit")}</span>
              <p className="font-medium">R$ {card.card_limit.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t("currentCardBalance")}</span>
              <p className="font-medium">R$ {card.current_balance.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t("closingDay")}</span>
              <p className="font-medium">{card.closing_day}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t("dueDay")}</span>
              <p className="font-medium">{card.due_day}</p>
            </div>
          </div>

          <FileAttachments
            attachments={attachments}
            recordId={card.id}
            recordType="credit_card"
            companyId={companyId}
            onAttachmentsChange={() => refetch()}
            readOnly
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
