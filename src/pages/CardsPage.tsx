import { useState } from "react";
import { Plus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";
import { CardList } from "@/components/cards/CardList";
import { CardForm } from "@/components/cards/CardForm";
import { CardTransactions } from "@/components/cards/CardTransactions";
import { CardDetailDialog } from "@/components/cards/CardDetailDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreditCardData {
  id: string;
  name: string;
  brand: string;
  last_digits: string | null;
  card_limit: number;
  current_balance: number;
  closing_day: number;
  due_day: number;
}

export default function CardsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { selectedCompanyId } = useCompany();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardData | null>(null);
  const [viewingCard, setViewingCard] = useState<CreditCardData | null>(null);
  const [deletingCard, setDeletingCard] = useState<CreditCardData | null>(null);
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

  const updateCard = useMutation({
    mutationFn: async (card: {
      name: string; brand: string; last_digits: string;
      card_limit: number; closing_day: number; due_day: number;
    }) => {
      if (!editingCard) return;
      const { error } = await supabase.from("credit_cards").update(card).eq("id", editingCard.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit_cards"] });
      setEditingCard(null);
      toast({ title: t("cardUpdated") });
    },
  });

  const deleteCard = useMutation({
    mutationFn: async () => {
      if (!deletingCard) return;
      // Delete transactions first
      await supabase.from("card_transactions").delete().eq("card_id", deletingCard.id);
      // Delete attachments records
      await supabase.from("attachments").delete().eq("record_id", deletingCard.id).eq("record_type", "credit_card");
      // Delete card
      const { error } = await supabase.from("credit_cards").delete().eq("id", deletingCard.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit_cards"] });
      if (selectedCardId === deletingCard?.id) setSelectedCardId(null);
      setDeletingCard(null);
      toast({ title: t("cardDeleted") });
    },
  });

  function handleSave(card: { name: string; brand: string; last_digits: string; card_limit: number; closing_day: number; due_day: number }) {
    if (editingCard) {
      updateCard.mutate(card);
    } else {
      createCard.mutate(card);
    }
  }

  if (!selectedCompanyId) {
    return <div className="text-center text-muted-foreground py-12">{t("selectCompanyFirst")}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("cards")}</h1>
        <Button onClick={() => { setEditingCard(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          {t("newCard")}
        </Button>
      </div>

      <CardList
        cards={cards}
        isLoading={isLoading}
        selectedCardId={selectedCardId}
        onSelectCard={setSelectedCardId}
        onView={(card) => setViewingCard(card)}
        onEdit={(card) => { setEditingCard(card); setFormOpen(true); }}
        onDelete={(card) => setDeletingCard(card)}
      />

      {selectedCardId && (
        <CardTransactions cardId={selectedCardId} companyId={selectedCompanyId} />
      )}

      <CardForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={handleSave}
        card={editingCard}
      />

      <CardDetailDialog
        card={viewingCard}
        open={!!viewingCard}
        onOpenChange={(o) => { if (!o) setViewingCard(null); }}
        onEdit={() => { setEditingCard(viewingCard); setViewingCard(null); setFormOpen(true); }}
        companyId={selectedCompanyId}
      />

      <DeleteConfirmDialog
        open={!!deletingCard}
        onOpenChange={(o) => { if (!o) setDeletingCard(null); }}
        onConfirm={() => deleteCard.mutate()}
        loading={deleteCard.isPending}
      />
    </div>
  );
}
