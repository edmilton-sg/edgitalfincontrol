import { useState } from "react";
import { Plus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";
import { CardList } from "@/components/cards/CardList";
import { CardForm } from "@/components/cards/CardForm";
import { CardTransactions } from "@/components/cards/CardTransactions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function CardsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { selectedCompanyId } = useCompany();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["credit_cards", selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return [];
      const { data, error } = await supabase
        .from("credit_cards")
        .select("*")
        .eq("company_id", selectedCompanyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompanyId,
  });

  const createCard = useMutation({
    mutationFn: async (card: {
      name: string; brand: string; last_digits: string;
      card_limit: number; closing_day: number; due_day: number;
    }) => {
      const { error } = await supabase.from("credit_cards").insert({
        ...card,
        company_id: selectedCompanyId!,
        current_balance: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit_cards"] });
      toast({ title: t("cardCreated") });
    },
  });

  if (!selectedCompanyId) {
    return <div className="text-center text-muted-foreground py-12">{t("selectCompanyFirst")}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("cards")}</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("newCard")}
        </Button>
      </div>

      <CardList
        cards={cards}
        isLoading={isLoading}
        selectedCardId={selectedCardId}
        onSelectCard={setSelectedCardId}
      />

      {selectedCardId && (
        <CardTransactions cardId={selectedCardId} companyId={selectedCompanyId} />
      )}

      <CardForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={(card) => createCard.mutate(card)}
      />
    </div>
  );
}
