import { useLanguage } from "@/i18n/LanguageContext";
import { CreditCard, Eye, Pencil, Trash2, ArchiveRestore } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

interface CreditCardData {
  id: string;
  name: string;
  brand: string;
  last_digits: string | null;
  card_limit: number;
  current_balance: number;
  closing_day: number;
  due_day: number;
  status?: string;
}

interface CardListProps {
  cards: CreditCardData[];
  isLoading: boolean;
  selectedCardId: string | null;
  onSelectCard: (id: string) => void;
  onView?: (card: CreditCardData) => void;
  onEdit?: (card: CreditCardData) => void;
  onDelete?: (card: CreditCardData) => void;
  onArchive?: (card: CreditCardData) => void;
  onUnarchive?: (card: CreditCardData) => void;
}

const brandGradients: Record<string, string> = {
  visa: "from-blue-600 to-blue-900",
  mastercard: "from-red-500 to-orange-600",
  elo: "from-yellow-500 to-yellow-700",
  amex: "from-emerald-500 to-emerald-800",
};

export function CardList({ cards, isLoading, selectedCardId, onSelectCard, onView, onEdit, onDelete, onArchive, onUnarchive }: CardListProps) {
  const { t } = useLanguage();

  const activeCards = useMemo(() => cards.filter(c => (c.status || "active") === "active"), [cards]);
  const archivedCards = useMemo(() => cards.filter(c => c.status === "archived"), [cards]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CreditCard size={48} className="mx-auto mb-4 opacity-30" />
        <p>{t("noCards")}</p>
      </div>
    );
  }

  function renderCard(card: CreditCardData, isArchived: boolean) {
    const usedPercent = card.card_limit > 0 ? (card.current_balance / card.card_limit) * 100 : 0;
    const gradient = brandGradients[card.brand] ?? brandGradients.visa;
    const isSelected = card.id === selectedCardId;

    return (
      <button
        key={card.id}
        onClick={() => onSelectCard(card.id)}
        className={cn(
          "relative rounded-xl p-5 text-white text-left transition-all bg-gradient-to-br",
          gradient,
          isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]",
          "hover:scale-[1.01] hover:shadow-lg",
          isArchived && "opacity-50"
        )}
      >
        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex gap-1">
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onView?.(card); }}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <Eye className="h-3.5 w-3.5 text-white/70" />
          </span>
          {isArchived ? (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onUnarchive?.(card); }}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
              title={t("unarchiveCard")}
            >
              <ArchiveRestore className="h-3.5 w-3.5 text-white/70" />
            </span>
          ) : (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onEdit?.(card); }}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5 text-white/70" />
            </span>
          )}
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onDelete?.(card); }}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5 text-white/70" />
          </span>
        </div>

        <div className="flex justify-between items-start mb-6 pr-24">
          <span className="text-sm font-medium opacity-90">{card.name}</span>
          <span className="text-xs uppercase font-bold opacity-80">{card.brand}</span>
        </div>
        <div className="text-lg font-mono tracking-widest mb-4">
          •••• •••• •••• {card.last_digits || "0000"}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs opacity-80">
            <span>{t("usedLimit")}: R$ {card.current_balance.toFixed(2)}</span>
            <span>R$ {card.card_limit.toFixed(2)}</span>
          </div>
          <Progress value={usedPercent} className="h-1.5 bg-white/20" />
        </div>
        <div className="flex justify-between mt-3 text-xs opacity-70">
          <span>{t("closingDay")}: {card.closing_day}</span>
          <span>{t("dueDay")}: {card.due_day}</span>
        </div>
      </button>
    );
  }

  return (
    <div className="space-y-6">
      {activeCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeCards.map((card) => renderCard(card, false))}
        </div>
      )}

      {archivedCards.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">{t("archivedCards")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedCards.map((card) => renderCard(card, true))}
          </div>
        </div>
      )}
    </div>
  );
}
